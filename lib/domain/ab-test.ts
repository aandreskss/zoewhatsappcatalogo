import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/supabase/types";
import type { Json } from "@/lib/db/supabase/types";

export interface ABTestConfig {
  enabled: boolean;
  lpUrl: string;
  percentage: number; // 0–100
}

export const DEFAULT_AB_CONFIG: ABTestConfig = {
  enabled: false,
  lpUrl: "/lp/promo50",
  percentage: 20,
};

type DB = SupabaseClient<Database>;

function parseABConfig(raw: unknown): ABTestConfig {
  const d = DEFAULT_AB_CONFIG;
  if (!raw || typeof raw !== "object") return d;
  const o = raw as Record<string, unknown>;
  return {
    enabled: typeof o.enabled === "boolean" ? o.enabled : d.enabled,
    lpUrl: typeof o.lpUrl === "string" && o.lpUrl.trim() ? o.lpUrl.trim() : d.lpUrl,
    percentage:
      typeof o.percentage === "number" && o.percentage >= 0 && o.percentage <= 100
        ? Math.round(o.percentage)
        : d.percentage,
  };
}

export async function getABTestConfig(supabase: DB): Promise<ABTestConfig> {
  const { data } = await supabase
    .from("company_settings")
    .select("value")
    .eq("key", "ab_test_config")
    .maybeSingle();
  if (!data) return DEFAULT_AB_CONFIG;
  return parseABConfig(data.value);
}

export async function saveABTestConfig(supabase: DB, config: ABTestConfig): Promise<void> {
  const { error } = await supabase
    .from("company_settings")
    .upsert({ key: "ab_test_config", value: config as unknown as Json });
  if (error) throw new Error(error.message);
}
