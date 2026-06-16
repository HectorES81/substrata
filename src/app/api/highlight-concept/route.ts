import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const { text, section } = await request.json() as { text: string; section: string }

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 250,
    messages: [{
      role: 'user',
      content: `This sentence is from a personality analysis (section: "${section}"):

"${text}"

1. Name the exact psychological concept or framework this insight comes from. Be specific (e.g. "Dismissing-Avoidant Attachment (ECR-R)", "Schwartz Achievement–Benevolence value conflict", "Gottman's Stonewalling pattern", "Affective vs Cognitive Empathy").
2. Explain it in 2 sentences: what it is and why it matters in practice.

Reply in this exact format with no other text:
CONCEPT: [name]
EXPLANATION: [2 sentences]`,
    }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : ''
  const conceptMatch = raw.match(/CONCEPT:\s*(.+)/i)
  const explanationMatch = raw.match(/EXPLANATION:\s*([\s\S]+)/i)

  return Response.json({
    concept: conceptMatch?.[1]?.trim() ?? 'Psychological pattern',
    explanation: explanationMatch?.[1]?.trim() ?? raw.trim(),
  })
}
