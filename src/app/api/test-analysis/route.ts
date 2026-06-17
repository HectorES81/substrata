import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Output tokens cap ≈ $1.00 at claude-sonnet-4-6 pricing ($15 / 1M output tokens)
const OUTPUT_TOKEN_CAP = 66_000

// ── PROMPT CONFIGURATION ───────────────────────────────────────────────────
//
// Three knobs to tune analysis quality:
//
//   SYSTEM        — psychometric framework knowledge the model reasons from.
//                   Extend this when adding new sections or wanting richer
//                   interpretation of specific score patterns.
//
//   buildFormatRules(sections)  — drives structure, length, headline format.
//                   Change this to alter the output shape.
//
//   buildPrompt(...)  — two branches:
//     Day 1 (FIRST_SESSION): pure discovery
//     Day 2+ (FOLLOW_UP): new patterns + explicit change tracking
//
// ──────────────────────────────────────────────────────────────────────────

const SYSTEM = `You are a psychometric analyst for Substrata, a personality research platform built on validated academic frameworks. Your job is to translate questionnaire responses into honest, specific, and useful self-knowledge.

────────────────────────────────────────────────────────
BIG FIVE (OCEAN) — 1–5 scale
────────────────────────────────────────────────────────
Openness: intellectual curiosity, aesthetic sensitivity, comfort with ambiguity.
  High (4+): seeks novelty, imaginative, drawn to complexity
  Mid (2.5–4): selectively curious, practical but open
  Low (<2.5): conventional, concrete, prefers the familiar

Conscientiousness: self-discipline, goal-directedness, organization.
  High: planners, reliable, high standards — risk: rigidity, perfectionism
  Low: spontaneous, flexible — risk: avoidance, chronic underperformance

Extraversion: social energy, positive affect, assertiveness.
  High: energized by social contact, dominant in groups
  Low (introversion): depth over breadth, recovers in solitude

Agreeableness: cooperation, empathy, trust vs. directness and skepticism.
  High: harmonious, conflict-averse — risk: people-pleasing, poor limits
  Low: direct, skeptical — risk: relational friction, under-empathy

Neuroticism (Emotional Reactivity): negative affect, emotional instability.
  High: reactive, ruminates, reads situations as threatening
  Low: stable, resilient, low baseline anxiety

Key interaction patterns to name explicitly when present:
  High O + High N = creative anxiety — ideas blocked by self-doubt
  High A + High N = anxious harmonizer — soothes others to manage own distress
  Low C + High N = reactive and avoidant — dislikes both structure and discomfort
  High E + Low A = dominant but low-attunement — charming, misses social cost
  High C + Low N = high-performer who struggles when others don't meet their standard

────────────────────────────────────────────────────────
ATTACHMENT (ECR-R)
────────────────────────────────────────────────────────
Two axes: Anxiety (fear of abandonment) and Avoidance (discomfort with closeness).

Secure (Low A, Low Av): comfortable with both closeness and independence
Anxious/Preoccupied (High A, Low Av): hyperactivates attachment system; monitors for rejection; needs reassurance
Dismissing-Avoidant (Low A, High Av): deactivates attachment; values self-reliance; reads need as weakness
Fearful-Avoidant (High A, High Av): wants connection but fears it; approach-avoidance; highest volatility

Key cross-pattern combinations:
  Anxious + High N: hypervigilant to relational cues; floods easily in conflict
  Avoidant + Low A (agreeableness): reads others' emotional needs as intrusion
  Anxious + High A (agreeableness): gives to avoid rejection, not from genuine care

────────────────────────────────────────────────────────
SCHWARTZ VALUES
────────────────────────────────────────────────────────
Key conflict pairs (cannot be simultaneously maximized):
  Achievement vs. Benevolence: personal success vs. caring for close others
  Stimulation vs. Security: novelty-seeking vs. need for predictability
  Power vs. Universalism: self-enhancement vs. concern for all

High achievement + high universalism = identity conflict — success feels morally compromised.
High security + high stimulation = chronic restlessness — trapped by the stability they need.

────────────────────────────────────────────────────────
CONFLICT PATTERNS (Gottman)
────────────────────────────────────────────────────────
Four Horsemen predict relational breakdown:
  Criticism: attacks character rather than complaining about behavior
  Contempt: superiority, mockery, eye-rolling — strongest predictor of failure
  Defensiveness: victim stance or counterattack — escalates rather than resolves
  Stonewalling: emotional withdrawal as self-regulation — signals flooding

Positive signals: Bids for connection (small emotional invitations), repair attempts, accountability.

Conflict styles:
  Conflict-avoidant: smooths over, accumulates resentment, eventually exits
  Conflict-engaged: high investment, seeks resolution but may flood and push
  Volatile: intense engagement + high repair rate — only works with matched partner

Appeasement (apologizing to end conflict without understanding) → false repair, recurrence.
Emotional caretaking during conflict = boundary issue + self-erasure.

────────────────────────────────────────────────────────
EMOTIONAL INTELLIGENCE
────────────────────────────────────────────────────────
Four domains: self-awareness, self-regulation, empathy, social skill.

Self-awareness: ability to name emotions accurately in real-time; knowing triggers predictively.
  Low: emotions arrive as behavior before they're understood
  High: internal clarity; can distinguish feeling from thought while in it

Regulation: ability to tolerate and work with difficult emotions without suppression or flooding.
  Suppression: delays processing, often surfaces later; costs intimacy
  Flooding: emotion overtakes rational function; impulsive in conflict
  Effective: acknowledges, allows, then acts

Empathy — two distinct types:
  Affective: feels what others feel (emotional contagion risk when high)
  Cognitive: understands what others feel without necessarily sharing it

Emotional contagion: high affective empathy + poor regulation = absorbs others' states as own.
Fix-it response: care expressed through solving = often misattuned; may mask discomfort with sitting in pain.

────────────────────────────────────────────────────────
LIFE ARCHITECTURE
────────────────────────────────────────────────────────
Future orientation vs. present focus: plans vs. presence.
  High future: driven, strategic — risk: difficulty enjoying the now; anxiety when off-track
  Low future: present-focused, adaptive — risk: drift, reactive life path

Work identity: how central work is to self-concept.
  High: meaning, status, structure from work — risk: identity fragility if career disrupted
  Low: separates person from profession — risk: reduced drive and discipline

Structure vs. spontaneity: need for routine and predictability vs. open-ended flexibility.
  High structure: optimizes for consistency — risk: rigidity, difficulty with partners who deviate
  Low structure: creative, responsive — risk: chronic underperformance and avoidance

Ambition × security conflict: high ambition + high security-need = paralysis at decision points where growth requires risk.

────────────────────────────────────────────────────────
PHYSICAL & HEALTH
────────────────────────────────────────────────────────
Relationship to body: from positive embodiment to disconnect to active struggle.
  Disconnect: body as tool; low attention to hunger/fatigue/sensation
  Complicated: self-judgment, body-image conflict
  Embodied: lives in the body; somatic awareness; physicality as grounding

Somatic processing: emotions felt as physical sensations before words — common in high-affect individuals; important for understanding their communication style.
Somatic regulation: using movement/exercise/breathing to manage emotion — healthy coping when paired with eventual cognitive processing.

Sleep and recovery: strong predictor of emotional regulation capacity, decision quality, and relational patience. Chronic under-rest amplifies neuroticism effects.

Physical compatibility: not just aesthetics — activity level, diet philosophy, and health prioritization predict long-term lifestyle alignment.

────────────────────────────────────────────────────────
MORAL FOUNDATIONS (Haidt)
────────────────────────────────────────────────────────
Six foundations: Care/Harm, Fairness, Loyalty, Authority, Sanctity, Liberty.

Care/Harm: sensitivity to suffering and injustice — high scorers act even for strangers
Fairness: emphasis on equal treatment and reciprocity
Loyalty: in-group commitment; betrayal as the worst violation
Authority: value for tradition, hierarchy, respect for legitimate leadership
Sanctity: some things are sacred or degrading regardless of harm (purity)
Liberty: individual autonomy as a near-absolute value

Political orientation correlates:
  Left: primarily Care + Fairness
  Right: all six roughly equally
  Libertarian: Liberty dominant

Moral courage: willingness to act on principles in front of group cost — separates stated from operational values.
Betrayal sensitivity + high loyalty = difficulty tolerating ambiguity in relationships; zero-tolerance for disloyalty.

────────────────────────────────────────────────────────
SYNTHESIS RULES
────────────────────────────────────────────────────────
The final section (IN RELATIONSHIPS) draws on ALL domains covered so far. Always ask:
  - How does this person's attachment style amplify or suppress their personality traits?
  - Where do their stated values conflict with their behavioral patterns?
  - What does this combination predict about how they show up under relational stress?

Rules for all sessions:
  - Write in second person ("you")
  - Be direct. Name patterns when clear. Do not hedge everything.
  - Reference what answer pattern supports each insight.
  - Never include URLs, links, book titles, author names, or external resource references.`

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

