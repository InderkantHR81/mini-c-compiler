import http from 'node:http'

const PORT = Number(process.env.PORT || 8787)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

/**
 * Minimal proxy:
 * - Frontend calls: POST /api/chat  { messages: [{role, content}, ...] }
 * - Server calls OpenAI with the API key stored in env (never in browser).
 */
const server = http.createServer(async (req, res) => {
  // CORS for local dev
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    return res.end()
  }

  if (req.method !== 'POST' || req.url !== '/api/chat') {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    return res.end('Not found')
  }

  if (!OPENAI_API_KEY) {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ error: 'OPENAI_API_KEY not set on server' }))
  }

  try {
    const raw = await new Promise((resolve, reject) => {
      let data = ''
      req.on('data', (chunk) => {
        data += chunk
      })
      req.on('end', () => resolve(data))
      req.on('error', reject)
    })

    /** @type {{ messages?: {role: string, content: string}[] }} */
    const body = JSON.parse(raw || '{}')
    const messages = Array.isArray(body.messages) ? body.messages : []
    if (!messages.length) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify({ error: 'messages[] is required' }))
    }

    const system = {
      role: 'system',
      content:
        'You are a helpful AI assistant for software/project questions. ' +
        'Be clear, practical, and avoid repetition. If the user provides code, ' +
        'explain what it does, then propose improvements or a project plan.',
    }

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [system, ...messages],
        temperature: 0.4,
        max_tokens: 800,
      }),
    })

    if (!openaiRes.ok) {
      const detail = await openaiRes.text()
      res.writeHead(openaiRes.status, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify({ error: 'OpenAI request failed', detail }))
    }

    const data = await openaiRes.json()
    const reply = data?.choices?.[0]?.message?.content || ''

    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ reply }))
  } catch (err) {
    console.error(err)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ error: 'Server error' }))
  }
})

server.listen(PORT, () => {
  console.log(`API proxy listening on http://localhost:${PORT}/api/chat`)
})

