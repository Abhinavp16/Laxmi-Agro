"use client"

import { FormEvent, useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import { toast } from "sonner"

type Staff = { _id: string; name: string; username: string; isActive: boolean; lastLoginAt?: string }

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  async function load() {
    try {
      const res = await apiFetch("/admin/staff?limit=100")
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setStaff(data.data || [])
    } catch (error: any) {
      toast.error(error.message || "Failed to load staff")
    }
  }

  // Load the staff directory once when the page mounts.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load() }, [])

  async function create(event: FormEvent) {
    event.preventDefault()
    try {
      const res = await apiFetch("/admin/staff", { method: "POST", body: JSON.stringify({ name, username, password }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      toast.success("Staff account created. Share the password securely.")
      setName("")
      setUsername("")
      setPassword("")
      await load()
    } catch (error: any) {
      toast.error(error.message || "Unable to create staff")
    }
  }

  async function toggle(item: Staff) {
    try {
      const res = await apiFetch(`/admin/staff/${item._id}/status`, { method: "PUT", body: JSON.stringify({ isActive: !item.isActive }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      toast.success(item.isActive ? "Staff account deactivated" : "Staff account activated")
      await load()
    } catch (error: any) {
      toast.error(error.message || "Unable to update account")
    }
  }

  async function reset(item: Staff) {
    const newPassword = window.prompt(`New password for ${item.username} (minimum 8 characters):`)
    if (!newPassword) return

    try {
      const res = await apiFetch(`/admin/staff/${item._id}/password`, { method: "PUT", body: JSON.stringify({ password: newPassword }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      toast.success("Password reset and active staff sessions revoked.")
    } catch (error: any) {
      toast.error(error.message || "Unable to reset password")
    }
  }

  return <div className="space-y-6"><div><h1 className="text-3xl font-bold">Staff Management</h1><p className="text-sm text-slate-500">Create restricted staff accounts and set their passwords directly.</p></div><form onSubmit={create} className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-4"><input className="rounded border p-2" placeholder="Staff name" value={name} onChange={(e) => setName(e.target.value)} required/><input className="rounded border p-2" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required/><input className="rounded border p-2" placeholder="Password" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required/><button className="rounded bg-emerald-600 px-4 py-2 font-semibold text-white">Create staff</button></form><div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-sm"><thead className="bg-slate-50 text-left"><tr><th className="p-3">Name</th><th>Username</th><th>Status</th><th className="p-3">Actions</th></tr></thead><tbody>{staff.map((item) => <tr key={item._id} className="border-t"><td className="p-3 font-semibold">{item.name}</td><td>{item.username}</td><td>{item.isActive ? "Active" : "Inactive"}</td><td className="flex gap-2 p-3"><button onClick={() => void reset(item)} className="rounded border px-2 py-1">Set password</button><button onClick={() => void toggle(item)} className="rounded border px-2 py-1">{item.isActive ? "Deactivate" : "Activate"}</button></td></tr>)}</tbody></table></div></div>
}
