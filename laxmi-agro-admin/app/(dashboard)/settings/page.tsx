"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Save, Building2, User, Upload, MessageCircle, MapPin, Settings2 } from "@/components/hugeicons"
import { toast } from "sonner"
import { apiFetch, buildApiUrl, getUser } from "@/lib/api"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { FormSkeleton } from "@/components/ui/skeleton"

const settingsSchema = z.object({
    businessName: z.string().optional(),
    businessEmail: z.string().optional(),
    businessPhone: z.string().optional(),
    businessAddress: z.string().optional(),
    upiId: z.string().optional(),
    upiDisplayName: z.string().optional(),
    minOrderAmount: z.coerce.number().optional(),
    defaultBulkMinQuantity: z.coerce.number().optional(),
    negotiationExpiryDays: z.coerce.number().optional(),
    lowStockThreshold: z.coerce.number().optional(),
    bankName: z.string().optional(),
    bankAccountNumber: z.string().optional(),
    bankIfscCode: z.string().optional(),
    bankAccountHolderName: z.string().optional(),
    bankTransferEnabled: z.boolean().optional(),
    avatar: z.string().optional(),
    features: z.object({
        negotiationsEnabled: z.boolean().optional(),
        guestCheckout: z.boolean().optional(),
        maintenanceMode: z.boolean().optional(),
    }).optional(),
    socialLinks: z.object({
        whatsapp: z.string().optional(),
        instagram: z.string().optional(),
        facebook: z.string().optional(),
    }).optional(),
    checkout: z.object({
        mode: z.string().optional(),
        orderWhatsappNumber: z.string().optional(),
        requireLoginForCheckout: z.boolean().optional(),
        createOrderBeforeRedirect: z.boolean().optional(),
        allowNegotiationCheckout: z.boolean().optional(),
    }).optional(),
}).passthrough()

