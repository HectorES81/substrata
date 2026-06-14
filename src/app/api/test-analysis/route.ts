import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type ResponseItem = {
  questionText: string
  answerLabel: string
  section: string
}

const SYSTEM = `You are analyzing personality questionnaire responses for a person using Substrata, a personality profiling platform. Write in second person ("you"). Be specific, honest, and personal — like a wise friend who read everything carefully, not a generated report. Name the actual patterns you see. Do not be vague or generic.`

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

  return `The person answered 38 questions across three frameworks: Big Five personality traits, Attachment Theory (ECR-R), and Schwartz Values.

Write an honest, specific personality analysis. Include both strengths and honest observations about blind spots or relationship challenges. Do not hedge everything — commit to what the pattern suggests.

Use exactly these four section headers, each on its own line in all caps, with no extra symbols:

CORE PERSONALITY
HOW YOU ATTACH
WHAT YOU VALUE
IN RELATIONSHIPS

Write 2–3 paragraphs per section. The final section should synthesize all three frameworks to describe how this person shows up in intimate relationships.

Responses:
${formatted.trim()}`
}

export async function POST(request: Request) {
  const { responses } = await request.json() as { responses: ResponseItem[] }

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
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
