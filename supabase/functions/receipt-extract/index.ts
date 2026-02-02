import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ExtractionResult {
  vendor_payee: string;
  expense_date: string;
  amount: number;
  category_id: string | null;
  category_guess: string;
  subcategory_guess: string | null;
  confidence: {
    vendor: 'high' | 'medium' | 'low';
    date: 'high' | 'medium' | 'low';
    amount: 'high' | 'medium' | 'low';
    category: 'high' | 'medium' | 'low';
  };
  expense_title: string;
  line_items?: Array<{ description: string; amount: number }>;
  raw: object;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company_id, attachment_path, transaction_type } = await req.json();

    console.log('Receipt extraction request:', { company_id, attachment_path, transaction_type });

    // Validate inputs
    if (!company_id || !attachment_path) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: company_id and attachment_path' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate signed URL for the image
    console.log('Generating signed URL for:', attachment_path);
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('expense-attachments')
      .createSignedUrl(attachment_path, 3600); // 1 hour expiry

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Error creating signed URL:', signedUrlError);
      return new Response(
        JSON.stringify({ error: 'Failed to access receipt image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Signed URL created successfully');

    // Fetch company's expense categories for mapping
    const { data: categories, error: categoriesError } = await supabase
      .from('expense_categories')
      .select('id, name, category_level, parent_category_id, category_type')
      .eq('company_id', company_id)
      .or(`category_type.eq.${transaction_type},category_type.eq.both`);

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
    }

    const categoryNames = (categories || []).map(c => c.name).join(', ');
    console.log('Available categories:', categoryNames);

    // Build AI prompt
    const systemPrompt = `You are a receipt data extraction assistant. Analyze receipt images and extract structured data accurately.
Always return valid JSON. Be precise with amounts and dates. If information is unclear, provide your best guess with lower confidence.`;

    const userPrompt = `Analyze this receipt image and extract the following information:

1. Vendor/Store name (the business name on the receipt)
2. Date of purchase (format: YYYY-MM-DD)
3. Total amount paid (numeric value only, no currency symbols)
4. Best category guess from this list: ${categoryNames || 'General, Office Supplies, Travel, Food, Utilities, Equipment, Services'}
5. Subcategory if applicable
6. Individual line items if visible (description and amount for each)

Return ONLY valid JSON in this exact format:
{
  "vendor": "Store Name",
  "date": "YYYY-MM-DD",
  "total": 123.45,
  "category": "Category Name",
  "subcategory": "Subcategory Name or null",
  "confidence": {
    "vendor": "high|medium|low",
    "date": "high|medium|low",
    "amount": "high|medium|low",
    "category": "high|medium|low"
  },
  "line_items": [
    {"description": "Item 1", "amount": 10.00},
    {"description": "Item 2", "amount": 15.00}
  ]
}

Important:
- Use "high" confidence when text is clearly readable
- Use "medium" when text is partially obscured or unclear
- Use "low" when you're making an educated guess
- For dates, try to determine the year from context (current year if unclear)
- Return null for subcategory if not applicable`;

    // Call Lovable AI Gateway with the image
    console.log('Calling Lovable AI Gateway...');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              { type: 'image_url', image_url: { url: signedUrlData.signedUrl } }
            ]
          }
        ]
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to analyze receipt' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    // Extract the content from the response
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ error: 'Failed to extract data from receipt' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON from the AI response
    let extracted;
    try {
      // Try to extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1]?.trim() || content.trim();
      extracted = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError, 'Content:', content);
      return new Response(
        JSON.stringify({ error: 'Failed to parse receipt data', raw: content }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Extracted data:', extracted);

    // Map category guess to actual category ID
    let matchedCategoryId: string | null = null;
    let matchedSubcategoryId: string | null = null;

    if (categories && categories.length > 0 && extracted.category) {
      const categoryGuess = extracted.category.toLowerCase();
      const subcategoryGuess = extracted.subcategory?.toLowerCase();

      // First try exact match
      let matchedCategory = categories.find(cat => 
        cat.name.toLowerCase() === categoryGuess && cat.category_level === 'parent'
      );

      // Then try partial match
      if (!matchedCategory) {
        matchedCategory = categories.find(cat => 
          cat.category_level === 'parent' && (
            cat.name.toLowerCase().includes(categoryGuess) ||
            categoryGuess.includes(cat.name.toLowerCase())
          )
        );
      }

      if (matchedCategory) {
        matchedCategoryId = matchedCategory.id;

        // Try to find matching subcategory
        if (subcategoryGuess) {
          const matchedSubcategory = categories.find(cat =>
            cat.category_level === 'subcategory' &&
            cat.parent_category_id === matchedCategory.id &&
            (cat.name.toLowerCase() === subcategoryGuess ||
             cat.name.toLowerCase().includes(subcategoryGuess) ||
             subcategoryGuess.includes(cat.name.toLowerCase()))
          );
          if (matchedSubcategory) {
            matchedSubcategoryId = matchedSubcategory.id;
          }
        }
      }
    }

    // Use subcategory ID if found, otherwise use parent category ID
    const finalCategoryId = matchedSubcategoryId || matchedCategoryId;

    // Build the response
    const result: ExtractionResult = {
      vendor_payee: extracted.vendor || 'Unknown Vendor',
      expense_date: extracted.date || new Date().toISOString().split('T')[0],
      amount: typeof extracted.total === 'number' ? extracted.total : parseFloat(extracted.total) || 0,
      category_id: finalCategoryId,
      category_guess: extracted.category || 'General',
      subcategory_guess: extracted.subcategory || null,
      confidence: {
        vendor: extracted.confidence?.vendor || 'medium',
        date: extracted.confidence?.date || 'medium',
        amount: extracted.confidence?.amount || 'medium',
        category: extracted.confidence?.category || 'low'
      },
      expense_title: `${extracted.vendor || 'Receipt'} - ${extracted.date || new Date().toISOString().split('T')[0]}`,
      line_items: extracted.line_items || [],
      raw: extracted
    };

    console.log('Final extraction result:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Receipt extraction error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
