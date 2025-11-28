import React from "react";
import TokenLayout from "@/components/token/TokenLayout";
import AvailablePanel from "@/components/token/AvailablePanel";
import ExpiredPanel from "@/components/token/ExpiredPanel";
import ActiveConsent from "@/components/token/ActiveConsent";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { pickLang, type Lang } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Status = "ledig" | "aktiv" | "brugt";

type ParamsObj = { token?: string };
type SearchObj = { [key: string]: string | string[] | undefined };

type PageProps = {
  params?: ParamsObj | Promise<ParamsObj>;
  searchParams?: SearchObj | Promise<SearchObj>;
};

function isPromise<T>(v: any): v is Promise<T> {
  return v && typeof v.then === "function";
}

async function fetchWristbandByToken(tokenText: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("wristbands")
    .select("status, token_text, token, child_name, parent_name, phone")
    .eq("token_text", tokenText)
    .maybeSingle();

  if (error) {
    console.error("Token page: Supabase error", { tokenText, error });
    return null;
  }

  return data;
}

export default async function Page(props: PageProps) {
  const lang: Lang = await pickLang();

  const resolvedParams: ParamsObj = isPromise<ParamsObj>(props.params)
    ? await props.params
    : props.params || {};

  const resolvedSearch: SearchObj = isPromise<SearchObj>(props.searchParams)
    ? await props.searchParams
    : props.searchParams || {};

  let urlToken = (resolvedParams.token || "").trim();

  if (!urlToken && resolvedSearch) {
    const raw =
      resolvedSearch.token ??
      resolvedSearch.nxtPtoken ??
      "";

    if (Array.isArray(raw)) {
      urlToken = (raw[0] || "").trim();
    } else if (typeof raw === "string") {
      urlToken = raw.trim();
    }
  }

  let row: any = null;
  if (urlToken) {
    row = await fetchWristbandByToken(urlToken);
  }

  const rawStatus = (row?.status as Status | null) ?? null;
  const status: Status = rawStatus ?? "ledig";

  if (status === "aktiv") {
    return (
      <TokenLayout lang={lang}>
        <ActiveConsent
          token={urlToken}
          childName={row?.child_name ?? null}
          parentName={row?.parent_name ?? null}
          phone={row?.phone ?? null}
          lang={lang}
        />
      </TokenLayout>
    );
  }

  if (status === "brugt") {
    return (
      <TokenLayout lang={lang}>
        <ExpiredPanel lang={lang} />
      </TokenLayout>
    );
  }

  return (
    <TokenLayout lang={lang}>
      <AvailablePanel lang={lang} />
    </TokenLayout>
  );
}
