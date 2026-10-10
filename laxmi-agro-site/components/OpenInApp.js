'use client';

import { useEffect, useSyncExternalStore } from 'react';

export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.laxmiagro.app';
export const APP_STORE_URL = 'https://apps.apple.com/in/app/laxmi-agro/id6804305521';
const ANDROID_PACKAGE = 'com.laxmiagro.app';
const SITE_HOST = 'www.laxmiagroenterprises.com';

function platformOf(userAgent = '') {
    if (/android/i.test(userAgent)) return 'android';
    // iPadOS reports a Mac user agent; touch points tell them apart.
    if (/iphone|ipad|ipod/i.test(userAgent)) return 'ios';
    if (/macintosh/i.test(userAgent) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1) {
        return 'ios';
    }
    return 'desktop';
}

/**
 * Android: an intent link that opens the app when it's installed and the
 * Play Store page otherwise.
 */
function androidIntentUrl(path) {
    const fallback = encodeURIComponent(PLAY_STORE_URL);
    return `intent://${SITE_HOST}${path}#Intent;scheme=https;package=${ANDROID_PACKAGE};S.browser_fallback_url=${fallback};end`;
}

const noSubscribe = () => () => {};

/**
 * Shared product links land here when the app didn't open them. With the app
 * installed, Android App Links / iOS Universal Links open the product in the
 * app before this page loads. Otherwise, on a phone, this sends the visitor
 * on: Android opens the app if present or the Play Store, iPhone opens the
 * App Store. Desktop visitors stay on the page. The buttons are always shown
 * in case a browser blocks the automatic redirect.
 */
export default function OpenInApp({ path, redirect = true }) {
    // 'desktop' while server-rendering, the real platform in the browser.
    const platform = useSyncExternalStore(
        noSubscribe,
        () => platformOf(navigator.userAgent),
        () => 'desktop',
    );

    useEffect(() => {
        if (!redirect || platform === 'desktop') return;
        // Not again after the visitor comes back from the store.
        const key = `open-in-app:${path}`;
        try {
            if (sessionStorage.getItem(key)) return;
            sessionStorage.setItem(key, '1');
        } catch {
            // Private mode: redirect anyway.
        }
        if (platform === 'android') {
            window.location.href = androidIntentUrl(path);
        } else if (platform === 'ios') {
            window.location.href = APP_STORE_URL;
        }
    }, [path, redirect, platform]);

    const openHref = platform === 'android'
        ? androidIntentUrl(path)
        : platform === 'ios'
            ? APP_STORE_URL
            : null;

    return (
        <div
            data-testid="open-in-app"
            className="rounded-[1.6rem] border border-green-100 bg-[#f1f7ec] p-5"
        >
            <p className="text-sm font-bold text-text-primary">
                See prices and order in the Laxmi Agro app
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
                {openHref && (
                    <a
                        href={openHref}
                        className="inline-flex items-center justify-center rounded-full bg-[#1f8a3b] px-5 py-2.5 text-sm font-bold text-white"
                    >
                        Open in app
                    </a>
                )}
                <a
                    href={PLAY_STORE_URL}
                    className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-text-primary"
                >
                    Get it on Google Play
                </a>
                <a
                    href={APP_STORE_URL}
                    className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-text-primary"
                >
                    Download on the App Store
                </a>
            </div>
        </div>
    );
}
