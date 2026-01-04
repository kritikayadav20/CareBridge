'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Message } from '@/types'

interface TransferChatProps {
  transferId: string
}

export default function TransferChat({ transferId }: TransferChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id)
    })

    // Load initial messages
    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*, sender:users(*)')
        .eq('transfer_id', transferId)
        .order('created_at', { ascending: true })

      if (data) {
        setMessages(data as any)
      }
    }

    loadMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel(`transfer:${transferId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `transfer_id=eq.${transferId}`,
        },
        async (payload) => {
          const { data: messageData } = await supabase
            .from('messages')
            .select('*, sender:users(*)')
            .eq('id', payload.new.id)
            .single()

          if (messageData) {
            setMessages((prev) => [...prev, messageData as any])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [transferId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !currentUserId) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          transfer_id: transferId,
          sender_id: currentUserId,
          message: newMessage.trim(),
        })

      if (error) throw error

      setNewMessage('')
    } catch (err) {
      console.error('Error sending message:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h3 className="text-xl font-semibold text-slate-900 mb-4">Transfer Coordination Chat</h3>
      
      <div className="border border-slate-200 rounded-xl p-4 h-96 overflow-y-auto mb-4 bg-slate-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-500 text-center">
              No messages yet.<br />
              <span className="text-sm">Start the conversation to coordinate the transfer.</span>
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-xl ${
                    message.sender_id === currentUserId
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-900 border border-slate-200 shadow-sm'
                  }`}
                >
                  <p className={`text-xs font-medium mb-1 ${
                    message.sender_id === currentUserId ? 'text-blue-100' : 'text-slate-500'
                  }`}>
                    {(message as any).sender?.full_name || 'Unknown'}
                  </p>
                  <p className="text-sm leading-relaxed">{message.message}</p>
                  <p className={`text-xs mt-2 ${
                    message.sender_id === currentUserId ? 'text-blue-100' : 'text-slate-400'
                  }`}>
                    {new Date(message.created_at).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message to coordinate the transfer..."
          className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder-slate-400"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !newMessage.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  )
}

