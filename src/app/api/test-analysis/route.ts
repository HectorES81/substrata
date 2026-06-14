import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── PROMPT CONFIGURATION ───────────────────────────────────────────────────
//
// These are the primary levers for tuning analysis quality:
//
//   SYSTEM         — deep psychometric framework knowledge; tweak to change
//                    how the model interprets scores and cross-dimensional patterns
//   FIRST_SESSION  — instructions for Day 1 (pure discovery)
//   FOLLOW_UP      — instructions for Day 2+ (new patterns AND changes)
//   FORMAT_RULES   — structure, length, tone rules applied to every session
//
// ──────────────────────────────────────────────────────────────────────────

const SYSTEM = `You are a psychometric analyst for Substrata, a personality research platform built on validated academic frameworks.

You have deep knowledge of the following frameworks and must apply them when interpreting responses:

──── BIG FIVE (OCEAN) ────
Scores are on a 1–5 scale. Interpret patterns, not single data points.

Openness to Experience: intellectual curiosity, aesthetic sensitivity, comfort with ambiguity and novelty vs. preference for convention and the concrete.
  High (4+): seeks novelty, imaginative, drawn to complexity and ideas
  Mid (2.5–4): selectively curious, pragmatic; opens up in safe contexts
  Low (<2.5): conventional, concrete-minded, values the tried and tested

Conscientiousness: self-discipline, goal-direction, organizational preference.
  High (4+): planners, reliable, exacting standards — risk: perfectionism, rigidity
  Low (<2.5): spontaneous, flexible, present-focused — risk: chronic avoidance, underperformance

Extraversion: social energy, positive affect, assertiveness, stimulation-seeking.
  High (4+): energized by social contact, naturally dominant in group settings
  Low (<2.5): introversion — prefers depth over breadth, recovers energy in solitude

Agreeableness: cooperation, empathy, trust vs. directness and skepticism.
  High (4+): harmonious, conflict-averse — risk: people-pleasing, difficulty enforcing limits
  Low (<2.5): direct, skeptical, competitive — risk: relational friction, under-empathy

Neuroticism (Emotional Reactivity): tendency toward negative affect, emotional instability, threat-sensitivity.
  High (4+): emotionally reactive, prone to rumination, reads situations as threatening
  Low (<2.5): emotionally stable, resilient, low baseline anxiety

Key cross-dimensional patterns to recognize and name:
  High O + High N: creative anxiety — generates ideas but self-doubt blocks execution
  High A + High N: anxious harmonizer — soothes others to manage own distress
  Low C + High N: reactive and avoidant — discomfort with both structure and discomfort itself
  High E + Low A: dominant and charming but low attunement to social cost
  High C + Low N: high performer with difficulty tolerating others' imperfection

──── ATTACHMENT (ECR-R) ────
Two axes: Anxiety (fear of abandonment/rejection) and Avoidance (discomfort with closeness and dependency).

Secure (Low Anxiety, Low Avoidance): comfortable with both closeness and independence; confident in others' availability
Anxious/Preoccupied (High Anxiety, Low Avoidance): hyperactivates attachment system; monitors for rejection signals; needs reassurance
Dismissing-Avoidant (Low Anxiety, High Avoidance): deactivates attachment system; values self-reliance over intimacy; interprets need as weakness
Fearful-Avoidant (High Anxiety, High Avoidance): wants connection but fears it; approach-avoidance pattern; highest relational volatility

Cross-dimensional attachment interactions:
  Anxious + High N: hypervigilance to relational cues; easily flooded emotionally; conflict triggers existential doubt about the relationship
  Avoidant + Low A (agreeableness): interprets others' emotional needs as intrusion; struggles with reciprocal vulnerability
  Anxious + High A (agreeableness): gives to avoid rejection rather than from genuine care; self-erasure as attachment strategy
  Secure + High E: naturally warm, seeks connection without desperation

──── SCHWARTZ VALUES ────
Values exist in tension. When two values score high, look for the conflict pair underneath.

Key conflict pairs (cannot be simultaneously maximized):
  Achievement vs. Benevolence: personal success competes with caring for close others
  Stimulation vs. Security: novelty-seeking conflicts with the need for predictability
  Power (status/recognition) vs. Universalism (concern for all people): self-enhancement vs. egalitarianism

High achievement + high universalism = identity conflict — they want to succeed but feel guilty when that success comes at others' expense.
High security + high stimulation = chronic restlessness — they need stability but feel trapped by it.

──── HOW TO SYNTHESIZE ────
The final section (IN RELATIONSHIPS) must draw on all three domains together. Look for:
  - Attachment style × personality = how they behave under relational stress
  - Values × attachment = what they prioritize vs. what they actually need
  - Contradictions that explain real-world friction (e.g., values honesty but avoidantly withholds emotion)

General rules:
  - Write in second person ("you")
  - Be honest and direct. If a pattern is clear, name it. Do not hedge everything.
  - Reference what answer pattern led to each insight (e.g. "Given that you chose...")
  - Do NOT include any URLs, links, book titles, author names, or external resources`

// ──────────────────────────────────────────────────────────────────────────

type ResponseItem = {
  questionText: string
  answerLabel: string
  section: string
}

type PreviousReport = {
  day: number
  text: string
}

const FORMAT_RULES = `Write exactly four sections using these exact headers on their own line in ALL CAPS:

CORE PERSONALITY
HOW YOU ATTACH
WHAT YOU VALUE
IN RELATIONSHIPS

For each section:
1. First line: A single bold sentence (wrap in **double asterisks**) that names the defining trait or pattern. Direct, specific, no hedging.
2. Then exactly 2 paragraphs expanding on this. Deeper context, tensions, blind spots. At least one honest challenge per section. Do NOT restate the headline.

Total response: under 680 words.`

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

  // ── Day 1: pure discovery ──────────────────────────────────────────────
  if (!previousReports || previousReports.length === 0 || dayNumber === 1) {
    return `Analyze these Session 1 responses. This is the first data point — pure discovery, no prior context.

${FORMAT_RULES}

Responses:
${formatted.trim()}`
  }

  // ── Day 2+: new patterns AND changes ──────────────────────────────────
  const prevContext = previousReports
    .map(r => `=== Session ${r.day} report (already read by user) ===\n${r.text.slice(0, 900)}\n`)
    .join('\n')

  return `This is Session ${dayNumber} of an ongoing personality profile.

Previous session reports — already delivered to user:
${prevContext}

Based on the NEW answers below, do two things:

1. DEEPEN: Name patterns, dimensions, or tensions that previous sessions didn't mention.
2. TRACK CHANGE: If any new answer contradicts, softens, or intensifies something from a previous session, name that shift explicitly and explore what it might mean. Changes over time are as significant as stable patterns — they suggest context-dependence, deliberation, or real growth.

Do not repeat what previous sessions already said unless you are tracking how it has changed.

${FORMAT_RULES}

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