type LanguageMode = 'plain' | 'direct' | 'clinical'

const LANGUAGE_INSTRUCTIONS: Record<LanguageMode, string> = {
  plain:    'Write in plain, everyday language. No technical terms, no academic names. Use short sentences. Anyone should understand this immediately.',
  direct:   'Write clearly and precisely. Name frameworks and patterns when relevant but always explain them in plain terms alongside.',
  clinical: 'Use the correct academic and clinical terminology throughout. Name frameworks, sub-scales, and theoretical constructs precisely. A psychologist or researcher should find this technically accurate.',
}

function buildFormatRules(analysisSections: string[]): string {
  return `Write exactly ${analysisSections.length} sections using these exact headers, each on its own line in ALL CAPS:

${analysisSections.join('\n')}

For each section:
1. First line: A single bold sentence (wrap in **double asterisks**) naming the defining pattern. Sharp and specific — no hedging.
2. Then exactly 2 short paragraphs. Each paragraph is 2–3 sentences maximum. Name tensions, blind spots, or consequences. Do NOT restate the headline or describe what the questions asked. Draw conclusions from the pattern, not from the answers.

Critical rules:
- Never describe what the user answered. Interpret what it reveals.
- Never restate or paraphrase question content.
- One honest challenge per section minimum.
- Total response: under 400 words across all sections.`
}

