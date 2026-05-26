"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, MapPinned, Phone, Search } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { toast } from "sonner"

type WholesalerLocation = {
  id: string
  businessName: string
  contactPerson: string
  phone: string
  businessAddress: string
  approvedAt?: string
  shopLocation: {
    lat: number
    lng: number
    placeLabel?: string | null
    capturedAt?: string | null
  }
}

declare global {
  interface Window {
    L?: any
  }
}

function loadLeafletCss() {
  if (document.getElementById("leaflet-css")) return
  const link = document.createElement("link")
  link.id = "leaflet-css"
  link.rel = "stylesheet"
  link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
  document.head.appendChild(link)
}

function loadLeafletScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.L) {
      resolve()
      return
    }

    const existing = document.getElementById("leaflet-js") as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener("load", () => resolve())
      existing.addEventListener("error", () => reject(new Error("Failed to load Leaflet")))
      return
    }

    const script = document.createElement("script")
    script.id = "leaflet-js"
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load Leaflet"))
    document.body.appendChild(script)
  })
}

export default function WholesalerMapPage() {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const leafletMapRef = useRef<any>(null)
  const markersLayerRef = useRef<any>(null)

  const [locations, setLocations] = useState<WholesalerLocation[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    void fetchLocations()
  }, [])

  async function fetchLocations() {
    setIsLoading(true)
    try {
      const res = await apiFetch("/admin/wholesaler-locations")
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.message || "Failed to load wholesaler locations")
        return
      }
      setLocations(data.data || [])
      if (!selectedId && data.data?.length) {
        setSelectedId(data.data[0].id)
      }
    } catch (error) {
      toast.error("Error loading wholesaler locations")
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return locations
    return locations.filter((item) =>
      [item.businessName, item.contactPerson, item.phone, item.businessAddress]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(q))
    )
  }, [locations, search])

  const selected = filtered.find((item) => item.id === selectedId) || filtered[0] || null

  useEffect(() => {
    let cancelled = false

    async function initMap() {
      if (!mapRef.current) return
      loadLeafletCss()
      await loadLeafletScript()
      if (cancelled || !mapRef.current || !window.L) return

      if (!leafletMapRef.current) {
        leafletMapRef.current = window.L.map(mapRef.current).setView([21.2514, 81.6296], 6)
        window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(leafletMapRef.current)
        markersLayerRef.current = window.L.layerGroup().addTo(leafletMapRef.current)
      }

      const markerLayer = markersLayerRef.current
      markerLayer.clearLayers()

      if (!filtered.length) return

      const bounds: any[] = []
      filtered.forEach((item) => {
        const latLng = [item.shopLocation.lat, item.shopLocation.lng]
        bounds.push(latLng)
        const marker = window.L.marker(latLng)
        marker.bindPopup(
          `<strong>${item.businessName}</strong><br/>${item.contactPerson}<br/>${item.phone}<br/>${item.businessAddress}`
        )
        marker.on("click", () => setSelectedId(item.id))
        marker.addTo(markerLayer)
      })

      if (selected) {
        leafletMapRef.current.setView([selected.shopLocation.lat, selected.shopLocation.lng], 13)
      } else if (bounds.length > 1) {
        leafletMapRef.current.fitBounds(bounds, { padding: [30, 30] })
      } else {
        leafletMapRef.current.setView(bounds[0], 13)
      }
    }

    void initMap()
    return () => {
      cancelled = true
    }
  }, [filtered, selected])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Wholesaler Map</h1>
          <p className="text-gray-400 text-sm">Approved wholesaler shops only</p>
        </div>
        <Button
          variant="outline"
          className="border-[#333] bg-[#0D0D0D] text-white hover:bg-[#1A1A1A]"
          onClick={() => void fetchLocations()}
        >
          Refresh
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by business, contact, phone, address"
          className="pl-10 bg-[#161616] border-[#333] text-white placeholder:text-gray-500"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#86efac]" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_360px]">
          <Card className="bg-[#161616] border-[#333] overflow-hidden">
            <CardHeader>
              <CardTitle className="text-white">Shop Pins</CardTitle>
            </CardHeader>
            <CardContent>
              {filtered.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#333] bg-[#0D0D0D] p-10 text-center text-gray-500">
                  No approved wholesaler locations found.
                </div>
              ) : (
                <div ref={mapRef} className="h-[65vh] w-full rounded-xl overflow-hidden" />
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <Card className="bg-[#161616] border-[#333]">
              <CardHeader>
                <CardTitle className="text-white">Wholesalers ({filtered.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[38vh] overflow-y-auto pr-1">
                {filtered.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      selected?.id === item.id
                        ? "border-[#86efac] bg-[#86efac]/10"
                        : "border-[#333] bg-[#0D0D0D] hover:border-[#555]"
                    }`}
                  >
                    <div className="text-sm font-semibold text-white">{item.businessName}</div>
                    <div className="mt-1 text-xs text-gray-400">{item.contactPerson}</div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-300">
                      <Phone className="h-3.5 w-3.5" />
                      {item.phone}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-[#161616] border-[#333]">
              <CardHeader>
                <CardTitle className="text-white">Selected Shop</CardTitle>
              </CardHeader>
              <CardContent>
                {selected ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <MapPinned className="mt-0.5 h-4 w-4 text-[#86efac]" />
                      <div>
                        <div className="font-semibold text-white">{selected.businessName}</div>
                        <div className="text-gray-400">{selected.contactPerson}</div>
                      </div>
                    </div>
                    <div className="text-gray-300">{selected.phone}</div>
                    <div className="text-gray-400 whitespace-pre-wrap">{selected.businessAddress}</div>
                    <div className="rounded-lg border border-[#333] bg-[#0D0D0D] p-3 text-xs text-gray-300">
                      {selected.shopLocation.lat.toFixed(6)}, {selected.shopLocation.lng.toFixed(6)}
                    </div>
                    {selected.approvedAt && (
                      <div className="text-xs text-gray-500">
                        Approved on {new Date(selected.approvedAt).toLocaleDateString("en-IN")}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Select a wholesaler to view details.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
