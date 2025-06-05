
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

import { CreateSuperAdminRequest } from './types.ts'
import { createSupabaseAdminClient } from './supabase-client.ts'
import { processCreateSuperAdminRequest } from './request-processor.ts'
import { 
  createErrorResponse, 
  createSuccessResponse, 
  createOptionsResponse 
} from './response-helpers.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return createOptionsResponse()
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createSupabaseAdminClient()

    const body: CreateSuperAdminRequest = await req.json()

    const result = await processCreateSuperAdminRequest(supabaseAdmin, body)

    // Check if the result indicates a failure
    if (!result.success) {
      console.error('Request processing failed:', result.error)
      return createErrorResponse(result.message, result.status, result.error)
    }

    return createSuccessResponse(result)

  } catch (error) {
    console.error('Unexpected error in main handler:', error)
    return createErrorResponse('Internal server error', 500, error.message)
  }
})
