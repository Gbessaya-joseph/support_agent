import type { Conversation } from '@/lib/types/chat'

/**
 * Calcule le nombre total de conversations d'aujourd'hui
 */
export function getTodayConversationCount(conversations: Conversation[]): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return conversations.filter((conv) => {
    const convDate = new Date(conv.lastMessageAt)
    convDate.setHours(0, 0, 0, 0)
    return convDate.getTime() === today.getTime()
  }).length
}

/**
 * calculer la difference de nombre de conversations d'aujourd'hui par rapport à hier
 */
export function getTodayVsYesterdayDelta(conversations: Conversation[]): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const todayCount = conversations.filter((conv) => {
    const convDate = new Date(conv.lastMessageAt)
    convDate.setHours(0, 0, 0, 0)
    return convDate.getTime() === today.getTime()
  }).length

  const yesterdayCount = conversations.filter((conv) => {
    const convDate = new Date(conv.lastMessageAt)
    convDate.setHours(0, 0, 0, 0)
    return convDate.getTime() === yesterday.getTime()
  }).length

  return todayCount - yesterdayCount
}

/**
 * calculer le pourcentage de conversation resolue cette semaine par rapport à la semaine dernière
 */
export function getThisWeekVsLastWeekDelta(conversations: Conversation[]): number {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 (Dimanche) à 6 (Samedi)

  const thisWeekStart = new Date(today)
  thisWeekStart.setDate(today.getDate() - dayOfWeek)
  thisWeekStart.setHours(0, 0, 0, 0)

  const lastWeekStart = new Date(thisWeekStart)
  lastWeekStart.setDate(thisWeekStart.getDate() - 7)

  const lastWeekEnd = new Date(thisWeekStart)
  lastWeekEnd.setDate(thisWeekStart.getDate() - 1)
  lastWeekEnd.setHours(23, 59, 59, 999)

  const thisWeekCount = conversations.filter((conv) => {
    const convDate = new Date(conv.lastMessageAt)
    return convDate >= thisWeekStart && convDate <= today
  }).length

  const lastWeekCount = conversations.filter((conv) => {
    const convDate = new Date(conv.lastMessageAt)
    return convDate >= lastWeekStart && convDate <= lastWeekEnd
  }).length

  if (lastWeekCount === 0) return thisWeekCount > 0 ? 100 : 0
  return Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100)
}

/**
 * Calcule le pourcentage de conversations résolues (status !== pending_human)
 */
export function getResolvedPercentage(conversations: Conversation[]): number {
  if (conversations.length === 0) return 0

  const resolved = conversations.filter((conv) => conv.status === 'open').length
  return Math.round((resolved / conversations.length) * 100)
}

/**
 * Compte les escalades humaines (pending_human)
 */
export function getHumanEscalationCount(conversations: Conversation[]): number {
  return conversations.filter((conv) => conv.status === 'pending_human').length
}

/**
 * Filtre les conversations par statut
 */
export function filterConversationsByStatus(
  conversations: Conversation[],
  status: 'open' | 'pending_human' | 'all'
): Conversation[] {
  if (status === 'all') return conversations
  return conversations.filter((conv) => conv.status === status)
}

/**
 * Trie les conversations par date (plus récentes d'abord)
 */
export function sortConversationsByDate(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  )
}

/**
 * Récupère les N conversations les plus récentes
 */
export function getRecentConversations(conversations: Conversation[], limit: number = 10): Conversation[] {
  return sortConversationsByDate(conversations).slice(0, limit)
}

/**
 * Obtient un avatar initiale à partir d'un email
 */
export function getInitialFromEmail(email: string): string {
  return email.charAt(0).toUpperCase()
}

/**
 * Détermine si une conversation nécessite une attention immédiate
 */
export function needsImmediateAttention(conversation: Conversation): boolean {
  return conversation.status === 'pending_human'
}

/**
 * Formate une date pour l'affichage
 */
export function formatConversationTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'À l\'instant'
  if (diffMins < 60) return `il y a ${diffMins}m`
  if (diffHours < 24) return `il y a ${diffHours}h`
  if (diffDays < 7) return `il y a ${diffDays}j`

  return date.toLocaleDateString('fr-FR')
}
