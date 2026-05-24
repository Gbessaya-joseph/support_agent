export interface ApiKey {
  id: string
  name: string
  key: string
  allowed_urls: string[]
  created_at: string
  last_used_at: string | null
}
interface tenant {
    id: string
    name: string
    plan: string
    allowed_domains: string[]
}
interface preferences {
    language: string
    timezone: "UTC",
    email_notifications: boolean,
    default_view: "grid",
    items_per_page: 12,
    auto_download: false
  }
export interface UserInfo {
    id: string
    email: string
    name?: string
    role: string
    tenant: tenant[]
    preferences: preferences
    // user_metadata: Record<string, any>
}

