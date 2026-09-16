import { initializeApp, getApps, type FirebaseApp } from "firebase/app"

let cachedApp: FirebaseApp | null = null

export function getFirebaseWebConfig() {
    return {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
    }
}

export function isFirebaseWebConfigured(): boolean {
    return Object.values(getFirebaseWebConfig()).every(Boolean)
}

export function getVapidKey(): string {
    return process.env.NEXT_PUBLIC_FCM_VAPID_KEY || ""
}

export function getFirebaseApp(): FirebaseApp | null {
    if (cachedApp) return cachedApp
    if (!isFirebaseWebConfigured()) return null
    cachedApp = getApps().length ? getApps()[0]! : initializeApp(getFirebaseWebConfig())
    return cachedApp
}
