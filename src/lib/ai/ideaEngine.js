/**
 * Offline “AI-like” idea engine (no network, no API keys).
 * Accepts any text/code (any programming language) and generates varied project ideas.
 */

function normalize(text) {
  return String(text ?? '').toLowerCase()
}

function hashString(s) {
  // simple deterministic hash for stable “variety” without randomness
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function detectLanguage(code) {
  const c = String(code ?? '')
  const t = c.toLowerCase()
  if (/^\s*#include\s*<[^>]+>/m.test(c) || /\bprintf\s*\(/.test(t)) return 'C/C++'
  if (/\bSystem\.out\.println\s*\(/.test(c) || /\bpublic\s+class\b/.test(c)) return 'Java'
  if (/\bdef\s+\w+\s*\(/.test(c) || /^\s*import\s+\w+/m.test(c)) return 'Python'
  if (/\bconsole\.log\s*\(/.test(c) || /\bfunction\s+\w+\s*\(/.test(c)) return 'JavaScript'
  if (/\busing\s+System\b/.test(c) || /\bConsole\.WriteLine\s*\(/.test(c)) return 'C#'
  if (/\bfn\s+\w+\s*\(/.test(t) || /\blet\s+mut\b/.test(t)) return 'Rust'
  if (/\bpackage\s+main\b/.test(t) || /\bfmt\.Println\s*\(/.test(c)) return 'Go'
  return ''
}

function flagsFrom(text) {
  const t = normalize(text)
  const has = (re) => re.test(t)
  return {
    compiler: has(/\b(compiler|lexer|parser|ast|semantic|token)\b/i),
    web: has(/\b(react|vite|tailwind|frontend|ui|web|api|http)\b/i),
    auth: has(/\b(auth|login|jwt|oauth|session|role)\b/i),
    db: has(/\b(sql|database|postgres|mysql|mongodb|sqlite)\b/i),
    realtime: has(/\b(websocket|socket|realtime|live|collab)\b/i),
    game: has(/\b(game|2d|3d|unity|godot)\b/i),
    ml: has(/\b(ai|ml|model|llm|chatgpt|openai|prompt)\b/i),
    mobile: has(/\b(android|ios|react native|flutter)\b/i),
    cli: has(/\b(cli|terminal|command line)\b/i),
  }
}

const IDEA_POOL = [
  {
    tags: ['compiler', 'web'],
    title: 'Multi-language Code Explorer',
    pitch: 'Detect language and show educational breakdown panels (outline, metrics, explanations).',
    features: ['Language detect + highlighting', 'Code outline + metrics', 'Explain mode + examples'],
    stretch: ['Plugin system for new languages', 'Quick fixes / refactors'],
  },
  {
    tags: ['web', 'auth', 'db'],
    title: 'Role-based Dashboard Starter',
    pitch: 'An extendable admin dashboard with roles, CRUD scaffolding, and audit logs.',
    features: ['Login + roles', 'CRUD pages', 'Audit log + filters'],
    stretch: ['Team workspaces', 'Analytics charts'],
  },
  {
    tags: ['web', 'realtime'],
    title: 'Realtime Collaboration Pad',
    pitch: 'Collaborative editor with rooms, presence, cursors, and chat.',
    features: ['Room links', 'Presence list', 'Chat + shared notes'],
    stretch: ['Version history', 'CRDT sync'],
  },
  {
    tags: ['game'],
    title: 'Puzzle Game + Level Editor',
    pitch: 'Build a small puzzle game and ship a level editor for user-generated content.',
    features: ['Core mechanics', 'Level editor', 'Share levels as JSON'],
    stretch: ['Leaderboard', 'Procedural generation'],
  },
  {
    tags: ['cli'],
    title: 'CLI Productivity Toolkit',
    pitch: 'A CLI bundling small dev utilities: snippets, notes, bootstraps.',
    features: ['Snippet manager', 'Project bootstrapper', 'Searchable notes'],
    stretch: ['Cloud sync', 'Plugins'],
  },
  {
    tags: ['ml'],
    title: 'Prompt Lab (Offline-First)',
    pitch: 'A prompt notebook UI that stores experiments locally and exports prompt packs.',
    features: ['Prompt templates', 'Rubric scoring + notes', 'Export/import'],
    stretch: ['Batch runs', 'Optional online connectors'],
  },
  {
    tags: ['web'],
    title: 'Learning Tracker App',
    pitch: 'Track what you learn daily: notes, spaced repetition, and progress dashboards.',
    features: ['Daily entries', 'Tags + search', 'Progress charts'],
    stretch: ['Spaced repetition cards', 'Sharing + sync'],
  },
  {
    tags: ['db'],
    title: 'Personal Finance Ledger',
    pitch: 'A simple ledger with categories, budgets, and exportable reports.',
    features: ['Transactions + categories', 'Monthly budget view', 'CSV import/export'],
    stretch: ['Receipt OCR (optional)', 'Forecasting'],
  },
]

const DEFAULT_IDEAS = [
  {
    title: 'Project Starter Generator',
    pitch: 'Generate a roadmap and clean folder structure from a short prompt.',
    features: ['Milestones + checklist', 'README scaffold', 'Deploy-ready setup'],
    stretch: ['Template packs for stacks', 'Risk/complexity scoring'],
  },
  {
    title: 'Interactive Learning Tool',
    pitch: 'Turn code into a step-by-step explainer with visuals and checkpoints.',
    features: ['Explain mode', 'Line highlighting', 'Export notes'],
    stretch: ['Quizzes + hints', 'Multi-language plugins'],
  },
]

function scoreIdea(idea, flags) {
  let s = 0
  for (const tag of idea.tags ?? []) {
    if (flags[tag]) s += 3
  }
  // gentle preference for web ideas if user mentions UI/web
  if (flags.web && (idea.tags ?? []).includes('web')) s += 1
  return s
}

function pickIdeas(flags, seedText) {
  const seed = hashString(seedText)

  const scored = IDEA_POOL.map((it, idx) => ({
    it,
    // stable tiebreaker by seed
    score: scoreIdea(it, flags) * 1000 + ((seed + idx * 2654435761) >>> 0) % 997,
  }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.it)

  const out = []
  for (const it of scored) {
    if (out.length >= 3) break
    out.push(it)
  }

  while (out.length < 2) {
    out.push(DEFAULT_IDEAS[out.length] ?? DEFAULT_IDEAS[0])
  }

  return out.slice(0, 3)
}

function bullets(items) {
  return (items ?? []).map((x) => `- ${x}`).join('\n')
}

/**
 * @param {{ prompt: string, code?: string, language?: string }} input
 * @returns {{ reply: string, ideas: any[] }}
 */
export function generateIdeaReply({ prompt, code = '', language = '' }) {
  const detected = language?.trim() ? language.trim() : detectLanguage(code)
  const combined = `${prompt}\n\n${detected}\n\n${code}`
  const flags = flagsFrom(combined)

  const ideas = pickIdeas(flags, combined)

  const prefaceLines = [
    'Here are tailored project ideas based on your prompt and the code you pasted.',
    detected ? `Detected/selected language: ${detected}` : 'Language: (not specified — treating as plain text)',
    'This is an offline helper (no real LLM), but it adapts to keywords and code patterns.',
  ]

  const ideaText = ideas
    .map((it, i) => {
      return (
        `**Idea ${i + 1}: ${it.title}**\n` +
        `${it.pitch}\n\n` +
        `**Key features**\n` +
        `${bullets(it.features)}\n\n` +
        `**Stretch goals**\n` +
        `${bullets(it.stretch)}`
      )
    })
    .join('\n\n')

  const next =
    `**Next questions (so I can narrow it down):**\n` +
    `- Platform (web/mobile/cli)?\n` +
    `- Timeline (1 day / 1 week / 1 month)?\n` +
    `- Solo or team?\n` +
    `- Beginner/intermediate/advanced?`

  const reply = `${prefaceLines.join('\n')}\n\n${ideaText}\n\n${next}`
  return { reply, ideas }
}
