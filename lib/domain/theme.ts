import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/db/supabase/types";
import { parseThemeTokens, type SafeThemeTokens } from "@/lib/domain/theme-shared";

export {
  RADIUS_PRESETS,
  DEFAULT_THEME_TOKENS,
  parseThemeTokens,
  contrastForeground,
} from "@/lib/domain/theme-shared";
export type { RadiusPreset, SafeThemeTokens } from "@/lib/domain/theme-shared";

type DB = SupabaseClient<Database>;

export function themeTokensToJson(tokens: SafeThemeTokens): Json {
  return { ...tokens } as unknown as Json;
}

export async function getActiveTheme(supabase: DB): Promise<SafeThemeTokens | null> {
  const { data } = await supabase
    .from("themes")
    .select("tokens")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return parseThemeTokens(data.tokens);
}
