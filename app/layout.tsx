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
        <Script id="sl-config" strategy="beforeInteractive">{`window.SyncLeadKey="slk_77cc400fe5c0ac8f272a8c6b4d806f42afc71186e850bc96";window.SyncLeadHost="https://sync-lead-eight.vercel.app";`}</Script>
        <Script src="https://sync-lead-eight.vercel.app/sl.js" strategy="afterInteractive" />
        <Script id="synclead-collector" strategy="afterInteractive">{`(function(){var collector="https://sync-lead-eight.vercel.app/api/collect/de3f204ae3e78bd02bca59adbe09e35f02d6635dbe6f6289";function getCookie(name){var c=document.cookie.split('; ').find(function(r){return r.indexOf(name+'=')===0;});return c?c.slice(name.length+1):undefined;}function getVisitorId(){var k='_sl_vid',v=localStorage.getItem(k);if(!v){v='v_'+Date.now()+'_'+Math.random().toString(36).substr(2,9);localStorage.setItem(k,v);}return v;}(function(){var p=new URLSearchParams(location.search);['utm_source','utm_medium','utm_campaign','utm_content'].forEach(function(k){var v=p.get(k);if(v&&!localStorage.getItem('_sl_'+k))localStorage.setItem('_sl_'+k,v);});var fbclid=p.get('fbclid');if(fbclid&&!getCookie('_fbc')&&!localStorage.getItem('_sl_fbc')){localStorage.setItem('_sl_fbc','fb.1.'+Date.now()+'.'+fbclid);}})();function sendToDiagnostic(eventName,params){var boolParams={};if(params&&typeof params==="object"){Object.keys(params).forEach(function(k){boolParams[k]=true;});}var payload={eventName:eventName,pageUrl:window.location.href,environment:"production",parameters:boolParams,visitorId:getVisitorId(),utmSource:localStorage.getItem('_sl_utm_source')||undefined,utmMedium:localStorage.getItem('_sl_utm_medium')||undefined,utmCampaign:localStorage.getItem('_sl_utm_campaign')||undefined,referrer:document.referrer||undefined,fbc:getCookie('_fbc')||localStorage.getItem('_sl_fbc')||undefined,fbp:getCookie('_fbp')||undefined};fetch(collector,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});}window.__synclead_collect=sendToDiagnostic;function wrapFbq(original){if(original&&original._synclead_wrapped)return original;var wrapper=function(){var args=Array.prototype.slice.call(arguments);if(args[0]==="track"||args[0]==="trackCustom"){sendToDiagnostic(args[1],args[2]||{});}if(typeof wrapper.callMethod==="function"){return wrapper.callMethod.apply(wrapper,args);}return original.apply(this,arguments);};try{var skip={length:1,name:1,prototype:1,caller:1,arguments:1};Object.getOwnPropertyNames(original).forEach(function(key){if(skip[key])return;Object.defineProperty(wrapper,key,{get:function(){return original[key];},set:function(v){original[key]=v;},configurable:true,enumerable:true});});}catch(e){}wrapper._synclead_wrapped=true;return wrapper;}if(typeof window.fbq==="function"){window.fbq=wrapFbq(window.fbq);try{if(window._fbq!==window.fbq)window._fbq=window.fbq;}catch(e){}}else{Object.defineProperty(window,"fbq",{configurable:true,set:function(val){var wrapped=typeof val==="function"?wrapFbq(val):val;Object.defineProperty(window,"fbq",{configurable:true,writable:true,value:wrapped});try{if(window._fbq!==window.fbq)window._fbq=window.fbq;}catch(e){};}});}sendToDiagnostic('PageView',{});})();`}</Script>
        <Script id="synclead-pixel" strategy="afterInteractive">{`(function(){function getVisitorId(){var k='_sl_vid',v=localStorage.getItem(k);if(!v){v='v_'+Date.now()+'_'+Math.random().toString(36).substr(2,9);localStorage.setItem(k,v);}return v;}function getCookie(name){var c=document.cookie.split('; ').find(function(r){return r.indexOf(name+'=')===0;});return c?c.slice(name.length+1):null;}(function(){var p=new URLSearchParams(location.search);['utm_source','utm_medium','utm_campaign','utm_content'].forEach(function(k){var v=p.get(k);if(v&&!localStorage.getItem('_sl_'+k))localStorage.setItem('_sl_'+k,v);});var fbclid=p.get('fbclid');if(fbclid&&!getCookie('_fbc')&&!localStorage.getItem('_sl_fbc')){localStorage.setItem('_sl_fbc','fb.1.'+Date.now()+'.'+fbclid);}})();window.slTrack=function(eventName,params,token){navigator.sendBeacon('https://app.synclead.io/api/collect/'+token,new Blob([JSON.stringify({eventName:eventName,pageUrl:location.href,visitorId:getVisitorId(),utmSource:localStorage.getItem('_sl_utm_source'),utmMedium:localStorage.getItem('_sl_utm_medium'),utmCampaign:localStorage.getItem('_sl_utm_campaign'),referrer:document.referrer||null,fbc:getCookie('_fbc')||localStorage.getItem('_sl_fbc')||undefined,fbp:getCookie('_fbp')||undefined,parameters:params||{}})],{type:'application/json'}));};})();var SYNCLEAD_TOKEN='de3f204ae3e78bd02bca59adbe09e35f02d6635dbe6f6289';window.slTrack('page_view',{},SYNCLEAD_TOKEN);`}</Script>
      </body>
    </html>
  );
}
