import { useCallback, useEffect, useState } from "react";
import { supabase } from "../services/api/supabaseClient";
import { fetchWristbands, Wristband } from "../services/api/fetchWristbands";

type UseWristbandsState = {
  wristbands: Wristband[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};

export function useWristbands(ownerAppId: string | null | undefined): UseWristbandsState {
  const [wristbands, setWristbands] = useState<Wristband[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(
    async (opts?: { refreshing?: boolean }) => {
      if (!ownerAppId) {
        console.log("useWristbands: ownerAppId mangler – kalder ikke Supabase");
        setWristbands([]);
        setError(new Error("ownerAppId mangler"));
        return;
      }

      const refreshing = opts?.refreshing === true;

      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        console.log("useWristbands: loader wristbands for", ownerAppId);
        const result = await fetchWristbands(supabase, ownerAppId);
        console.log("useWristbands: fik", result.length, "wristbands");
        setWristbands(result);
        setError(null);
      } catch (err) {
        console.log("useWristbands: fejl ved fetchWristbands", err);
        setError(err as Error);
      } finally {
        if (refreshing) {
          setIsRefreshing(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [ownerAppId]
  );

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(async () => {
    await load({ refreshing: true });
  }, [load]);

  return {
    wristbands,
    isLoading,
    isRefreshing,
    error,
    refresh,
  };
}
