export type QuestionType = 'likert' | 'forced_choice' | 'frequency' | 'importance'

export type Option = {
  label: string
  value: number
}

export type Question = {
  id: string
  section: 'personality' | 'attachment' | 'values'
  sectionLabel: string
  text: string
  type: QuestionType
  dimension: string
  options: Option[]
}

const likert: Option[] = [
  { label: "Strongly disagree", value: 1 },
  { label: "Disagree", value: 2 },
  { label: "Neutral", value: 3 },
  { label: "Agree", value: 4 },
  { label: "Strongly agree", value: 5 },
]

const frequency: Option[] = [
  { label: "Never", value: 1 },
  { label: "Rarely", value: 2 },
  { label: "Sometimes", value: 3 },
  { label: "Often", value: 4 },
  { label: "Always", value: 5 },
]

const importance: Option[] = [
  { label: "Not at all", value: 1 },
  { label: "Slightly", value: 2 },
  { label: "Moderately", value: 3 },
  { label: "Very", value: 4 },
  { label: "Essential", value: 5 },
]

// Day allocations: which question IDs to show each day
// Day 1: 5 per section (15 total) — intro to all three areas
// Day 2: 4-5 per section (13 total) — deepening patterns
// Day 3: 3-4 per section (10 total) — completing the picture
export const DAY_QUESTIONS: Record<number, string[]> = {
  1: ['p1','p2','p3','p4','p5',  'a1','a2','a3','a4','a5',  'v1','v2','v3','v4','v5'],
  2: ['p6','p7','p8','p9',       'a6','a7','a8','a9','a10', 'v6','v7','v8','v9'],
  3: ['p10','p11','p12','p13',   'a11','a12','a13',          'v10','v11','v12'],
}

export const DAY_LABELS: Record<number, { title: string; subtitle: string; count: number }> = {
  1: { title: 'First Layer',      subtitle: 'Core Personality · Attachment · Values', count: 15 },
  2: { title: 'Deeper Patterns',  subtitle: 'Core Personality · Attachment · Values', count: 13 },
  3: { title: 'Completing the Map', subtitle: 'Core Personality · Attachment · Values', count: 10 },
}

export const CONFIDENCE_BY_DAY: Record<number, number> = { 1: 30, 2: 55, 3: 75 }

