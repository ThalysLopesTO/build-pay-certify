
import { corsHeaders } from './validation.ts';
import { CreateSuperAdminResponse } from './types.ts';

export function createErrorResponse(message: string, status: number = 400, details?: any): Response {
  return new Response(
    JSON.stringify({ 
      error: message,
      details: details
    }),
    { 
      status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

export function createSuccessResponse(data: CreateSuperAdminResponse): Response {
  return new Response(
    JSON.stringify(data),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

export function createOptionsResponse(): Response {
  return new Response('ok', { headers: corsHeaders });
}
