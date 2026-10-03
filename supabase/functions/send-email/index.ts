import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { to, subject, body, brandName, messageRowId } = await req.json();

    if (!to || !subject || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const resendApiKey = Deno.env.get("RESEND_API_KEY") as string;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // If no Resend key is configured, record the message as pending and return a helpful error
    if (!resendApiKey) {
      if (messageRowId) {
        await supabase.from("messages").update({ status: "failed" }).eq("id", messageRowId);
      }
      return new Response(
        JSON.stringify({
          error: "Email service not configured. Add RESEND_API_KEY as an edge function secret to enable sending.",
          needsConfig: true,
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email via Resend with branded sender name
    // The from field uses the format "Brand Name <onboarding@resend.dev>" for the free tier,
    // or "Brand Name <noreply@yourdomain.com>" if a custom domain is verified.
    const fromAddress = `onboarding@resend.dev`;
    const fromHeader = `${brandName || "Express Courier Services"} <${fromAddress}>`;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromHeader,
        to: to,
        subject: subject,
        html: body,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      if (messageRowId) {
        await supabase.from("messages").update({ status: "failed" }).eq("id", messageRowId);
      }
      return new Response(
        JSON.stringify({ error: "Email send failed", details: emailResult }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update message status to sent
    if (messageRowId) {
      await supabase.from("messages").update({ status: "sent" }).eq("id", messageRowId);
    }

    return new Response(
      JSON.stringify({ success: true, messageId: emailResult.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
