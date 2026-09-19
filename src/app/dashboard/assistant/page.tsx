'use client';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState, useRef } from 'react';
import { MessageSquare, Send, Loader2, Sparkles, User, Bot } from 'lucide-react';
import toast from 'react-hot-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AssistantPage() {
  const { user, userRole } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) loadEmployee();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadEmployee() {
    if (userRole === 'employee') {
      const { data: ep } = await supabase
        .from('employee_profiles')
        .select('id')
        .eq('user_id', user!.id)
        .single();
      if (ep) setEmployeeId(ep.id);
    }
  }

  async function sendMessage() {
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setSending(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          employeeId,
          conversationHistory: messages,
        }),
      });

      if (!res.ok) throw new Error('Failed to get response');

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (e: any) {
      toast.error('Failed to get response');
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setSending(false);
    }
  }

  const suggestedQuestions = userRole === 'hr'
    ? [
        'What capabilities exist in our organization?',
        'Who could become an AI Engineer?',
        'What are the biggest capability gaps?',
        'Suggest internal mobility candidates for our open roles',
      ]
    : [
        'What roles can I realistically move into?',
        'What are my hidden capabilities?',
        'What skills should I develop next?',
        'What would I need to become an AI Engineer?',
      ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">
      <div className="mb-4">
        <h1 className="section-title flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary-600" />
          AI Career Assistant
        </h1>
        <p className="section-subtitle">
          {employeeId
            ? 'Ask questions about your career, capabilities, and opportunities'
            : 'Context-aware career intelligence assistant'}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-5">
              <Sparkles className="w-8 h-8 text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-surface-900">TalentSync AI Assistant</h3>
            <p className="text-surface-500 mt-2 max-w-md">
              {employeeId
                ? 'I have access to your profile, skills, projects, and AI-generated insights. Ask me anything about your career potential.'
                : 'Ask me about workforce capabilities, talent matching, and career development.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-8 max-w-xl w-full">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(q); }}
                  className="text-left p-3 rounded-xl border border-surface-200 hover:border-primary-300 hover:bg-primary-50/30 transition-all text-sm text-surface-600 hover:text-surface-900"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary-600" />
                </div>
              )}
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-surface-200'
              }`}>
                <div className={`text-sm whitespace-pre-wrap ${
                  msg.role === 'user' ? '' : 'text-surface-700 prose prose-sm max-w-none'
                }`}
                  dangerouslySetInnerHTML={msg.role === 'assistant' ? {
                    __html: msg.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/^### (.*$)/gm, '<h4 class="font-semibold text-surface-900 mt-3 mb-1">$1</h4>')
                      .replace(/^## (.*$)/gm, '<h3 class="font-bold text-surface-900 mt-4 mb-2">$1</h3>')
                      .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc text-surface-600">$1</li>')
                      .replace(/\n/g, '<br/>')
                  } : undefined}
                >
                  {msg.role === 'user' ? msg.content : undefined}
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-surface-200 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-surface-600" />
                </div>
              )}
            </div>
          ))
        )}
        {sending && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-primary-600" />
            </div>
            <div className="bg-white border border-surface-200 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-surface-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Thinking...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-surface-200 pt-4">
        <div className="flex gap-3">
          <input
            className="input-field flex-1"
            placeholder="Ask about your career, capabilities, or opportunities..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            className="btn-primary"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
