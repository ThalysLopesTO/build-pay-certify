import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const { token, newPassword }: ResetPasswordRequest = await req.json();
    console.log('Password reset attempt with token:', token);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify the reset token
    const { data: resetToken, error: tokenError } = await supabaseClient
      .from('password_reset_tokens')
      .select('user_id, expires_at, used')
      .eq('token', token)
      .single();

    if (tokenError || !resetToken) {
      console.log('Invalid token:', token);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid or expired reset token" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if token is already used
    if (resetToken.used) {
      console.log('Token already used:', token);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "This reset token has already been used" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(resetToken.expires_at);
    if (now > expiresAt) {
      console.log('Token expired:', token, 'expired at:', expiresAt);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "This reset token has expired. Please request a new one." 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get user details
    const { data: userProfile, error: userError } = await supabaseClient
      .from('user_profiles')
      .select('user_id, email, first_name, last_name, company_id')
      .eq('user_id', resetToken.user_id)
      .single();

    if (userError || !userProfile) {
      console.error('User not found for token:', token);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "User not found" 
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Update the user's password
    const { error: passwordError } = await supabaseClient.auth.admin.updateUserById(
      resetToken.user_id,
      { password: newPassword }
    );

    if (passwordError) {
      console.error('Error updating password:', passwordError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to update password" 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Mark token as used
    await supabaseClient
      .from('password_reset_tokens')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('token', token);

    // Log the successful password reset
    await supabaseClient
      .from('password_reset_logs')
      .insert({
        target_user_id: userProfile.user_id,
        target_user_email: userProfile.email,
        target_user_name: `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim(),
        company_id: userProfile.company_id
      });

    console.log('Password reset successful for user:', userProfile.email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Password updated successfully" 
      }), 
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error in reset-password function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Internal server error" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);