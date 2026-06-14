import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type ResponseItem = {
  questionText: string
  answerLabel: string
  section: string
}

const SYSTEM = `You are analyzing personality questionnaire responses for Substrata, a self-knowledge platform. Write in second person ("you"). Be honest, specific, and concise. Do not restate the questions — synthesize patterns. For each insight, briefly note what answer pattern led to it (e.g. "The fact that you..."). Avoid clinical language. Do not hedge everything — when a pattern is clear, name it.`

function buildPrompt(responses: ResponseItem[]): string {
  const headers: Record<string, string> = {
    personality: '--- CORE PERSONALITY ---',
    attachment: '--- ATTACHMENT STYLE ---',
    values: '--- VALUES ---',
  }

  let currentSection = ''
  let formatted = ''

  for (const r of responses) {
    if (r.section !== currentSection) {
      currentSection = r.section
      formatted += `\n${headers[r.section]}\n\n`
    }
    formatted += `Q: ${r.questionText}\nA: ${r.answerLabel}\n\n`
  }

  return `Analyze the following questionnaire responses. Write exactly four sections using these headers on their own line in all caps:

CORE PERSONALITY
HOW YOU ATTACH
WHAT YOU VALUE
IN RELATIONSHIPS

Rules:
- Each section: exactly 2 paragraphs. No more.
- Don't restate answers verbatim. Synthesize into patterns.
- For each key observation, briefly mention what answer pattern it's based on.
- The final section synthesizes all three to describe how this person shows up in intimate relationships.
- Be direct. If a pattern is strong, say so. Include at least one honest challenge or blind spot per section.
- Total response should be under 600 words.

Responses:
${formatted.trim()}`
}

export async function POST(request: Request) {
  const { responses } = await request.json() as { responses: ResponseItem[] }

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1400,
    system: SYSTEM,
    messages: [{ role: 'user', content: buildPrompt(responses) }],
  })

  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          controller.enqueue(new TextEncoder().encode(event.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
