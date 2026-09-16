"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api"
import { getFirebaseApp, getVapidKey, isFirebaseWebConfigured } from "@/lib/firebase-client"

export type AdminPushStatus = "unsupported" | "disabled" | "enabled" | "denied" | "loading"

const STORAGE_KEY = "adminFcmToken"

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
            const app = getFirebaseApp()
            const vapidKey = getVapidKey()
            if (!app || !vapidKey) {
                setStatus("unsupported")
                toast.error("Push is not configured. Missing Firebase web keys.")
                return false
            }
            const registration = await getServiceWorkerRegistration()
            if (!registration) {
                setStatus("unsupported")
                toast.error("Service worker unavailable, push cannot be enabled.")
                return false
            }
            const { getMessaging, getToken } = await import("firebase/messaging")
            const token = await getToken(getMessaging(app), { vapidKey, serviceWorkerRegistration: registration })
            if (!token) {
                setStatus("disabled")
                toast.error("Could not get a push token. Try again.")
                return false
            }
            const res = await apiFetch("/notifications/register-token", {
                method: "POST",
                body: JSON.stringify({ fcmToken: token, platform: "web" }),
            })
            if (!res.ok) {
                setStatus("disabled")
                toast.error("Could not register this device for alerts.")
                return false
            }
            localStorage.setItem(STORAGE_KEY, token)
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
