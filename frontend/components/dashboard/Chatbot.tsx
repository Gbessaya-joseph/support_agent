// components/dashboard/Chatbot.tsx
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, X, MessageCircle, Loader2, Mail } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:5000'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  content: string
  sender: 'user' | 'bot'
  timestamp: Date
  isStreaming?: boolean
}

interface InitInfo {
  token: string
}

interface EscalationData {
  ticket_id: string
  user_question: string
}

type ChatStep =
  | { type: 'chat' }
  | { type: 'escalation_email'; data: EscalationData }
  | { type: 'escalation_done' }

// ─── Component ────────────────────────────────────────────────────────────────

export function Chatbot() {
  // Supabase client — créé une seule fois
  const supabase = useRef(createClient()).current

  const [isOpen, setIsOpen] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [initInfo, setInitInfo] = useState<InitInfo | null>(null)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      content: "Bonjour ! Comment puis-je vous aider aujourd'hui ?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [step, setStep] = useState<ChatStep>({ type: 'chat' })

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll à chaque nouveau message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Helpers ────────────────────────────────────────────────────────────────

  const addMessage = useCallback((msg: Omit<Message, 'id' | 'timestamp'>) => {
    const newMsg: Message = {
      ...msg,
      id: Date.now().toString(),
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, newMsg])
    return newMsg.id
  }, [])

  /** Met à jour le contenu d'un message existant par son id */
  const updateMessage = useCallback((id: string, patch: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch } : m))
    )
  }, [])

  // ── Init chat ──────────────────────────────────────────────────────────────

  const handleOpenChat = async () => {
    setIsOpen(true)
    if (initialized) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const tenantRes = await fetch(`${BACKEND_URL}/api/v1/admin/me`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      const tenantInfo = await tenantRes.json()

      const initRes = await fetch(`${BACKEND_URL}/api/v1/chat/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantInfo.tenant.id }),
      })
      const init: InitInfo = await initRes.json()
      setInitInfo(init)

      // Message de bienvenue personnalisé
      setMessages([
        {
          id: 'welcome',
          content: `Bonjour ${tenantInfo.name} ! Comment puis-je vous aider aujourd'hui ?`,
          sender: 'bot',
          timestamp: new Date(),
        },
      ])
    } catch (err) {
      console.error('Init error:', err)
    } finally {
      setInitialized(true)
    }
  }

  // ── Send message + streaming ───────────────────────────────────────────────

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !initInfo || isTyping) return

    const userInput = inputValue
    setInputValue('')
    addMessage({ content: userInput, sender: 'user' })
    setIsTyping(true)

    // Ajoute un message bot vide qu'on va remplir en streaming
    const botMsgId = `bot-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      {
        id: botMsgId,
        content: '',
        sender: 'bot',
        timestamp: new Date(),
        isStreaming: true,
      },
    ])

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${initInfo.token}`,
        },
        body: JSON.stringify({ content: userInput }),
      })

      if (!response.ok) throw new Error(`API error: ${response.status}`)

      const reader = response.body?.getReader()
      if (!reader) throw new Error('Response body not readable')

      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Traite les lignes SSE complètes
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? '' // garde la ligne incomplète en buffer

        for (const line of lines) {
          if (!line.startsWith('data:')) continue
          const jsonStr = line.replace(/^data:\s*/, '').trim()
          if (!jsonStr) continue

          try {
            const parsed = JSON.parse(jsonStr)

            switch (parsed.type) {
              case 'status':
                updateMessage(botMsgId, { content: `⏳ ${parsed.content}` })
                break

              case 'token':
                // ✅ Streaming rendering : on accumule token par token
                setMessages((prev) =>
                  prev.map((m) => {
                    if (m.id !== botMsgId) return m
                    // Retire le préfixe ⏳ status si présent
                    const cleaned = m.content.startsWith('⏳')
                      ? ''
                      : m.content
                    return { ...m, content: cleaned + parsed.content }
                  })
                )
                break

              case 'error':
                updateMessage(botMsgId, {
                  content: ` ${parsed.content}`,
                  isStreaming: false,
                })
                break

              case 'escalation':
                // ✅ Demander l'email à l'utilisateur
                updateMessage(botMsgId, {
                  content:
                    'Votre demande nécessite l\'intervention d\'un agent humain. Je vais vous mettre en contact.',
                  isStreaming: false,
                })
                setStep({
                  type: 'escalation_email',
                  data: {
                    ticket_id: parsed.ticket_id,
                    user_question: parsed.user_question,
                  },
                })
                break

              case 'end':
                updateMessage(botMsgId, { isStreaming: false })
                break
            }
          } catch {
            // ligne non-JSON, on ignore
          }
        }
      }
    } catch (err) {
      console.error('Streaming error:', err)
      updateMessage(botMsgId, {
        content: '❌ Une erreur est survenue. Veuillez réessayer.',
        isStreaming: false,
      })
    } finally {
      setIsTyping(false)
      updateMessage(botMsgId, { isStreaming: false })
    }
  }

  // ── Escalation : envoi de l'email ─────────────────────────────────────────

  const handleEscalationSubmit = async () => {
    if (!emailInput.trim() || step.type !== 'escalation_email') return
    const { data } = step

    setIsSendingEmail(true)
    try {
      await fetch(`${BACKEND_URL}/api/v1/chat/tickets/${data.ticket_id}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${initInfo?.token}` },
        body: JSON.stringify({
          email: emailInput.trim(),
          ticket_id: data.ticket_id,
          // user_question: data.user_question,
        }),
      })

      addMessage({
        sender: 'bot',
        content: `✅ Parfait ! Un agent vous contactera à l'adresse **${emailInput.trim()}**.\n\nRéférence ticket : \`${data.ticket_id}\``,
      })
      setStep({ type: 'escalation_done' })
      setEmailInput('')
    } catch (err) {
      console.error('Escalation email error:', err)
      addMessage({
        sender: 'bot',
        content: "❌ Impossible d'envoyer votre email. Veuillez réessayer.",
      })
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (step.type === 'escalation_email') {
        handleEscalationSubmit()
      } else {
        handleSendMessage()
      }
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={isOpen ? () => setIsOpen(false) : handleOpenChat}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label={isOpen ? 'Fermer le chat' : 'Ouvrir le chat'}
      >
        {isOpen ? (
          <X className="h-6 w-6 mx-auto" />
        ) : (
          <MessageCircle className="h-6 w-6 mx-auto" />
        )}
      </button>

      {/* Fenêtre de chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-8rem)] bg-background border rounded-lg shadow-2xl flex flex-col animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-muted/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Assistant</h3>
                <p className="text-xs text-muted-foreground">En ligne</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-md hover:bg-muted transition-colors flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                    {/* ✅ Curseur clignotant pendant le streaming */}
                    {message.isStreaming && (
                      <span className="inline-block w-0.5 h-4 bg-current ml-0.5 align-middle animate-pulse" />
                    )}
                  </p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}

            {/* Indicateur de frappe (avant le premier token) */}
            {isTyping && messages[messages.length - 1]?.content === '' && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-sm text-muted-foreground">En train décrire...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input — normal ou escalation email */}
          <div className="p-4 border-t bg-muted/50 shrink-0">
            {step.type === 'escalation_email' ? (
              // ✅ Formulaire email escalation
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Entrez votre email pour être contacté par un agent :
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="votre@email.com"
                      className="w-full pl-9 pr-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={handleEscalationSubmit}
                    disabled={!emailInput.trim() || isSendingEmail}
                    className="h-10 w-10 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {isSendingEmail ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ) : (
              // Input normal
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    step.type === 'escalation_done'
                      ? 'Conversation terminée'
                      : 'Écrivez votre message...'
                  }
                  disabled={isTyping || step.type === 'escalation_done'}
                  className="flex-1 px-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping || step.type === 'escalation_done'}
                  className="h-10 w-10 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}