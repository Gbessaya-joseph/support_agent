// app/dashboard/settings/api-keys/page.tsx
"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  Plus,
  Trash2,
  Edit2,
  Globe,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import {toast} from "sonner"
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter'
import {vscDarkPlus} from 'react-syntax-highlighter/dist/esm/styles/prism'
import { formatDistanceToNow } from "date-fns"
import { createClient } from '@/utils/supabase/client'


function AllowedDomainsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Domains List Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-9" />
                  <Skeleton className="h-9 w-9" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function AllowedDomainsPage() {
  const [allowedDomains, setAllowedDomains] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [deleteDomainId, setDeleteDomainId] = useState<string | null>(null)
  const [editingDomain, setEditingDomain] = useState<string | null>(null)
  const [newDomainValue, setNewDomainValue] = useState("")
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)


  useEffect(() => {
    fetchAllowedDomains()
  }, [])

  const fetchAllowedDomains = async () => {
    const supabase = createClient()
    // Récupérer le token juste avant la requête
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        throw new Error('No authentication token available')
      }
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/tenants/allowed-domains`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
          },
          // credentials: 'include',
        }
      )
      if (!response.ok) throw new Error("Failed to fetch allowed domains")
      const data = await response.json()
      setAllowedDomains(data.domains || [])
    } catch (error) {
      toast.error("Failed to fetch allowed domains.", { position: "top-right" })
      setAllowedDomains([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddDomain = async () => {
    const supabase = createClient()
    // Récupérer le token juste avant la requête
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!newDomainValue.trim()) {
      toast.error("Please enter a domain", { position: "top-right" })
      return
    }

    try {
      setCreating(true)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/tenants/allowed-domains`,
        {
          method: "POST",
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          // credentials: 'include',
          body: JSON.stringify({
            domains: [newDomainValue.trim()],
          }),
        }
      )

      if (!response.ok) throw new Error("Failed to add domain")

      const data = await response.json()
      setAllowedDomains(data.domains || [])
      
      toast.success("Domain added successfully", { position: "top-right" })

      setShowCreateDialog(false)
      setNewDomainValue("")
    } catch (error) {
      toast.error("Failed to add domain.", { position: "top-right" })
    } finally {
      setCreating(false)
    }
  }

  const handleEditDomain = async () => {
    const supabase = createClient()
    // Récupérer le token juste avant la requête
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    if (!editingDomain || !newDomainValue.trim()) {
      toast.error("Please enter a domain", { position: "top-right" })
      return
    }

    if (editingDomain === newDomainValue.trim()) {
      setShowEditDialog(false)
      return
    }

    try {
      setUpdating(true)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/tenants/allowed-domains`,
        {
          method: "PUT",
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          // credentials: 'include',
          body: JSON.stringify({
            old_domain: editingDomain,
            new_domain: newDomainValue.trim(),
          }),
        }
      )

      if (!response.ok) throw new Error("Failed to update domain")

      const data = await response.json()
      setAllowedDomains(data.domains || [])

      toast.success("Domain updated successfully", { position: "top-right" })

      setShowEditDialog(false)
      setEditingDomain(null)
      setNewDomainValue("")
    } catch (error) {
      toast.error("Failed to update domain.", { position: "top-right" })
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteDomain = async (domain: string) => {
    const supabase = createClient()
    // Récupérer le token juste avant la requête
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/tenants/allowed-domains/${domain}`,
        {
          method: "DELETE",
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          // credentials: 'include',
        }
      )

      if (!response.ok) throw new Error("Failed to delete domain")

      const data = await response.json()
      setAllowedDomains(data.domains || [])
      
      toast.success("Domain deleted successfully", { position: "top-right" })
      setDeleteDomainId(null)
    } catch (error) {
      toast.error("Failed to delete domain.", { position: "top-right" })
    }
  }

  const openEditDialog = (domain: string) => {
    setEditingDomain(domain)
    setNewDomainValue(domain)
    setShowEditDialog(true)
  }

  const reactComponentCode = `// Example: Calling your API from an allowed domain
const apiUrl = '${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}';

async function callAPI() {
  try {
    const response = await fetch(\`\${apiUrl}/api/v1/documents/upload\`, {
      method: 'POST',
      credentials: 'include', // Sends cookies for auth
      body: formData
    });

    if (!response.ok) {
      throw new Error('Request failed');
    }

    const data = await response.json();
    console.log('Success:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Note: This request will only succeed if your domain
// is in the allowed domains list above`

  if (loading) {
    return <AllowedDomainsSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Allowed Domains</h2>
          <p className="text-sm text-muted-foreground">
            Manage the domains allowed to access your API
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Domain
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Allowed Domain</DialogTitle>
              <DialogDescription>
                Enter a domain that will be allowed to access your API
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  value={newDomainValue}
                  onChange={(e) => setNewDomainValue(e.target.value)}
                  placeholder="example.com"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the domain without https:// (e.g., example.com)
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddDomain} disabled={creating}>
                {creating ? "Adding..." : "Add Domain"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Allowed Domains List */}
      {allowedDomains.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">No allowed domains yet</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Allowed Domain
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {allowedDomains.map((domain) => (
            <Card key={domain}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <h3 className="font-semibold text-base">{domain}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEditDialog(domain)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteDomainId(domain)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Domain Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Allowed Domain</DialogTitle>
            <DialogDescription>
              Update the domain name
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-domain">Domain</Label>
              <Input
                id="edit-domain"
                value={newDomainValue}
                onChange={(e) => setNewDomainValue(e.target.value)}
                placeholder="example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditDomain} disabled={updating}>
              {updating ? "Updating..." : "Update Domain"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* React Component Example */}
      <Card>
        <CardHeader>
          <CardTitle>React Component Example</CardTitle>
          <CardDescription>
            Sample code for calling your API from an allowed domain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <SyntaxHighlighter
              language="javascript"
              style={vscDarkPlus}
              customStyle={{
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
              }}
            >
              {reactComponentCode}
            </SyntaxHighlighter>
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => {
                navigator.clipboard.writeText(reactComponentCode)
                toast.success("Copied to clipboard", { position: "bottom-right" })
              }}
            >
              <Check className="mr-2 h-4 w-4" />
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDomainId} onOpenChange={() => setDeleteDomainId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Domain?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this allowed domain. Requests from this domain will no longer be accepted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDomainId && handleDeleteDomain(deleteDomainId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Domain
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