export default function SettingsPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    const form = useForm<z.infer<typeof settingsSchema>>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            businessName: "",
            businessEmail: "",
            businessPhone: "",
            businessAddress: "",
            upiId: "",
            upiDisplayName: "",
            minOrderAmount: 0,
            defaultBulkMinQuantity: 10,
            negotiationExpiryDays: 7,
            lowStockThreshold: 5,
            bankName: "",
            bankAccountNumber: "",
            bankIfscCode: "",
            bankAccountHolderName: "",
            bankTransferEnabled: false,
            avatar: "",
            features: {
                negotiationsEnabled: true,
                guestCheckout: false,
                maintenanceMode: false,
            },
            socialLinks: {
                whatsapp: "",
                instagram: "",
                facebook: "",
            },
            checkout: {
                mode: "whatsapp",
                orderWhatsappNumber: "",
                requireLoginForCheckout: true,
                createOrderBeforeRedirect: true,
                allowNegotiationCheckout: true,
            },
        }
    })

    useEffect(() => {
        fetchSettings()
    }, [])

    async function fetchSettings() {
        try {
            const res = await apiFetch("/admin/settings")
            const data = await res.json()
            if (res.ok && data.data) {
                form.reset({
                    ...form.getValues(),
                    ...data.data,
                    features: {
                        ...form.getValues("features"),
                        ...(data.data.features || {}),
                    },
                    socialLinks: {
                        ...form.getValues("socialLinks"),
                        ...(data.data.socialLinks || {}),
                    },
                    checkout: {
                        ...form.getValues("checkout"),
                        ...(data.data.checkout || {}),
                        mode: data.data.checkout?.mode || "whatsapp",
                    },
                })
            }
        } catch (error) {
            toast.error("Failed to load settings")
        } finally {
            setIsLoading(false)
        }
    }

    async function onSubmit(values: z.infer<typeof settingsSchema>) {
        setIsSaving(true)
        try {
            const payload = {
                ...values,
                checkout: {
                    ...values.checkout,
                    mode: "whatsapp",
                    requireLoginForCheckout: true,
                    createOrderBeforeRedirect: true,
                },
            }

            const res = await apiFetch("/admin/settings", {
                method: "PUT",
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                toast.success("Settings updated successfully")
            } else {
                const err = await res.json()
                toast.error(err.message || "Failed to update settings")
            }
        } catch (error) {
            toast.error("Error saving settings")
        } finally {
            setIsSaving(false)
        }
    }

    async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        const formData = new FormData()
        formData.append("image", file)

        try {
            const token = localStorage.getItem("accessToken")
            const response = await fetch(buildApiUrl("/upload/image?folder=avatars"), {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || "Upload failed")
            }

            const data = await response.json()
            if (data.success && data.data) {
                form.setValue("avatar", data.data.url)
                toast.success("Profile image uploaded. Save settings to apply.")

                const user = getUser()
                if (user) {
                    user.avatar = data.data.url
                    localStorage.setItem("user", JSON.stringify(user))
                    window.dispatchEvent(new Event("storage"))
                }
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to upload image")
        } finally {
            setIsUploading(false)
            e.target.value = ""
        }
    }

    function onError(errors: any) {
        const errorFields = Object.keys(errors).join(", ")
        toast.error(`Form errors in: ${errorFields}`)
    }

    if (isLoading) {
        return <FormSkeleton />
    }

    return (
        <div className="flex max-w-4xl flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold text-white">Settings</h1>
                <p className="mt-1 text-sm text-[#919191]">
                    This page now prioritizes the active WhatsApp order flow. Legacy payment fields are kept only as fallback records.
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
                    <Card className="border-[#333] bg-[#161616]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <User className="h-5 w-5 text-[#86efac]" /> Admin Profile
                            </CardTitle>
                            <CardDescription>Profile image and account-facing identity.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-6 pb-4">
                                <Avatar className="h-24 w-24 border-2 border-[#333]">
                                    <AvatarImage src={form.watch("avatar")} />
                                    <AvatarFallback className="bg-gradient-to-br from-[#86efac]/20 to-[#86efac]/5 text-2xl font-bold text-[#86efac]">
                                        {getUser()?.name?.charAt(0).toUpperCase() || "A"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-white">Profile Photo</p>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="border-[#333] bg-[#0D0D0D] text-white hover:bg-[#1A1A1A]"
                                            disabled={isUploading}
                                            onClick={() => document.getElementById("avatar-upload")?.click()}
                                        >
                                            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                            Upload Image
                                        </Button>
                                        <input
                                            id="avatar-upload"
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleAvatarUpload}
                                        />
                                        {form.watch("avatar") ? (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-400 hover:bg-red-400/10 hover:text-red-300"
                                                onClick={() => form.setValue("avatar", "")}
                                            >
                                                Remove
                                            </Button>
                                        ) : null}
                                    </div>
                                    <p className="text-xs text-[#919191]">Recommended: square image, max 5MB.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-[#333] bg-[#161616]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Building2 className="h-5 w-5 text-[#86efac]" /> Business Information
                            </CardTitle>
                            <CardDescription>Core business identity and support contact details used across the app.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="businessName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-white">Business Name</FormLabel>
                                        <FormControl>
                                            <Input className="border-[#333] bg-[#0D0D0D] text-white" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="businessEmail"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-white">Support Email</FormLabel>
                                            <FormControl>
                                                <Input className="border-[#333] bg-[#0D0D0D] text-white" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="businessPhone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-white">Support Phone</FormLabel>
                                            <FormControl>
                                                <Input className="border-[#333] bg-[#0D0D0D] text-white" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="businessAddress"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2 text-white">
                                            <MapPin className="h-4 w-4 text-[#86efac]" />
                                            Business Address
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea className="min-h-[96px] border-[#333] bg-[#0D0D0D] text-white" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card className="border-[#333] bg-[#161616]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <MessageCircle className="h-5 w-5 text-[#86efac]" /> WhatsApp Checkout
                            </CardTitle>
                            <CardDescription>These settings control the live order flow used by cart checkout, buy now, and negotiation checkout.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-lg border border-[#2f4f39] bg-[#132117] p-4 text-sm text-[#c9f6d8]">
                                Checkout mode is fixed to <span className="font-semibold">WhatsApp</span> for this client. Online and bank-transfer payment setup is intentionally de-emphasized here.
                            </div>

                            <FormField
                                control={form.control}
                                name="checkout.orderWhatsappNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-white">Primary Order WhatsApp Number</FormLabel>
                                        <FormControl>
                                            <Input className="border-[#333] bg-[#0D0D0D] text-white" placeholder="e.g. 9179110159" {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormDescription>Used by app checkout and WhatsApp order generation links.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="rounded-lg border border-[#333] bg-[#0D0D0D] p-4 text-sm text-[#cbd5e1]">
                                Customers must sign in and every checkout is saved before WhatsApp opens. This keeps receipts and order history available in the app.
                            </div>

                            <div className="grid gap-4">
                                <FormField
                                    control={form.control}
                                    name="checkout.allowNegotiationCheckout"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-[#333] p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base text-white">Allow Negotiation Checkout</FormLabel>
                                                <FormDescription>Lets accepted wholesaler negotiations continue through the same WhatsApp checkout flow.</FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch checked={field.value !== false} onCheckedChange={field.onChange} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-[#333] bg-[#161616]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Settings2 className="h-5 w-5 text-[#86efac]" /> App Rules
                            </CardTitle>
                            <CardDescription>Business rules and feature flags that still actively affect the app and backend.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="minOrderAmount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-white">Min Order Amount (Rs)</FormLabel>
                                            <FormControl>
                                                <Input type="number" className="border-[#333] bg-[#0D0D0D] text-white" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="defaultBulkMinQuantity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-white">Default Bulk Min Qty</FormLabel>
                                            <FormControl>
                                                <Input type="number" className="border-[#333] bg-[#0D0D0D] text-white" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="negotiationExpiryDays"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-white">Negotiation Expiry (Days)</FormLabel>
                                            <FormControl>
                                                <Input type="number" className="border-[#333] bg-[#0D0D0D] text-white" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="lowStockThreshold"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-white">Default Low Stock Threshold</FormLabel>
                                            <FormControl>
                                                <Input type="number" className="border-[#333] bg-[#0D0D0D] text-white" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid gap-4 pt-2">
                                <FormField
                                    control={form.control}
                                    name="features.negotiationsEnabled"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-[#333] p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base text-white">Enable Negotiations</FormLabel>
                                                <FormDescription>Controls whether wholesaler negotiation is available at all.</FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch checked={field.value !== false} onCheckedChange={field.onChange} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="features.guestCheckout"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-[#333] p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base text-white">Allow Guest Browsing / Checkout Prep</FormLabel>
                                                <FormDescription>Backend flag for guest access behavior. Keep aligned with your login requirement decisions.</FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch checked={field.value === true} onCheckedChange={field.onChange} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="features.maintenanceMode"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-[#333] p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base text-white">Maintenance Mode</FormLabel>
                                                <FormDescription>Disables the store for customers while you are making backend or catalog changes.</FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch checked={field.value === true} onCheckedChange={field.onChange} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-[#333] bg-[#161616]">
                        <CardHeader>
                            <CardTitle className="text-white">Social & Contact Links</CardTitle>
                            <CardDescription>Public-facing contact links consumed by app and site surfaces.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <FormField
                                control={form.control}
                                name="socialLinks.whatsapp"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-white">WhatsApp Link</FormLabel>
                                        <FormControl>
                                            <Input className="border-[#333] bg-[#0D0D0D] text-white" placeholder="https://wa.me/919179110159" {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="socialLinks.instagram"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-white">Instagram</FormLabel>
                                        <FormControl>
                                            <Input className="border-[#333] bg-[#0D0D0D] text-white" placeholder="https://instagram.com/..." {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="socialLinks.facebook"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-white">Facebook</FormLabel>
                                        <FormControl>
                                            <Input className="border-[#333] bg-[#0D0D0D] text-white" placeholder="https://facebook.com/..." {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card className="border-[#333] bg-[#161616]">
                        <CardHeader>
                            <CardTitle className="text-white">Legacy Payment Reference</CardTitle>
                            <CardDescription>
                                These fields remain in the backend schema, but they are not the primary checkout path for this client.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="bankTransferEnabled"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-[#333] p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base text-white">Keep Legacy Bank Transfer Details Stored</FormLabel>
                                            <FormDescription>Only use this if you still want manual bank instructions available as a fallback reference.</FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch checked={field.value === true} onCheckedChange={field.onChange} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="upiId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-white">UPI ID</FormLabel>
                                            <FormControl>
                                                <Input className="border-[#333] bg-[#0D0D0D] text-white" placeholder="username@bank" {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="upiDisplayName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-white">UPI Display Name</FormLabel>
                                            <FormControl>
                                                <Input className="border-[#333] bg-[#0D0D0D] text-white" placeholder="Ashirvad Marketing" {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="bankName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-white">Bank Name</FormLabel>
                                            <FormControl>
                                                <Input className="border-[#333] bg-[#0D0D0D] text-white" {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="bankAccountHolderName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-white">Account Holder Name</FormLabel>
                                            <FormControl>
                                                <Input className="border-[#333] bg-[#0D0D0D] text-white" {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="bankAccountNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-white">Account Number</FormLabel>
                                            <FormControl>
                                                <Input className="border-[#333] bg-[#0D0D0D] text-white" {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="bankIfscCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-white">IFSC Code</FormLabel>
                                            <FormControl>
                                                <Input className="border-[#333] bg-[#0D0D0D] text-white" {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Button type="submit" disabled={isSaving} className="w-full bg-green-500 text-white hover:bg-green-600">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Settings
                    </Button>
                </form>
            </Form>
        </div>
    )
}
