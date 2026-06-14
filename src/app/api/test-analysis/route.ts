import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type ResponseItem = {
  questionText: string
  answerLabel: string
  section: string
}

type PreviousReport = {
  day: number
  text: string
}

const SYSTEM = `You are analyzing personality questionnaire responses for Substrata, a self-knowledge platform.

Rules you must follow:
- Write in second person ("you").
- Be honest, specific, and concise. Name patterns clearly when they're strong.
- Do not restate questions. Synthesize into patterns.
- Briefly note what answer pattern led to each insight (e.g. "Given that you...").
- Avoid clinical language and excessive hedging.
- Do NOT include any URLs, links, book titles, author names, or recommendations for external resources of any kind.`

const SECTION_HEADERS = ['CORE PERSONALITY', 'HOW YOU ATTACH', 'WHAT YOU VALUE', 'IN RELATIONSHIPS']

function buildPrompt(
  responses: ResponseItem[],
  dayNumber: number,
  previousReports?: PreviousReport[]
): string {
  const headerMap: Record<string, string> = {
    personality: '--- CORE PERSONALITY ---',
    attachment:  '--- ATTACHMENT STYLE ---',
    values:      '--- VALUES ---',
  }

  let currentSection = ''
  let formatted = ''
  for (const r of responses) {
    if (r.section !== currentSection) {
      currentSection = r.section
      formatted += `\n${headerMap[r.section]}\n\n`
    }
    formatted += `Q: ${r.questionText}\nA: ${r.answerLabel}\n\n`
  }

  const sectionRules = `Write exactly four sections using these headers on their own line in all caps:

CORE PERSONALITY
HOW YOU ATTACH
WHAT YOU VALUE
IN RELATIONSHIPS

For each section:
1. First line: A single bold sentence (wrap in **double asterisks**) that captures the single most defining trait or pattern. This is the headline — make it direct and specific.
2. Then write exactly 2 paragraphs that expand on this. Include deeper context, tensions, contradictions, and at least one honest blind spot or challenge. Do NOT restate the headline sentence.

The final section (IN RELATIONSHIPS) synthesizes patterns from all three areas to describe how this person shows up in intimate relationships.

Total response must be under 650 words.`

  if (!previousReports || previousReports.length === 0 || dayNumber === 1) {
    return `Analyze the following responses from Session 1. ${sectionRules}

New responses:
${formatted.trim()}`
  }

  const prevContext = previousReports
    .map(r => `--- Session ${r.day} report (already delivered to user) ---\n${r.text.slice(0, 800)}\n`)
    .join('\n')

  return `This is Session ${dayNumber} of an ongoing personality profile. Previous sessions have already revealed insights to the user.

${prevContext}

Based on the NEW answers below, identify patterns, tensions, or developments that were NOT already named in previous sessions. Build on what's been established — don't repeat it. If a new answer contradicts a previous pattern, name that directly.

${sectionRules}

New responses:
${formatted.trim()}`
}

export async function POST(request: Request) {
  const { responses, dayNumber = 1, previousReports } = await request.json() as {
    responses: ResponseItem[]
    dayNumber?: number
    previousReports?: PreviousReport[]
  }

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: SYSTEM,
    messages: [{ role: 'user', content: buildPrompt(responses, dayNumber, previousReports) }],
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