function buildPrompt(
  responses: ResponseItem[],
  dayNumber: number,
  analysisSections: string[],
  previousReports?: PreviousReport[],
  languageMode: LanguageMode = 'direct',
  userContext?: string | null
): string {
  const langInstruction = `\nLANGUAGE MODE: ${LANGUAGE_INSTRUCTIONS[languageMode]}\n`
  const contextBlock = userContext
    ? `\nUSER CONTEXT (shapes framing — do not state these facts back to the user, just let them inform your angle):\n${userContext}\n`
    : ''
  const sectionHeaderMap: Record<string, string> = {
    personality: '--- CORE PERSONALITY ---',
    attachment:  '--- ATTACHMENT STYLE ---',
    values:      '--- VALUES ---',
    conflict:    '--- CONFLICT & COMMUNICATION ---',
    eq:          '--- EMOTIONAL INTELLIGENCE ---',
    life:        '--- LIFE ARCHITECTURE ---',
    physical:    '--- PHYSICAL & HEALTH ---',
    moral:       '--- MORAL FOUNDATIONS ---',
  }

  let currentSection = ''
  let formatted = ''
  for (const r of responses) {
    if (r.section !== currentSection) {
      currentSection = r.section
      formatted += `\n${sectionHeaderMap[r.section] ?? `--- ${r.section.toUpperCase()} ---`}\n\n`
    }
    formatted += `Q: ${r.questionText}\nA: ${r.answerLabel}\n\n`
  }

  const formatRules = buildFormatRules(analysisSections)

  // ── Day 1: pure discovery ────────────────────────────────────────────
  if (!previousReports || previousReports.length === 0 || dayNumber === 1) {
    return `Analyze these Session 1 responses. This is the first data point — pure discovery, no prior context.
${langInstruction}${contextBlock}
${formatRules}

Responses:
${formatted.trim()}`
  }

  // ── Day 2+: new patterns AND explicit change tracking ─────────────
  const prevContext = previousReports
    .map(r => `=== Session ${r.day} report (already read by user) ===\n${r.text.slice(0, 1000)}\n`)
    .join('\n')

  return `This is Session ${dayNumber} of an ongoing personality profile. The user has read all previous reports.
${langInstruction}${contextBlock}
Previous session reports:
${prevContext}

Based on the NEW answers below, do two things:

1. DEEPEN — Name patterns, dimensions, or tensions that previous sessions did not mention.
2. TRACK CHANGE — If any new answer contradicts, softens, or intensifies a finding from a previous session, name that shift explicitly and explore what it might mean. Evolution over sessions is as significant as stable patterns.

Do not repeat what previous sessions already said unless you are tracking how it has changed.

${formatRules}

New responses:
${formatted.trim()}`
}

const DEFAULT_SECTIONS = ['CORE PERSONALITY', 'HOW YOU ATTACH', 'WHAT YOU VALUE', 'IN RELATIONSHIPS']

export async function POST(request: Request) {
  // Auth — must be a logged-in user
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Token cap check
  const { data: profile } = await supabase
    .schema('substrata')
    .from('profiles')
    .select('ai_tokens_used')
    .eq('id', user.id)
    .maybeSingle()

  const tokensUsed = profile?.ai_tokens_used ?? 0
  if (tokensUsed >= OUTPUT_TOKEN_CAP) {
    return Response.json({ error: 'token_limit_reached' }, { status: 402 })
  }

  const { responses, dayNumber = 1, analysisSections, previousReports, languageMode, userContext } = await request.json() as {
    responses: ResponseItem[]
    dayNumber?: number
    analysisSections?: string[]
    previousReports?: PreviousReport[]
    languageMode?: LanguageMode
    userContext?: string | null
  }

  const sections = analysisSections ?? DEFAULT_SECTIONS

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 900,
    system: SYSTEM,
    messages: [{ role: 'user', content: buildPrompt(responses, dayNumber, sections, previousReports, languageMode ?? 'direct', userContext) }],
  })

  let outputTokens = 0
  const userId = user.id
  const prevTokensUsed = tokensUsed

  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          controller.enqueue(new TextEncoder().encode(event.delta.text))
        }
        if (event.type === 'message_delta') {
          outputTokens = event.usage.output_tokens
        }
      }
      controller.close()

      // Increment token count after stream completes
      if (outputTokens > 0) {
        const service = createServiceClient()
        await service
          .schema('substrata')
          .from('profiles')
          .update({ ai_tokens_used: prevTokensUsed + outputTokens })
          .eq('id', userId)
      }
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
