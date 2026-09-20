import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { createSupabaseServiceRoleClient } from "@/lib/db/supabase/server";
import { getActiveTheme } from "@/lib/domain/theme";
import { ThemeStyleOverride } from "@/components/theme-style-override";

export async function generateMetadata(): Promise<Metadata> {
  let googleVerification: string | undefined;
  try {
    const supabase = createSupabaseServiceRoleClient();
    const { data } = await supabase
      .from("integrations")
      .select("public_config, active")
      .eq("provider", "google_search_console")
      .single();
    if (data?.active) {
      const cfg = data.public_config as Record<string, unknown>;
      if (typeof cfg?.verificationCode === "string" && cfg.verificationCode) {
        googleVerification = cfg.verificationCode;
      }
    }
  } catch {
    // Sin Supabase (build/preview) → sin tag de verificación
  }

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: {
      default: "Zoe Shop",
      template: "%s · Zoe Shop",
    },
    description:
      "Catálogo de calzado Zoe Shop — damas, caballeros, deportivo y escolar. Arma tu pedido y coordínalo por WhatsApp. Valencia, Venezuela.",
    ...(googleVerification && {
      verification: { google: googleVerification },
    }),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Cliente de service role (no de sesión) a propósito: llamar a
  // `cookies()` aquí forzaría TODO el sitio a renderizado dinámico por
  // request (rompiendo el ISR de `/catalogo`/`/producto/[slug]`/Home) solo
  // para leer un theme que de todas formas es público. Mismo patrón que
  // `app/sitemap.ts`.
  let theme = null;
  try {
    const supabase = createSupabaseServiceRoleClient();
    theme = await getActiveTheme(supabase);
  } catch {
    // Sin vars de entorno (build/preview sin Supabase) → theme por defecto de globals.css
  }

  return (
    <html lang="es-VE">
      <body>
        <ThemeStyleOverride theme={theme} />
        {children}
        <Script id="synclead-collector" strategy="afterInteractive">{`(function(){var collector="https://sync-lead-eight.vercel.app/api/collect/de3f204ae3e78bd02bca59adbe09e35f02d6635dbe6f6289";function sendToDiagnostic(eventName,params){var boolParams={};if(params&&typeof params==="object"){Object.keys(params).forEach(function(k){boolParams[k]=true;});}fetch(collector,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({eventName:eventName,pageUrl:window.location.href,environment:"production",parameters:boolParams})});}window.__synclead_collect=sendToDiagnostic;function wrapFbq(original){if(original&&original._synclead_wrapped)return original;var wrapper=function(){var args=Array.prototype.slice.call(arguments);if(args[0]==="track"||args[0]==="trackCustom"){sendToDiagnostic(args[1],args[2]||{});}if(typeof wrapper.callMethod==="function"){return wrapper.callMethod.apply(wrapper,args);}return original.apply(this,arguments);};try{var skip={length:1,name:1,prototype:1,caller:1,arguments:1};Object.getOwnPropertyNames(original).forEach(function(key){if(skip[key])return;Object.defineProperty(wrapper,key,{get:function(){return original[key];},set:function(v){original[key]=v;},configurable:true,enumerable:true});});}catch(e){}wrapper._synclead_wrapped=true;return wrapper;}if(typeof window.fbq==="function"){window.fbq=wrapFbq(window.fbq);try{if(window._fbq!==window.fbq)window._fbq=window.fbq;}catch(e){}}else{Object.defineProperty(window,"fbq",{configurable:true,set:function(val){var wrapped=typeof val==="function"?wrapFbq(val):val;Object.defineProperty(window,"fbq",{configurable:true,writable:true,value:wrapped});try{if(window._fbq!==window.fbq)window._fbq=window.fbq;}catch(e){};}});}})()`}</Script>
      </body>
    </html>
  );
}
