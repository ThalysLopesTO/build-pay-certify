import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.9";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdateEmailRequest {
  userId: string;
  newEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return new Response(JSON.stringify({ error: "Server misconfigured: missing Supabase service credentials" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get the authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the JWT and get the user
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt);

    if (authError || !user) {
      console.error("Auth failed:", authError?.message);
      return new Response(JSON.stringify({ error: `Invalid authorization: ${authError?.message ?? "no user"}` }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    // Get the current user's profile in their ACTIVE company (multi-company aware)
    const { data: callerRows, error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .select("role, company_id")
      .eq("user_id", user.id);

    const { data: callerActiveCompanyId } = await supabaseAdmin
      .rpc('get_active_company_id_for', { p_user_id: user.id });
    const currentUserProfile =
      (callerRows ?? []).find((r) => r.role === 'super_admin') ||
      (callerRows ?? []).find((r) => r.company_id === callerActiveCompanyId) ||
      (callerRows ?? [])[0];

    if (profileError || !currentUserProfile) {
      return new Response(JSON.stringify({ error: "Could not verify user profile" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is admin/super_admin/management
    if (!["admin", "super_admin", "management"].includes(currentUserProfile.role)) {
      return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { userId, newEmail }: UpdateEmailRequest = await req.json();

    if (!userId || !newEmail) {
      return new Response(JSON.stringify({ error: "Missing userId or newEmail" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the target user's profile(s) — they may belong to multiple companies
    const { data: targetRows, error: targetProfileError } = await supabaseAdmin
      .from("user_profiles")
      .select("company_id")
      .eq("user_id", userId);

    if (targetProfileError || !targetRows || targetRows.length === 0) {
      return new Response(JSON.stringify({ error: "Target user not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify same company (unless super_admin). Note: email lives on the auth
    // account, so this change is visible in every company they belong to.
    if (currentUserProfile.role !== "super_admin" &&
        !targetRows.some((r) => r.company_id === currentUserProfile.company_id)) {
      return new Response(JSON.stringify({ error: "Can only update users in your company" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update the user's email in auth.users
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { email: newEmail }
    );

    if (updateError) {
      console.error("Failed to update user email:", updateError);
      return new Response(JSON.stringify({ error: `Failed to update email: ${updateError.message}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Successfully updated user email:", { userId, newEmail });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Email updated successfully",
      user: updateData.user 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in update-user-email function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);