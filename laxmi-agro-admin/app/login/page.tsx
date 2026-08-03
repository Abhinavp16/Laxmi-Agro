"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import Image from "next/image"
import { Loader2, Mail } from "@/components/hugeicons"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const RESEND_COOLDOWN_SECONDS = 30

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  async function requestMagicLink(isResend = false) {
    setIsLoading(true)
    try {
      const res = await apiFetch("/auth/magic-link/request", {
        method: "POST",
        skipAuth: true,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to send magic link")
      }

      setSent(true)
      setCooldown(RESEND_COOLDOWN_SECONDS)
      if (!isResend) {
        toast.success("Magic link sent! Check your inbox.")
      } else {
        toast.success("A new magic link has been sent.")
      }
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to send magic link")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent p-4">
      <Card className="w-full max-w-md border-[#dde3d0] bg-white/92 shadow-[0_32px_90px_rgba(60,80,40,0.12)]">
        <CardHeader className="space-y-1">
          <div className="flex justify-center pb-2">
            <Image src="/icon.svg" alt="Laxmi Agro logo" width={56} height={56} className="h-14 w-14 rounded-xl object-cover" />
          </div>
          <CardTitle className="text-center text-2xl font-bold text-slate-900">Laxmi Agro Enterprises Admin</CardTitle>
          <CardDescription className="text-center text-slate-500">
            {sent
              ? "Your sign-in link is on its way"
              : "Get a one-time sign-in link in your email. No password needed."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!sent ? (
            <Button
              type="button"
              onClick={() => requestMagicLink()}
              className="w-full bg-[#86efac] text-black hover:bg-[#74e39c]"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              Send Magic Link
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg border border-[#d8dfca] bg-[#f9fbf4] p-4 text-sm text-slate-600">
                A one-time sign-in link has been sent to the admin emails. It is valid for 5 minutes and works only once.
              </div>
              <Button
                type="button"
                onClick={() => window.open("https://mail.google.com", "_blank", "noopener")}
                className="w-full bg-[#86efac] text-black hover:bg-[#74e39c]"
              >
                <Mail className="mr-2 h-4 w-4" />
                Open Gmail
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => requestMagicLink(true)}
                className="w-full border-[#d8dfca] text-slate-700"
                disabled={isLoading || cooldown > 0}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {cooldown > 0 ? `Resend link in ${cooldown}s` : "Resend link"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
