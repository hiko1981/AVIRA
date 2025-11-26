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
    const deviceId = body?.device_id ?? null;
    const childName = body?.child_name ?? null;
    const parentName = body?.parent_name ?? null;
    const phone = body?.phone ?? null;
    const lat = typeof body?.lat === "number" ? body.lat : null;
    const lng = typeof body?.lng === "number" ? body.lng : null;
    const accuracy = typeof body?.accuracy === "number" ? body.accuracy : null;
    const timezone = body?.timezone || "Europe/Copenhagen";

    if (!tokenRaw || !appId) {
      return new Response(
        JSON.stringify({ ok: false, error: "missing token or app_id" }),
        { status: 400, headers: addCors(req, { "content-type": "application/json" }) },
      );
    }

    const tokenText = String(tokenRaw);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: existing, error: existingError } = await supabase
      .from("wristbands")
      .select(
        "id,status,owner_app_id,expires_at,activated_at,token_text,timezone,activated_lat,activated_lng,activated_accuracy_m",
      )
      .eq("token_text", tokenText)
      .maybeSingle();

    if (existingError) {
      return new Response(
        JSON.stringify({ ok: false, error: existingError.message }),
        { status: 200, headers: addCors(req, { "content-type": "application/json" }) },
      );
    }

    if (existing && existing.status === "aktiv") {
      return new Response(
        JSON.stringify({
          ok: false,
          code: "already_active",
          status: existing.status,
          wristband: existing,
        }),
        { status: 200, headers: addCors(req, { "content-type": "application/json" }) },
      );
    }

    if (existing && existing.status === "brugt") {
      return new Response(
        JSON.stringify({
          ok: false,
          code: "expired",
          status: existing.status,
          wristband: existing,
        }),
        { status: 200, headers: addCors(req, { "content-type": "application/json" }) },
      );
    }

    const now = new Date();
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upsertPayload = {
      token_text: tokenText,
      status: "aktiv" as const,
      owner_app_id: appId,
      child_name: childName,
      parent_name: parentName,
      phone,
      timezone,
      activated_at: now.toISOString(),
      expires_at: expires.toISOString(),
      activated_device_id: deviceId,
      activated_lat: lat,
      activated_lng: lng,
      activated_accuracy_m: accuracy,
    };

    const { data: rows, error: upsertError } = await supabase
      .from("wristbands")
      .upsert(upsertPayload, { onConflict: "token_text", defaultToNull: false })
      .select("*")
      .limit(1);

    if (upsertError) {
      return new Response(
        JSON.stringify({ ok: false, error: upsertError.message }),
        { status: 400, headers: addCors(req, { "content-type": "application/json" }) },
      );
    }

    const wb = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

    if (!wb) {
      return new Response(
        JSON.stringify({ ok: false, error: "no_wristband_row" }),
        { status: 500, headers: addCors(req, { "content-type": "application/json" }) },
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        status: wb.status,
        wristband: wb,
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
