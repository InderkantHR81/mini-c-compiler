import * as React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { generateIdeaReply } from '@/lib/ai/ideaEngine.js'

function MessageBubble({ role, text }) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[92%] rounded-lg border px-3 py-2 text-sm leading-relaxed ${
          isUser ? 'bg-primary text-primary-foreground border-primary/30' : 'bg-card text-card-foreground'
        }`}
      >
        <div className="mb-1 flex items-center gap-2">
          <Badge variant={isUser ? 'secondary' : 'outline'} className="text-[10px] uppercase">
            {isUser ? 'You' : 'AI helper'}
          </Badge>
        </div>
        <div className="whitespace-pre-wrap">{text}</div>
      </div>
    </div>
  )
}

/**
 * Offline chat-like “AI helper” that accepts any text/code.
 * No network calls; generates structured ideas locally.
 */
export function AIAssistantPanel({ currentCode }) {
  const [input, setInput] = React.useState('')
  const [language, setLanguage] = React.useState('')
  const [messages, setMessages] = React.useState(() => [
    {
      role: 'assistant',
      text:
        'Paste any code (any language) or describe what you want to build.\n' +
        'I will suggest project ideas + next steps (offline, no API).',
    },
  ])

  const send = React.useCallback(() => {
    const prompt = input.trim()
    if (!prompt) return

    setMessages((m) => [...m, { role: 'user', text: prompt }])
    setInput('')

    const { reply } = generateIdeaReply({
      prompt,
      code: currentCode ?? '',
      language,
    })

    // Small delay for chat feel
    window.setTimeout(() => {
      setMessages((m) => [...m, { role: 'assistant', text: reply }])
    }, 250)
  }, [input, currentCode, language])

  return (
    <div className="grid gap-3">
      <ScrollArea className="h-[min(420px,55vh)] w-full rounded-md border p-3">
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <MessageBubble key={i} role={msg.role} text={msg.text} />
          ))}
        </div>
      </ScrollArea>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium text-muted-foreground">Ask for ideas</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Example: 'Give me 3 project ideas using my code. I want something deployable and beginner-friendly.'"
            className="mt-1 h-24 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
        <div className="flex gap-2">
          <div>
            <label className="block text-xs font-medium text-muted-foreground">Language (optional)</label>
            <input
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="e.g. Python, C, Java"
              className="mt-1 h-10 w-44 rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <Button type="button" className="h-10 self-end" onClick={send}>
            Ask
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            setInput('Suggest 3 project ideas based on my code. Give MVP scope and stretch goals.')
          }
        >
          Project ideas
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setInput('Turn this into a 1-week MVP plan with milestones and checklist.')}
        >
          1-week MVP plan
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setMessages(messages.slice(0, 1))}>
          Clear chat
        </Button>
      </div>
    </div>
  )
}

