import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function addCors(req: Request, extraHeaders: Record<string, string> = {}) {
  const h = new Headers(extraHeaders);
  h.set("access-control-allow-origin", "*");
  h.set("access-control-allow-methods", "POST,OPTIONS");
  h.set("access-control-allow-headers", "content-type,authorization,apikey,x-avira-bypass");
  return h;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: addCors(req) });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const tokenRaw = body?.token;
    const appId = body?.app_id ?? null;

    if (!tokenRaw) {
      return new Response(
        JSON.stringify({ ok: false, error: "missing token" }),
        { status: 400, headers: addCors(req, { "content-type": "application/json" }) },
      );
    }

    const tokenText = String(tokenRaw);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data, error } = await supabase
      .from("wristbands")
      .select(
        "id,status,owner_app_id,expires_at,activated_at,token_text,timezone,activated_lat,activated_lng,activated_accuracy_m",
      )
      .eq("token_text", tokenText)
      .maybeSingle();

    if (error) {
      return new Response(
        JSON.stringify({ ok: false, error: error.message }),
        { status: 200, headers: addCors(req, { "content-type": "application/json" }) },
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({
          ok: true,
          exists: false,
          status: "ledig",
          wristband: null,
          app_id: appId,
        }),
        { status: 200, headers: addCors(req, { "content-type": "application/json" }) },
      );
    }

    const status = data.status ?? null;

    return new Response(
      JSON.stringify({
        ok: true,
        exists: true,
        status,
        wristband: data,
        app_id: appId,
      }),
      { status: 200, headers: addCors(req, { "content-type": "application/json" }) },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }),
      { status: 500, headers: addCors(req, { "content-type": "application/json" }) },
    );
  }
});
