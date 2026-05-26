// components/dashboard/Chatbot.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, X, MessageCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

const Backend_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:5000'
interface Message {
  id: string
  content: string
  sender: 'user' | 'bot'
  timestamp: Date
}

export function Chatbot() {
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)
  const [initchat, setInitChat] = useState(false)
  const [initInfo, setInitInfo] = useState<{ token: string } | null>(null)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Bonjour ! Comment puis-je vous aider aujourd'hui ?",
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleOpenChat = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
    setIsOpen(true)
    // get tenant info and set welcome message
    if (!initchat) {
      // Simulate fetching tenant info (remplacez par votre API)
      try {
        const tenantResponse = await fetch(`${Backend_URL}/api/v1/admin/me`, {
          method: 'GET',
          headers: {
            'content-type': 'application/json',
            'authorization': `Bearer ${token}`
          }
        })
        const tenantInfo = await tenantResponse.json()
        //use tenantInfo to initialize the anonymous chat session
        const initResponse = await fetch(`${Backend_URL}/api/v1/chat/init`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tenant_id: tenantInfo.tenant.id
          })
        })
        const initInfo = await initResponse.json()
        setInitInfo(initInfo)
        console.log('Chat session initialized:', initInfo)
        // Use tenantInfo to customize the welcome message
        const welcomeMessage: Message = {
          id: '1',
          content: `Bonjour ${tenantInfo.name} ! Comment puis-je vous aider aujourd'hui ?`,
          sender: 'bot',
          timestamp: new Date()
        }
        setMessages([welcomeMessage])
      } catch (error) {
        console.error('Error fetching tenant info:', error)
      }
      setInitChat(true)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !initInfo) return

    const userInput = inputValue
    const userMessage: Message = {
      id: Date.now().toString(),
      content: userInput,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Create initial bot message with typing indicator
    const botMessageId = (Date.now() + 1).toString()
    const botMessage: Message = {
      id: botMessageId,
      content: '',
      sender: 'bot',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, botMessage])

    // Stream response from API
    try {
      const response = await fetch(`${Backend_URL}/api/v1/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${initInfo.token}`
        },
        body: JSON.stringify({ content: userInput })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Response body not readable')
      }

      const decoder = new TextDecoder('utf-8')
      let isEscalation = false
      let escalationContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        
        // Parse SSE format: "data: {...}\n\n"
        chunk.split('\n').forEach(line => {
          if (line.startsWith('data:')) {
            const jsonStr = line.replace(/^data:\s*/, '').trim()
            if (!jsonStr) return

            try {
              const parsed = JSON.parse(jsonStr)
              const msgType = parsed.type

              if (msgType === 'status') {
                // Update message with status indicator
                console.log('Status:', parsed.content)
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === botMessageId
                      ? { ...msg, content: `⏳ ${parsed.content}` }
                      : msg
                  )
                )
              } else if (msgType === 'token') {
                // Append token content
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === botMessageId
                      ? {
                          ...msg,
                          content: msg.content.replace(/^⏳ .*?\n/m, '') + parsed.content
                        }
                      : msg
                  )
                )
              } else if (msgType === 'error') {
                // Display error message
                console.error('Error:', parsed.content)
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === botMessageId
                      ? { ...msg, content: `Error: ${parsed.content}` }
                      : msg
                  )
                )
              } else if (msgType === 'escalation') {
                // Handle escalation
                isEscalation = true
                escalationContent = JSON.stringify(parsed, null, 2)
                console.warn('Escalation triggered:', parsed)
                
                const escalationMsg = `Votre demande a été escaladée à un agent humain.\n\nTicket ID: ${parsed.ticket_id}\n\nVotre question: ${parsed.user_question}`
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === botMessageId
                      ? { ...msg, content: escalationMsg }
                      : msg
                  )
                )
              } else if (msgType === 'end') {
                // Stream ended
                console.log('Stream ended')
              }
            } catch (e) {
              // Skip non-JSON lines
              if (jsonStr.length > 0) {
                console.debug('Non-JSON line:', jsonStr)
              }
            }
          }
        })
      }
    } catch (error) {
      console.error('Streaming error:', error)
      setMessages(prev =>
        prev.map(msg =>
          msg.id === botMessageId
            ? {
                ...msg,
                content: '❌ Sorry, an error occurred while processing your request. Please try again.'
              }
            : msg
        )
      )
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={handleOpenChat}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="Ouvrir le chat"
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
          <div className="flex items-center justify-between p-4 border-b bg-muted/50">
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
              className="h-8 w-8 rounded-md hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4 mx-auto" />
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
                  </p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            ))}

            {/* Indicateur de frappe */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-1">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    thing...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-muted/50">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Écrivez votre message..."
                className="flex-1 px-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="h-10 w-10 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4 mx-auto" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}