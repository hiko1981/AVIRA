import type { SupabaseClient } from "@supabase/supabase-js";

export type WristbandRow = {
  id: string;
  token: string | null;
  child_name: string | null;
  expires_at: string | null;
  activated_at?: string | null;
  last_scan_at?: string | null;
  push_enabled?: boolean | null;
};

export type Wristband = {
  id: string;
  token: string | null;
  childName: string | null;
  expiresAt: string | null;
  activatedAt: string | null;
  lastScanAt: string | null;
  pushEnabled: boolean;
};

export async function fetchWristbands(
  client: SupabaseClient,
  ownerAppId: string
): Promise<Wristband[]> {
  const { data, error } = await client.rpc("get_active_wristbands", {
    p_owner: ownerAppId,
  });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as WristbandRow[];

  return rows.map((row) => ({
    id: row.id,
    token: row.token,
    childName: row.child_name,
    expiresAt: row.expires_at,
    activatedAt: row.activated_at ?? null,
    lastScanAt: row.last_scan_at ?? null,
    pushEnabled: row.push_enabled ?? true,
  }));
}