export const QUESTIONS: Question[] = [

  // ── CORE PERSONALITY (Big Five) — 13 questions ─────────────────────────────

  {
    id: "p1", section: "personality", sectionLabel: "Core Personality",
    text: "I enjoy exploring ideas that challenge my existing beliefs.",
    type: "likert", dimension: "openness", options: likert,
  },
  {
    id: "p2", section: "personality", sectionLabel: "Core Personality",
    text: "When I have a free afternoon with no obligations, I'm more drawn to:",
    type: "forced_choice", dimension: "openness",
    options: [
      { label: "Something I've never tried before", value: 5 },
      { label: "Something I already know I enjoy", value: 2 },
    ],
  },
  {
    id: "p3", section: "personality", sectionLabel: "Core Personality",
    text: "How often do you plan your week in advance?",
    type: "frequency", dimension: "conscientiousness", options: frequency,
  },
  {
    id: "p4", section: "personality", sectionLabel: "Core Personality",
    text: "I feel uncomfortable leaving tasks unfinished.",
    type: "likert", dimension: "conscientiousness", options: likert,
  },
  {
    id: "p5", section: "personality", sectionLabel: "Core Personality",
    text: "When starting something new, I tend to:",
    type: "forced_choice", dimension: "conscientiousness",
    options: [
      { label: "Map out a plan before beginning", value: 5 },
      { label: "Dive in and figure it out as I go", value: 2 },
    ],
  },
  {
    id: "p6", section: "personality", sectionLabel: "Core Personality",
    text: "After a full day of social interaction, I usually feel:",
    type: "forced_choice", dimension: "extraversion",
    options: [
      { label: "Drained — I need time alone to recover", value: 1 },
      { label: "Energized — I could keep going", value: 5 },
    ],
  },
  {
    id: "p7", section: "personality", sectionLabel: "Core Personality",
    text: "I find it easy to start conversations with people I don't know.",
    type: "likert", dimension: "extraversion", options: likert,
  },
  {
    id: "p8", section: "personality", sectionLabel: "Core Personality",
    text: "When someone I care about makes a decision I think is wrong, I:",
    type: "forced_choice", dimension: "agreeableness",
    options: [
      { label: "Tell them clearly what I think", value: 2 },
      { label: "Support them while privately disagreeing", value: 5 },
    ],
  },
  {
    id: "p9", section: "personality", sectionLabel: "Core Personality",
    text: "I find it easy to see multiple sides of a conflict, even when I'm directly involved.",
    type: "likert", dimension: "agreeableness", options: likert,
  },
  {
    id: "p10", section: "personality", sectionLabel: "Core Personality",
    text: "How often do you replay conversations afterward, wondering if you said something wrong?",
    type: "frequency", dimension: "neuroticism", options: frequency,
  },
  {
    id: "p11", section: "personality", sectionLabel: "Core Personality",
    text: "When plans change unexpectedly, my first reaction is usually:",
    type: "forced_choice", dimension: "neuroticism",
    options: [
      { label: "Frustration or anxiety", value: 5 },
      { label: "Curiosity — let's see where this goes", value: 1 },
    ],
  },
  {
    id: "p12", section: "personality", sectionLabel: "Core Personality",
    text: "I tend to worry about things I can't control.",
    type: "likert", dimension: "neuroticism", options: likert,
  },
  {
    id: "p13", section: "personality", sectionLabel: "Core Personality",
    text: "People who know me well would describe me as more:",
    type: "forced_choice", dimension: "general",
    options: [
      { label: "Intense and emotionally complex", value: 1 },
      { label: "Easy-going and consistent", value: 5 },
    ],
  },

  // ── ATTACHMENT STYLE (ECR-R inspired) — 13 questions ──────────────────────

  {
    id: "a1", section: "attachment", sectionLabel: "Attachment Style",
    text: "I worry that the people I'm close to don't value me as much as I value them.",
    type: "likert", dimension: "anxiety", options: likert,
  },
  {
    id: "a2", section: "attachment", sectionLabel: "Attachment Style",
    text: "When someone important to me goes quiet for a day or two, how often do you start wondering what you did wrong?",
    type: "frequency", dimension: "anxiety", options: frequency,
  },
  {
    id: "a3", section: "attachment", sectionLabel: "Attachment Style",
    text: "In close relationships, I tend to:",
    type: "forced_choice", dimension: "anxiety",
    options: [
      { label: "Need regular reassurance that things are okay", value: 5 },
      { label: "Assume things are fine unless told otherwise", value: 1 },
    ],
  },
  {
    id: "a4", section: "attachment", sectionLabel: "Attachment Style",
    text: "I feel anxious when a partner needs space or alone time.",
    type: "likert", dimension: "anxiety", options: likert,
  },
  {
    id: "a5", section: "attachment", sectionLabel: "Attachment Style",
    text: "When conflict arises in a relationship, my instinct is to:",
    type: "forced_choice", dimension: "anxiety",
    options: [
      { label: "Address it right away — I can't rest until it's resolved", value: 5 },
      { label: "Wait for things to cool before talking", value: 1 },
    ],
  },
  {
    id: "a6", section: "attachment", sectionLabel: "Attachment Style",
    text: "I'm comfortable depending on others when I need help.",
    type: "likert", dimension: "avoidance_reverse", options: likert,
  },
  {
    id: "a7", section: "attachment", sectionLabel: "Attachment Style",
    text: "When I'm going through something difficult emotionally, I:",
    type: "forced_choice", dimension: "avoidance",
    options: [
      { label: "Reach out to someone close to me", value: 1 },
      { label: "Work through it on my own first", value: 5 },
    ],
  },
  {
    id: "a8", section: "attachment", sectionLabel: "Attachment Style",
    text: "Getting emotionally close to someone makes me uncomfortable.",
    type: "likert", dimension: "avoidance", options: likert,
  },
  {
    id: "a9", section: "attachment", sectionLabel: "Attachment Style",
    text: "In my ideal relationship, there is:",
    type: "forced_choice", dimension: "avoidance",
    options: [
      { label: "A high degree of togetherness and shared life", value: 1 },
      { label: "Clear space for individual independence", value: 5 },
    ],
  },
  {
    id: "a10", section: "attachment", sectionLabel: "Attachment Style",
    text: "How often have partners wanted more emotional closeness than you were comfortable with?",
    type: "frequency", dimension: "avoidance", options: frequency,
  },
  {
    id: "a11", section: "attachment", sectionLabel: "Attachment Style",
    text: "When I'm not someone's first priority for a stretch of time, I:",
    type: "forced_choice", dimension: "anxiety",
    options: [
      { label: "Understand — everyone has their own life", value: 1 },
      { label: "Feel it, and it bothers me more than I'd like", value: 5 },
    ],
  },
  {
    id: "a12", section: "attachment", sectionLabel: "Attachment Style",
    text: "Your partner cancels plans you were looking forward to, citing work stress. Your reaction:",
    type: "forced_choice", dimension: "anxiety",
    options: [
      { label: "Disappointed but fine — I'll suggest rescheduling", value: 2 },
      { label: "Hurt and wondering if something's wrong between us", value: 5 },
      { label: "Quietly relieved to have unexpected free time", value: 1 },
      { label: "Frustrated — I want to talk about it right away", value: 4 },
    ],
  },
  {
    id: "a13", section: "attachment", sectionLabel: "Attachment Style",
    text: "I find it easy to be emotionally present and available to someone I care about.",
    type: "likert", dimension: "avoidance_reverse", options: likert,
  },

  // ── VALUES (Schwartz inspired) — 12 questions ─────────────────────────────

  {
    id: "v1", section: "values", sectionLabel: "Values",
    text: "It matters more to me to:",
    type: "forced_choice", dimension: "power_vs_integrity",
    options: [
      { label: "Be respected and recognized for my achievements", value: 2 },
      { label: "Stay true to my values regardless of others' opinions", value: 5 },
    ],
  },
  {
    id: "v2", section: "values", sectionLabel: "Values",
    text: "Professional success and ambition are central to how I see myself.",
    type: "likert", dimension: "achievement", options: likert,
  },
  {
    id: "v3", section: "values", sectionLabel: "Values",
    text: "When I have extra time or money to give, I'm more likely to:",
    type: "forced_choice", dimension: "benevolence_scope",
    options: [
      { label: "Invest in people I'm close to", value: 1 },
      { label: "Contribute to causes that help people I don't know", value: 5 },
    ],
  },
  {
    id: "v4", section: "values", sectionLabel: "Values",
    text: "I feel a personal responsibility to act on social injustice.",
    type: "likert", dimension: "universalism", options: likert,
  },
  {
    id: "v5", section: "values", sectionLabel: "Values",
    text: "How important is stability and routine in your daily life?",
    type: "importance", dimension: "security", options: importance,
  },
  {
    id: "v6", section: "values", sectionLabel: "Values",
    text: "I place more value on:",
    type: "forced_choice", dimension: "tradition_vs_change",
    options: [
      { label: "Preserving things that have worked well over time", value: 1 },
      { label: "Questioning traditions to find better ways", value: 5 },
    ],
  },
  {
    id: "v7", section: "values", sectionLabel: "Values",
    text: "I need variety and novelty in my life to feel truly engaged.",
    type: "likert", dimension: "stimulation", options: likert,
  },
  {
    id: "v8", section: "values", sectionLabel: "Values",
    text: "Given the choice, I'd rather:",
    type: "forced_choice", dimension: "depth_vs_breadth",
    options: [
      { label: "Go very deep on one thing over many years", value: 1 },
      { label: "Experience many different things at a high level", value: 5 },
    ],
  },
  {
    id: "v9", section: "values", sectionLabel: "Values",
    text: "Enjoying life's pleasures — good food, travel, rest — is as valid a priority as productivity.",
    type: "likert", dimension: "hedonism", options: likert,
  },
  {
    id: "v10", section: "values", sectionLabel: "Values",
    text: "How important is it that a long-term partner shares your political views?",
    type: "importance", dimension: "dealbreaker_politics", options: importance,
  },
  {
    id: "v11", section: "values", sectionLabel: "Values",
    text: "How important is it that a long-term partner agrees with you about having children?",
    type: "importance", dimension: "dealbreaker_children", options: importance,
  },
  {
    id: "v12", section: "values", sectionLabel: "Values",
    text: "How important is spiritual or religious compatibility in a relationship?",
    type: "importance", dimension: "dealbreaker_religion", options: importance,
  },
]
