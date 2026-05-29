import { createClient } from "./client"

export async function getToken(): Promise<string | undefined> {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.access_token
}
