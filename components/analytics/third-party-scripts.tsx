"use client";

import * as React from "react";
import Script from "next/script";
import type { PublicIntegrationConfig } from "@/lib/domain/integrations";

/**
 * Carga condicional de GA4/GTM/Meta Pixel/TikTok Pixel (sección 21/26 del
 * plan) — solo si el admin configuró y activó la integración en
 * `/admin/integraciones/analytics`. Sin integraciones activas, este
 * componente no renderiza ningún script (nunca se asume un ID por
 * defecto). Meta CAPI y Google Ads (conversiones server-side) quedan
 * fuera de esta fase: requieren credenciales/tokens reales que no
 * existen todavía — se documenta como pendiente en vez de simularlas.
 */
export function ThirdPartyScripts({
  integrations,
}: {
  integrations: PublicIntegrationConfig[];
}) {
  return (
    <>
      {integrations.map((integration) => {
        switch (integration.provider) {
          case "ga4": {
            const id = integration.publicConfig.measurementId as string | undefined;
            if (!id) return null;
            return (
              <React.Fragment key="ga4">
                <Script
                  src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
                  strategy="afterInteractive"
                />
                <Script id="ga4-init" strategy="afterInteractive">
                  {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${id}');`}
                </Script>
              </React.Fragment>
            );
          }
          case "gtm": {
            const id = integration.publicConfig.containerId as string | undefined;
            if (!id) return null;
            return (
              <Script key="gtm" id="gtm-init" strategy="afterInteractive">
                {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');`}
              </Script>
            );
          }
          case "meta_pixel": {
            const id = integration.publicConfig.pixelId as string | undefined;
            if (!id) return null;
            return (
              <Script key="meta-pixel" id="meta-pixel-init" strategy="afterInteractive">
                {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${id}');
fbq('track', 'PageView');`}
              </Script>
            );
          }
          case "tiktok": {
            const id = integration.publicConfig.pixelId as string | undefined;
            if (!id) return null;
            return (
              <Script
                key="tiktok-pixel"
                id="tiktok-pixel-init"
                strategy="afterInteractive"
              >
                {`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
ttq.load('${id}');
ttq.page();
}(window, document, 'ttq');`}
              </Script>
            );
          }
          default:
            return null;
        }
      })}
    </>
  );
}
