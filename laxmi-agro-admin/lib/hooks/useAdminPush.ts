"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api"
import { getFirebaseApp, getVapidKey, isFirebaseWebConfigured } from "@/lib/firebase-client"

export type AdminPushStatus = "unsupported" | "disabled" | "enabled" | "denied" | "loading"

const STORAGE_KEY = "adminFcmToken"
const STATUS_EVENT = "admin-push-status"

// Remembers, per device and per admin, that alerts were switched on. Logout
// unregisters the device; this lets the next login switch them back on
// without asking again (the browser permission is already granted).
function wantedKey() {
    try {
        const user = JSON.parse(localStorage.getItem("user") || "null") as { _id?: string; id?: string } | null
        const id = user?._id || user?.id
        return id ? `adminPushWanted:${id}` : null
    } catch {
        return null
    }
}

function setWanted(wanted: boolean) {
    const key = wantedKey()
    if (!key) return
    if (wanted) localStorage.setItem(key, "1")
    else localStorage.removeItem(key)
}

function announce(status: AdminPushStatus) {
    window.dispatchEvent(new CustomEvent(STATUS_EVENT, { detail: status }))
}

// Gets this browser's push token and registers it for the signed-in admin.
async function registerThisDevice(): Promise<{ token?: string; error?: "unsupported" | "token" | "register" }> {
    const app = getFirebaseApp()
    const vapidKey = getVapidKey()
    if (!app || !vapidKey) return { error: "unsupported" }
    const registration = await getServiceWorkerRegistration()
    if (!registration) return { error: "unsupported" }
    const { getMessaging, getToken } = await import("firebase/messaging")
    const token = await getToken(getMessaging(app), { vapidKey, serviceWorkerRegistration: registration })
    if (!token) return { error: "token" }
    const res = await apiFetch("/notifications/register-token", {
        method: "POST",
        body: JSON.stringify({ fcmToken: token, platform: "web" }),
    })
    if (!res.ok) return { error: "register" }
    localStorage.setItem(STORAGE_KEY, token)
    return { token }
}

// After login: quietly turn alerts back on if this admin had them on here
// and the browser still allows notifications. Never shows a permission prompt.
export async function restoreAdminPush() {
    try {
        if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) return false
        if (Notification.permission !== "granted" || !isFirebaseWebConfigured()) return false
        const key = wantedKey()
        if (!key || localStorage.getItem(key) !== "1") return false
        const { token } = await registerThisDevice()
        if (token) announce("enabled")
        return Boolean(token)
    } catch (error) {
        console.warn("Restoring browser alerts failed:", error)
        return false
    }
}

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (!("serviceWorker" in navigator)) return null
    try {
        return (await navigator.serviceWorker.getRegistration("/")) || (await navigator.serviceWorker.register("/sw.js"))
    } catch {
        return null
    }
}

// Enables/disables browser push for the signed-in admin and keeps the
// backend token registry in sync. Foreground messages refresh the inbox.
function resolveInitialPushStatus(): AdminPushStatus {
    if (typeof window === "undefined") return "disabled"
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return "unsupported"
    if (!isFirebaseWebConfigured() || !getVapidKey()) return "unsupported"
    if (Notification.permission === "denied") return "denied"
    try {
        return localStorage.getItem(STORAGE_KEY) ? "enabled" : "disabled"
    } catch {
        return "disabled"
    }
}

export function useAdminPush(onForegroundMessage?: () => void) {
    const [status, setStatus] = useState<AdminPushStatus>(resolveInitialPushStatus)
    const callbackRef = useRef(onForegroundMessage)

    useEffect(() => {
        callbackRef.current = onForegroundMessage
    }, [onForegroundMessage])

    // Alerts re-enabled in the background after login.
    useEffect(() => {
        const onStatus = (event: Event) => setStatus((event as CustomEvent<AdminPushStatus>).detail)
        window.addEventListener(STATUS_EVENT, onStatus)
        return () => window.removeEventListener(STATUS_EVENT, onStatus)
    }, [])

    // Listen for foreground pushes while the panel is open.
    useEffect(() => {
        let unsubscribe: (() => void) | null = null
        let cancelled = false
        ;(async () => {
            try {
                const app = getFirebaseApp()
                if (!app) return
                const { getMessaging, onMessage } = await import("firebase/messaging")
                const messaging = getMessaging(app)
                unsubscribe = onMessage(messaging, (payload) => {
                    if (cancelled) return
                    callbackRef.current?.()
                    const title = payload.notification?.title || "New admin alert"
                    const body = payload.notification?.body || ""
                    toast.info(body ? `${title}: ${body}` : title)
                    window.dispatchEvent(new CustomEvent("admin-push-message", { detail: payload.data || {} }))
                })
            } catch (error) {
                console.warn("Foreground push listener failed:", error)
            }
        })()
        return () => {
            cancelled = true
            unsubscribe?.()
        }
    }, [])

    const enable = useCallback(async () => {
        setStatus("loading")
        try {
            const permission = await Notification.requestPermission()
            if (permission !== "granted") {
                setStatus("denied")
                toast.error("Browser notifications were blocked. Allow them in site settings to enable alerts.")
                return false
            }
            const { error } = await registerThisDevice()
            if (error === "unsupported") {
                setStatus("unsupported")
                toast.error("Push is not configured or the service worker is unavailable.")
                return false
            }
            if (error) {
                setStatus("disabled")
                toast.error(error === "token" ? "Could not get a push token. Try again." : "Could not register this device for alerts.")
                return false
            }
            setWanted(true)
            setStatus("enabled")
            toast.success("Browser alerts enabled on this device.")
            return true
        } catch (error) {
            console.error("Enable push failed:", error)
            setStatus("disabled")
            toast.error("Could not enable browser alerts.")
            return false
        }
    }, [])

    const disable = useCallback(async () => {
        const token = localStorage.getItem(STORAGE_KEY)
        localStorage.removeItem(STORAGE_KEY)
        // Turned off on purpose: don't switch back on at the next login.
        setWanted(false)
        setStatus("disabled")
        if (!token) return true
        try {
            await apiFetch("/notifications/unregister-token", {
                method: "POST",
                body: JSON.stringify({ fcmToken: token }),
            })
        } catch (error) {
            console.warn("Push unregister failed:", error)
        }
        return true
    }, [])

    return { status, enable, disable }
}
