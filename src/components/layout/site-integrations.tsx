"use client"

import * as React from "react"
import Script from "next/script"
import { useSiteSettingsWithDefaults } from "@/context/site-settings-context"

export function SiteIntegrations() {
    const { settings } = useSiteSettingsWithDefaults()
    const { integrations } = settings

    return (
        <>
            {/* Google Analytics */}
            {integrations.ga_id && (
                <>
                    <Script
                        src={`https://www.googletagmanager.com/gtag/js?id=${integrations.ga_id}`}
                        strategy="afterInteractive"
                    />
                    <Script id="google-analytics" strategy="afterInteractive">
                        {`
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){dataLayer.push(arguments);}
                            gtag('js', new Date());
                            gtag('config', '${integrations.ga_id}');
                        `}
                    </Script>
                </>
            )}

            {/* Crisp Chat */}
            {integrations.crisp_id && (
                <Script id="crisp-chat" strategy="afterInteractive">
                    {`
                        window.$crisp=[];
                        window.CRISP_WEBSITE_ID="${integrations.crisp_id}";
                        (function(){
                            d=document;
                            s=d.createElement("script");
                            s.src="https://client.crisp.chat/l.js";
                            s.async=1;
                            d.getElementsByTagName("head")[0].appendChild(s);
                        })();
                    `}
                </Script>
            )}

            {/* Tawk.to */}
            {integrations.tawk_id && (
                <Script id="tawk-to" strategy="afterInteractive">
                    {`
                        var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
                        (function(){
                            var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
                            s1.async=true;
                            s1.src='https://embed.tawk.to/${integrations.tawk_id}/default';
                            s1.setAttribute('crossorigin','*');
                            s0.parentNode.insertBefore(s1,s0);
                        })();
                    `}
                </Script>
            )}
        </>
    )
}
