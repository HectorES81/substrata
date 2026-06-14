export type QuestionType = 'likert' | 'forced_choice' | 'frequency' | 'importance'

export type Section =
  | 'personality' | 'attachment' | 'values'
  | 'conflict' | 'eq' | 'life' | 'physical' | 'moral'

export type Option = {
  label: string
  value: number
}

export type Question = {
  id: string
  section: Section
  sectionLabel: string
  text: string
  type: QuestionType
  dimension: string
  options: Option[]
}

// ── Shared option scales ───────────────────────────────────────────────────

const likert: Option[] = [
  { label: "Strongly disagree", value: 1 },
  { label: "Disagree",          value: 2 },
  { label: "Neutral",           value: 3 },
  { label: "Agree",             value: 4 },
  { label: "Strongly agree",    value: 5 },
]

const frequency: Option[] = [
  { label: "Never",     value: 1 },
  { label: "Rarely",    value: 2 },
  { label: "Sometimes", value: 3 },
  { label: "Often",     value: 4 },
  { label: "Always",    value: 5 },
]

const importance: Option[] = [
  { label: "Not at all", value: 1 },
  { label: "Slightly",   value: 2 },
  { label: "Moderately", value: 3 },
  { label: "Very",       value: 4 },
  { label: "Essential",  value: 5 },
]

// ── Day configuration ──────────────────────────────────────────────────────

// Which question IDs appear on each day
export const DAY_QUESTIONS: Record<number, string[]> = {
  1: ['p1','p2','p3','p4','p5',  'a1','a2','a3','a4','a5',  'v1','v2','v3','v4','v5'],
  2: ['p6','p7','p8','p9',       'a6','a7','a8','a9','a10', 'v6','v7','v8','v9'],
  3: ['p10','p11','p12','p13',   'a11','a12','a13',          'v10','v11','v12'],
  4: ['c1','c2','c3','c4','c5','c6','c7','c8','c9','c10','c11','c12'],
  5: ['e1','e2','e3','e4','e5','e6','e7','e8','e9','e10','e11','e12'],
  6: ['l1','l2','l3','l4','l5','l6','l7','l8','l9','l10','l11','l12'],
  7: ['h1','h2','h3','h4','h5','h6','h7','h8','h9','h10'],
  8: ['m1','m2','m3','m4','m5','m6','m7','m8','m9','m10','m11','m12'],
}

export const DAY_LABELS: Record<number, { title: string; subtitle: string; count: number }> = {
  1: { title: 'First Layer',          subtitle: 'Core Personality · Attachment · Values',       count: 15 },
  2: { title: 'Deeper Patterns',      subtitle: 'Core Personality · Attachment · Values',       count: 13 },
  3: { title: 'Completing the Map',   subtitle: 'Core Personality · Attachment · Values',       count: 10 },
  4: { title: 'Conflict & Connection',subtitle: 'How you handle friction and repair',            count: 12 },
  5: { title: 'Emotional Landscape',  subtitle: 'Self-awareness · Regulation · Empathy',        count: 12 },
  6: { title: 'Life Architecture',    subtitle: 'Ambitions · Structure · Work identity',         count: 12 },
  7: { title: 'Body & Health',        subtitle: 'Physical patterns and relationship with body',  count: 10 },
  8: { title: 'Moral Foundations',    subtitle: 'What you believe is right — and why',          count: 12 },
}

// Profile confidence % after completing each day
export const CONFIDENCE_BY_DAY: Record<number, number> = {
  1: 8, 2: 18, 3: 30, 4: 42, 5: 55, 6: 65, 7: 73, 8: 80,
}

// Analysis section headers the AI will use for each day's report
export const DAY_ANALYSIS_HEADERS: Record<number, string[]> = {
  1: ['CORE PERSONALITY', 'HOW YOU ATTACH', 'WHAT YOU VALUE',           'IN RELATIONSHIPS'],
  2: ['CORE PERSONALITY', 'HOW YOU ATTACH', 'WHAT YOU VALUE',           'IN RELATIONSHIPS'],
  3: ['CORE PERSONALITY', 'HOW YOU ATTACH', 'WHAT YOU VALUE',           'IN RELATIONSHIPS'],
  4: ['HOW YOU HANDLE CONFLICT', 'UNDER PRESSURE', 'REPAIR AND RECONNECTION', 'IN RELATIONSHIPS'],
  5: ['YOUR EMOTIONAL WORLD', 'EMOTIONAL REGULATION', 'EMPATHY AND ATTUNEMENT', 'IN RELATIONSHIPS'],
  6: ['HOW YOU STRUCTURE YOUR LIFE', 'WORK AND IDENTITY', 'YOUR AMBITIONS',      'IN RELATIONSHIPS'],
  7: ['YOUR BODY AND HEALTH', 'PHYSICAL PATTERNS', 'EMBODIMENT',                  'IN RELATIONSHIPS'],
  8: ['YOUR MORAL FOUNDATIONS', 'WHAT YOU STAND FOR', 'ETHICS IN RELATIONSHIP',   'IN RELATIONSHIPS'],
}

// All possible analysis headers across all days (used by parseAnalysis)
export const ALL_SECTION_HEADERS = new Set([
  'CORE PERSONALITY', 'HOW YOU ATTACH', 'WHAT YOU VALUE', 'IN RELATIONSHIPS',
  'HOW YOU HANDLE CONFLICT', 'UNDER PRESSURE', 'REPAIR AND RECONNECTION',
  'YOUR EMOTIONAL WORLD', 'EMOTIONAL REGULATION', 'EMPATHY AND ATTUNEMENT',
  'HOW YOU STRUCTURE YOUR LIFE', 'WORK AND IDENTITY', 'YOUR AMBITIONS',
  'YOUR BODY AND HEALTH', 'PHYSICAL PATTERNS', 'EMBODIMENT',
  'YOUR MORAL FOUNDATIONS', 'WHAT YOU STAND FOR', 'ETHICS IN RELATIONSHIP',
])

// ── Questions ──────────────────────────────────────────────────────────────

export const QUESTIONS: Question[] = [

  // ── CORE PERSONALITY (Big Five) — p1–p13 ──────────────────────────────

  {
    id: 'p1', section: 'personality', sectionLabel: 'Core Personality',
    text: 'I enjoy exploring ideas that challenge my existing beliefs.',
    type: 'likert', dimension: 'openness', options: likert,
  },
  {
    id: 'p2', section: 'personality', sectionLabel: 'Core Personality',
    text: 'When I have a free afternoon with no obligations, I\'m more drawn to:',
    type: 'forced_choice', dimension: 'openness',
    options: [
      { label: 'Something I\'ve never tried before', value: 5 },
      { label: 'Something I already know I enjoy',   value: 2 },
    ],
  },
  {
    id: 'p3', section: 'personality', sectionLabel: 'Core Personality',
    text: 'How often do you plan your week in advance?',
    type: 'frequency', dimension: 'conscientiousness', options: frequency,
  },
  {
    id: 'p4', section: 'personality', sectionLabel: 'Core Personality',
    text: 'I feel uncomfortable leaving tasks unfinished.',
    type: 'likert', dimension: 'conscientiousness', options: likert,
  },
  {
    id: 'p5', section: 'personality', sectionLabel: 'Core Personality',
    text: 'When starting something new, I tend to:',
    type: 'forced_choice', dimension: 'conscientiousness',
    options: [
      { label: 'Map out a plan before beginning',       value: 5 },
      { label: 'Dive in and figure it out as I go',     value: 2 },
    ],
  },
  {
    id: 'p6', section: 'personality', sectionLabel: 'Core Personality',
    text: 'After a full day of social interaction, I usually feel:',
    type: 'forced_choice', dimension: 'extraversion',
    options: [
      { label: 'Drained — I need time alone to recover', value: 1 },
      { label: 'Energized — I could keep going',         value: 5 },
    ],
  },
  {
    id: 'p7', section: 'personality', sectionLabel: 'Core Personality',
    text: 'I find it easy to start conversations with people I don\'t know.',
    type: 'likert', dimension: 'extraversion', options: likert,
  },
  {
    id: 'p8', section: 'personality', sectionLabel: 'Core Personality',
    text: 'When someone I care about makes a decision I think is wrong, I:',
    type: 'forced_choice', dimension: 'agreeableness',
    options: [
      { label: 'Tell them clearly what I think',             value: 2 },
      { label: 'Support them while privately disagreeing',   value: 5 },
    ],
  },
  {
    id: 'p9', section: 'personality', sectionLabel: 'Core Personality',
    text: 'I find it easy to see multiple sides of a conflict, even when I\'m directly involved.',
    type: 'likert', dimension: 'agreeableness', options: likert,
  },
  {
    id: 'p10', section: 'personality', sectionLabel: 'Core Personality',
    text: 'How often do you replay conversations afterward, wondering if you said something wrong?',
    type: 'frequency', dimension: 'neuroticism', options: frequency,
  },
  {
    id: 'p11', section: 'personality', sectionLabel: 'Core Personality',
    text: 'When plans change unexpectedly, my first reaction is usually:',
    type: 'forced_choice', dimension: 'neuroticism',
    options: [
      { label: 'Frustration or anxiety',            value: 5 },
      { label: 'Curiosity — let\'s see where this goes', value: 1 },
    ],
  },
  {
    id: 'p12', section: 'personality', sectionLabel: 'Core Personality',
    text: 'I tend to worry about things I can\'t control.',
    type: 'likert', dimension: 'neuroticism', options: likert,
  },
  {
    id: 'p13', section: 'personality', sectionLabel: 'Core Personality',
    text: 'People who know me well would describe me as more:',
    type: 'forced_choice', dimension: 'general',
    options: [
      { label: 'Intense and emotionally complex', value: 1 },
      { label: 'Easy-going and consistent',       value: 5 },
    ],
  },

  // ── ATTACHMENT STYLE (ECR-R inspired) — a1–a13 ────────────────────────

  {
    id: 'a1', section: 'attachment', sectionLabel: 'Attachment Style',
    text: 'I worry that the people I\'m close to don\'t value me as much as I value them.',
    type: 'likert', dimension: 'anxiety', options: likert,
  },
  {
    id: 'a2', section: 'attachment', sectionLabel: 'Attachment Style',
    text: 'When someone important to me goes quiet for a day or two, how often do you start wondering what you did wrong?',
    type: 'frequency', dimension: 'anxiety', options: frequency,
  },
  {
    id: 'a3', section: 'attachment', sectionLabel: 'Attachment Style',
    text: 'In close relationships, I tend to:',
    type: 'forced_choice', dimension: 'anxiety',
    options: [
      { label: 'Need regular reassurance that things are okay', value: 5 },
      { label: 'Assume things are fine unless told otherwise',   value: 1 },
    ],
  },
  {
    id: 'a4', section: 'attachment', sectionLabel: 'Attachment Style',
    text: 'I feel anxious when a partner needs space or alone time.',
    type: 'likert', dimension: 'anxiety', options: likert,
  },
  {
    id: 'a5', section: 'attachment', sectionLabel: 'Attachment Style',
    text: 'When conflict arises in a relationship, my instinct is to:',
    type: 'forced_choice', dimension: 'anxiety',
    options: [
      { label: 'Address it right away — I can\'t rest until it\'s resolved', value: 5 },
      { label: 'Wait for things to cool before talking',                      value: 1 },
    ],
  },
  {
    id: 'a6', section: 'attachment', sectionLabel: 'Attachment Style',
    text: 'I\'m comfortable depending on others when I need help.',
    type: 'likert', dimension: 'avoidance_reverse', options: likert,
  },
  {
    id: 'a7', section: 'attachment', sectionLabel: 'Attachment Style',
    text: 'When I\'m going through something difficult emotionally, I:',
    type: 'forced_choice', dimension: 'avoidance',
    options: [
      { label: 'Reach out to someone close to me',    value: 1 },
      { label: 'Work through it on my own first',     value: 5 },
    ],
  },
  {
    id: 'a8', section: 'attachment', sectionLabel: 'Attachment Style',
    text: 'Getting emotionally close to someone makes me uncomfortable.',
    type: 'likert', dimension: 'avoidance', options: likert,
  },
  {
    id: 'a9', section: 'attachment', sectionLabel: 'Attachment Style',
    text: 'In my ideal relationship, there is:',
    type: 'forced_choice', dimension: 'avoidance',
    options: [
      { label: 'A high degree of togetherness and shared life', value: 1 },
      { label: 'Clear space for individual independence',        value: 5 },
    ],
  },
  {
    id: 'a10', section: 'attachment', sectionLabel: 'Attachment Style',
    text: 'How often have partners wanted more emotional closeness than you were comfortable with?',
    type: 'frequency', dimension: 'avoidance', options: frequency,
  },
  {
    id: 'a11', section: 'attachment', sectionLabel: 'Attachment Style',
    text: 'When I\'m not someone\'s first priority for a stretch of time, I:',
    type: 'forced_choice', dimension: 'anxiety',
    options: [
      { label: 'Understand — everyone has their own life',         value: 1 },
      { label: 'Feel it, and it bothers me more than I\'d like',   value: 5 },
    ],
  },
  {
    id: 'a12', section: 'attachment', sectionLabel: 'Attachment Style',
    text: 'Your partner cancels plans you were looking forward to, citing work stress. Your reaction:',
    type: 'forced_choice', dimension: 'anxiety',
    options: [
      { label: 'Disappointed but fine — I\'ll suggest rescheduling', value: 2 },
      { label: 'Hurt and wondering if something\'s wrong between us', value: 5 },
      { label: 'Quietly relieved to have unexpected free time',        value: 1 },
      { label: 'Frustrated — I want to talk about it right away',      value: 4 },
    ],
  },
  {
    id: 'a13', section: 'attachment', sectionLabel: 'Attachment Style',
    text: 'I find it easy to be emotionally present and available to someone I care about.',
    type: 'likert', dimension: 'avoidance_reverse', options: likert,
  },

  // ── VALUES (Schwartz inspired) — v1–v12 ───────────────────────────────

  {
    id: 'v1', section: 'values', sectionLabel: 'Values',
    text: 'It matters more to me to:',
    type: 'forced_choice', dimension: 'power_vs_integrity',
    options: [
      { label: 'Be respected and recognized for my achievements',  value: 2 },
      { label: 'Stay true to my values regardless of others\' opinions', value: 5 },
    ],
  },
  {
    id: 'v2', section: 'values', sectionLabel: 'Values',
    text: 'Professional success and ambition are central to how I see myself.',
    type: 'likert', dimension: 'achievement', options: likert,
  },
  {
    id: 'v3', section: 'values', sectionLabel: 'Values',
    text: 'When I have extra time or money to give, I\'m more likely to:',
    type: 'forced_choice', dimension: 'benevolence_scope',
    options: [
      { label: 'Invest in people I\'m close to',                 value: 1 },
      { label: 'Contribute to causes that help people I don\'t know', value: 5 },
    ],
  },
  {
    id: 'v4', section: 'values', sectionLabel: 'Values',
    text: 'I feel a personal responsibility to act on social injustice.',
    type: 'likert', dimension: 'universalism', options: likert,
  },
  {
    id: 'v5', section: 'values', sectionLabel: 'Values',
    text: 'How important is stability and routine in your daily life?',
    type: 'importance', dimension: 'security', options: importance,
  },
  {
    id: 'v6', section: 'values', sectionLabel: 'Values',
    text: 'I place more value on:',
    type: 'forced_choice', dimension: 'tradition_vs_change',
    options: [
      { label: 'Preserving things that have worked well over time', value: 1 },
      { label: 'Questioning traditions to find better ways',        value: 5 },
    ],
  },
  {
    id: 'v7', section: 'values', sectionLabel: 'Values',
    text: 'I need variety and novelty in my life to feel truly engaged.',
    type: 'likert', dimension: 'stimulation', options: likert,
  },
  {
    id: 'v8', section: 'values', sectionLabel: 'Values',
    text: 'Given the choice, I\'d rather:',
    type: 'forced_choice', dimension: 'depth_vs_breadth',
    options: [
      { label: 'Go very deep on one thing over many years',          value: 1 },
      { label: 'Experience many different things at a high level',   value: 5 },
    ],
  },
  {
    id: 'v9', section: 'values', sectionLabel: 'Values',
    text: 'Enjoying life\'s pleasures — good food, travel, rest — is as valid a priority as productivity.',
    type: 'likert', dimension: 'hedonism', options: likert,
  },
  {
    id: 'v10', section: 'values', sectionLabel: 'Values',
    text: 'How important is it that a long-term partner shares your political views?',
    type: 'importance', dimension: 'dealbreaker_politics', options: importance,
  },
  {
    id: 'v11', section: 'values', sectionLabel: 'Values',
    text: 'How important is it that a long-term partner agrees with you about having children?',
    type: 'importance', dimension: 'dealbreaker_children', options: importance,
  },
  {
    id: 'v12', section: 'values', sectionLabel: 'Values',
    text: 'How important is spiritual or religious compatibility in a relationship?',
    type: 'importance', dimension: 'dealbreaker_religion', options: importance,
  },

  // ── CONFLICT & COMMUNICATION (Gottman-inspired) — c1–c12 ─────────────

  {
    id: 'c1', section: 'conflict', sectionLabel: 'Conflict & Communication',
    text: 'When something bothers you in a relationship, you typically:',
    type: 'forced_choice', dimension: 'conflict_style',
    options: [
      { label: 'Raise it fairly soon — I need to address it',          value: 2 },
      { label: 'Wait for the right moment, which may never come',       value: 4 },
      { label: 'Let it go — friction costs more than it\'s worth',      value: 5 },
    ],
  },
  {
    id: 'c2', section: 'conflict', sectionLabel: 'Conflict & Communication',
    text: 'In the middle of a heated conversation, I can usually stay present and regulated.',
    type: 'likert', dimension: 'conflict_regulate', options: likert,
  },
  {
    id: 'c3', section: 'conflict', sectionLabel: 'Conflict & Communication',
    text: 'When someone points out something I did wrong, my first reaction is:',
    type: 'forced_choice', dimension: 'defensiveness',
    options: [
      { label: 'Get defensive — my instinct is to explain myself', value: 5 },
      { label: 'Take it in, even if it stings',                    value: 2 },
      { label: 'Apologize immediately to end the discomfort',      value: 3 },
    ],
  },
  {
    id: 'c4', section: 'conflict', sectionLabel: 'Conflict & Communication',
    text: 'In conflicts I\'ve had, I can honestly say my behavior contributed to the problem.',
    type: 'likert', dimension: 'accountability', options: likert,
  },
  {
    id: 'c5', section: 'conflict', sectionLabel: 'Conflict & Communication',
    text: 'After a serious fight, how long does it typically take before you feel emotionally recovered?',
    type: 'forced_choice', dimension: 'recovery_time',
    options: [
      { label: 'Under an hour — I move on quickly', value: 1 },
      { label: 'A few hours to a day',              value: 3 },
      { label: 'Several days — it sits with me',    value: 5 },
    ],
  },
  {
    id: 'c6', section: 'conflict', sectionLabel: 'Conflict & Communication',
    text: 'When someone close to me makes a small bid for connection — a joke, a touch, a comment — I tend to:',
    type: 'forced_choice', dimension: 'bid_response',
    options: [
      { label: 'Notice and respond — it pulls my attention naturally', value: 2 },
      { label: 'Miss it or not feel particularly pulled to engage',    value: 5 },
    ],
  },
  {
    id: 'c7', section: 'conflict', sectionLabel: 'Conflict & Communication',
    text: 'I\'ve used sarcasm, mockery, or contempt when arguing with someone close to me.',
    type: 'frequency', dimension: 'contempt', options: frequency,
  },
  {
    id: 'c8', section: 'conflict', sectionLabel: 'Conflict & Communication',
    text: 'During conflict, I often feel responsible for managing the other person\'s emotional state.',
    type: 'likert', dimension: 'emotional_caretaking', options: likert,
  },
  {
    id: 'c9', section: 'conflict', sectionLabel: 'Conflict & Communication',
    text: 'In the middle of a conflict, I can clearly articulate what I need.',
    type: 'likert', dimension: 'conflict_expression', options: likert,
  },
  {
    id: 'c10', section: 'conflict', sectionLabel: 'Conflict & Communication',
    text: 'I apologize to end a conflict, even when I\'m not sure the apology is fully warranted.',
    type: 'frequency', dimension: 'appeasement', options: frequency,
  },
  {
    id: 'c11', section: 'conflict', sectionLabel: 'Conflict & Communication',
    text: 'When an important topic has gone unaddressed in a relationship, I:',
    type: 'forced_choice', dimension: 'conflict_initiation',
    options: [
      { label: 'Bring it up — I\'d rather have the hard conversation than let it fester', value: 2 },
      { label: 'Wait and hope it resolves on its own',                                     value: 5 },
    ],
  },
  {
    id: 'c12', section: 'conflict', sectionLabel: 'Conflict & Communication',
    text: 'When I\'ve hurt someone I care about, I typically:',
    type: 'forced_choice', dimension: 'repair',
    options: [
      { label: 'Reach out to repair it as soon as I\'ve calmed down', value: 2 },
      { label: 'Wait for them to come to me',                          value: 4 },
      { label: 'Avoid addressing it directly and hope things normalize', value: 5 },
    ],
  },

  // ── EMOTIONAL INTELLIGENCE — e1–e12 ───────────────────────────────────

  {
    id: 'e1', section: 'eq', sectionLabel: 'Emotional Intelligence',
    text: 'In the middle of a difficult emotion, I can usually name exactly what I\'m feeling.',
    type: 'likert', dimension: 'self_awareness', options: likert,
  },
  {
    id: 'e2', section: 'eq', sectionLabel: 'Emotional Intelligence',
    text: 'When I\'m overwhelmed, I tend to:',
    type: 'forced_choice', dimension: 'regulation_style',
    options: [
      { label: 'Sit with it and process before moving on',      value: 2 },
      { label: 'Push through and keep functioning',             value: 4 },
      { label: 'Distract myself until the feeling passes',      value: 5 },
    ],
  },
  {
    id: 'e3', section: 'eq', sectionLabel: 'Emotional Intelligence',
    text: 'I can sense when someone close to me is struggling, even before they\'ve said anything.',
    type: 'likert', dimension: 'empathy_social', options: likert,
  },
  {
    id: 'e4', section: 'eq', sectionLabel: 'Emotional Intelligence',
    text: 'Other people\'s strong emotions — grief, anger, anxiety — directly affect how I feel.',
    type: 'likert', dimension: 'empathy_affective', options: likert,
  },
  {
    id: 'e5', section: 'eq', sectionLabel: 'Emotional Intelligence',
    text: 'When I feel something intense, my first move is to:',
    type: 'forced_choice', dimension: 'regulation_approach',
    options: [
      { label: 'Understand it — what is this and where is it coming from?', value: 2 },
      { label: 'Express it — get it out, then process',                      value: 3 },
      { label: 'Control it — keep it inside until I\'m ready to deal with it', value: 5 },
    ],
  },
  {
    id: 'e6', section: 'eq', sectionLabel: 'Emotional Intelligence',
    text: 'How often do your emotional reactions surprise you — stronger or different than expected?',
    type: 'frequency', dimension: 'emotional_insight', options: frequency,
  },
  {
    id: 'e7', section: 'eq', sectionLabel: 'Emotional Intelligence',
    text: 'I struggle to stay calm when the people around me are very anxious or emotionally reactive.',
    type: 'likert', dimension: 'emotional_contagion', options: likert,
  },
  {
    id: 'e8', section: 'eq', sectionLabel: 'Emotional Intelligence',
    text: 'How often do you give someone honest feedback they need to hear, even when it\'s uncomfortable?',
    type: 'frequency', dimension: 'courageous_feedback', options: frequency,
  },
  {
    id: 'e9', section: 'eq', sectionLabel: 'Emotional Intelligence',
    text: 'I know my emotional triggers well enough to anticipate them before they hit.',
    type: 'likert', dimension: 'self_awareness_predictive', options: likert,
  },
  {
    id: 'e10', section: 'eq', sectionLabel: 'Emotional Intelligence',
    text: 'When someone shares something emotionally painful with me, I:',
    type: 'forced_choice', dimension: 'empathy_response',
    options: [
      { label: 'Feel fully present and absorbed in what they\'re going through', value: 2 },
      { label: 'Listen, but stay somewhat detached — I don\'t want to be pulled in', value: 4 },
      { label: 'Feel pulled to fix it or offer solutions rather than just be there', value: 3 },
    ],
  },
  {
    id: 'e11', section: 'eq', sectionLabel: 'Emotional Intelligence',
    text: 'Expressing vulnerability — naming something that scares or hurts me — feels:',
    type: 'forced_choice', dimension: 'expression_safety',
    options: [
      { label: 'Natural, even necessary — it\'s how I connect',              value: 2 },
      { label: 'Risky — I prefer to handle difficult things internally',     value: 5 },
      { label: 'Situational — depends completely on the person',             value: 3 },
    ],
  },
  {
    id: 'e12', section: 'eq', sectionLabel: 'Emotional Intelligence',
    text: 'I can tell the difference between what I\'m feeling and what I\'m thinking, and know which is driving me.',
    type: 'likert', dimension: 'emotional_cognitive_integration', options: likert,
  },

  // ── LIFE ARCHITECTURE — l1–l12 ────────────────────────────────────────

  {
    id: 'l1', section: 'life', sectionLabel: 'Life Architecture',
    text: 'When I think about my life 10 years from now, I:',
    type: 'forced_choice', dimension: 'future_orientation',
    options: [
      { label: 'Have a clear picture I\'m actively working toward',     value: 5 },
      { label: 'Know how I want to feel, but not the specific shape',   value: 3 },
      { label: 'Try not to plan too far ahead — life unfolds',          value: 1 },
    ],
  },
  {
    id: 'l2', section: 'life', sectionLabel: 'Life Architecture',
    text: 'My work or main pursuit is:',
    type: 'forced_choice', dimension: 'work_identity',
    options: [
      { label: 'Central to who I am — a core part of my identity',         value: 5 },
      { label: 'Something I do well, but not how I define myself',          value: 3 },
      { label: 'A means to fund the life I actually want to live',          value: 1 },
    ],
  },
  {
    id: 'l3', section: 'life', sectionLabel: 'Life Architecture',
    text: 'How important is it that your living space is ordered, intentional, and reflects who you are?',
    type: 'importance', dimension: 'environment_intentionality', options: importance,
  },
  {
    id: 'l4', section: 'life', sectionLabel: 'Life Architecture',
    text: 'I track progress toward my goals with:',
    type: 'forced_choice', dimension: 'planning_system',
    options: [
      { label: 'A deliberate system — timelines, metrics, review',           value: 5 },
      { label: 'Loose awareness — I know roughly where I stand',             value: 3 },
      { label: 'Nothing formal — tracking makes goals feel mechanical',      value: 1 },
    ],
  },
  {
    id: 'l5', section: 'life', sectionLabel: 'Life Architecture',
    text: 'Financial security shapes my major life decisions more than most other factors.',
    type: 'likert', dimension: 'security_drive', options: likert,
  },
  {
    id: 'l6', section: 'life', sectionLabel: 'Life Architecture',
    text: 'How often do you deliberately protect time for things that matter outside of work?',
    type: 'frequency', dimension: 'balance_protection', options: frequency,
  },
  {
    id: 'l7', section: 'life', sectionLabel: 'Life Architecture',
    text: 'I work and live best in:',
    type: 'forced_choice', dimension: 'structure_preference',
    options: [
      { label: 'A consistent routine I can optimize over time',              value: 5 },
      { label: 'A flexible, shifting schedule',                              value: 1 },
      { label: 'Structure where it matters, openness everywhere else',       value: 3 },
    ],
  },
  {
    id: 'l8', section: 'life', sectionLabel: 'Life Architecture',
    text: 'What I want in how a long-term partner relates to their work or ambitions:',
    type: 'forced_choice', dimension: 'partner_ambition',
    options: [
      { label: 'Comparable drive to mine — I want a peer',                  value: 1 },
      { label: 'Less career-focused — I want them available',               value: 3 },
      { label: 'Doesn\'t matter, as long as they\'re fulfilled',            value: 2 },
    ],
  },
  {
    id: 'l9', section: 'life', sectionLabel: 'Life Architecture',
    text: 'How much of your current life reflects deliberate choices versus circumstances you fell into?',
    type: 'forced_choice', dimension: 'agency',
    options: [
      { label: 'Mostly deliberate — I\'ve made conscious choices',          value: 5 },
      { label: 'Roughly half — some by design, some by default',            value: 3 },
      { label: 'Mostly drift — I\'m working on changing this',              value: 1 },
    ],
  },
  {
    id: 'l10', section: 'life', sectionLabel: 'Life Architecture',
    text: 'How important is geographic location — the specific city or type of place — to your long-term plan?',
    type: 'importance', dimension: 'location_importance', options: importance,
  },
  {
    id: 'l11', section: 'life', sectionLabel: 'Life Architecture',
    text: 'Rest and recovery are:',
    type: 'forced_choice', dimension: 'recovery_relationship',
    options: [
      { label: 'Things I protect deliberately — they make me better',       value: 5 },
      { label: 'Something I struggle to justify until I burn out',           value: 2 },
      { label: 'Natural — I don\'t have to work to let myself rest',        value: 3 },
    ],
  },
  {
    id: 'l12', section: 'life', sectionLabel: 'Life Architecture',
    text: 'In five years, I want my life to look:',
    type: 'forced_choice', dimension: 'change_vs_continuity',
    options: [
      { label: 'Similar to now, but better — evolution, not revolution',    value: 3 },
      { label: 'Fundamentally different — I\'m not where I want to be',     value: 1 },
      { label: 'Honestly, I don\'t know yet — I\'m still working that out', value: 2 },
    ],
  },

  // ── PHYSICAL & HEALTH — h1–h10 ────────────────────────────────────────

  {
    id: 'h1', section: 'physical', sectionLabel: 'Physical & Health',
    text: 'Physical activity in my life is:',
    type: 'forced_choice', dimension: 'movement_pattern',
    options: [
      { label: 'A regular priority — I\'d feel off without it',             value: 5 },
      { label: 'Inconsistent — I want it to be a priority but it isn\'t',  value: 3 },
      { label: 'Something I largely don\'t prioritize',                     value: 1 },
    ],
  },
  {
    id: 'h2', section: 'physical', sectionLabel: 'Physical & Health',
    text: 'I pay deliberate attention to what I eat and why.',
    type: 'likert', dimension: 'diet_intentionality', options: likert,
  },
  {
    id: 'h3', section: 'physical', sectionLabel: 'Physical & Health',
    text: 'How would you describe your relationship with your body overall?',
    type: 'forced_choice', dimension: 'body_relationship',
    options: [
      { label: 'Generally positive — I feel at home in it',                value: 5 },
      { label: 'Complicated — there are parts I struggle to accept',       value: 2 },
      { label: 'Largely neutral — I don\'t think about it much',           value: 3 },
    ],
  },
  {
    id: 'h4', section: 'physical', sectionLabel: 'Physical & Health',
    text: 'How often do you wake up feeling genuinely rested?',
    type: 'frequency', dimension: 'sleep_quality', options: frequency,
  },
  {
    id: 'h5', section: 'physical', sectionLabel: 'Physical & Health',
    text: 'Physical closeness and touch in a relationship are:',
    type: 'importance', dimension: 'physical_intimacy', options: importance,
  },
  {
    id: 'h6', section: 'physical', sectionLabel: 'Physical & Health',
    text: 'I manage stress primarily through physical means — movement, exercise, breathing, being outside.',
    type: 'likert', dimension: 'somatic_regulation', options: likert,
  },
  {
    id: 'h7', section: 'physical', sectionLabel: 'Physical & Health',
    text: 'How important is it that a long-term partner shares similar habits around health and physical activity?',
    type: 'importance', dimension: 'health_compatibility', options: importance,
  },
  {
    id: 'h8', section: 'physical', sectionLabel: 'Physical & Health',
    text: 'How often do you notice and respond to what your body is telling you — hunger, fatigue, tension, discomfort?',
    type: 'frequency', dimension: 'body_awareness', options: frequency,
  },
  {
    id: 'h9', section: 'physical', sectionLabel: 'Physical & Health',
    text: 'I feel my emotions as physical sensations before I can put them into words.',
    type: 'likert', dimension: 'somatic_emotion', options: likert,
  },
  {
    id: 'h10', section: 'physical', sectionLabel: 'Physical & Health',
    text: 'My energy levels throughout the day are typically:',
    type: 'forced_choice', dimension: 'energy_pattern',
    options: [
      { label: 'Fairly consistent — I can rely on them',     value: 3 },
      { label: 'High in the morning, lower as the day goes', value: 4 },
      { label: 'Low until something activates or engages me', value: 1 },
      { label: 'Unpredictable — I can\'t count on them',     value: 2 },
    ],
  },

  // ── MORAL FOUNDATIONS (Haidt-inspired) — m1–m12 ──────────────────────

  {
    id: 'm1', section: 'moral', sectionLabel: 'Moral Foundations',
    text: 'When I see someone treated unfairly, even a stranger, I feel pulled to do something.',
    type: 'likert', dimension: 'care_harm', options: likert,
  },
  {
    id: 'm2', section: 'moral', sectionLabel: 'Moral Foundations',
    text: 'Loyalty to the people closest to you should take priority over abstract principles.',
    type: 'likert', dimension: 'loyalty', options: likert,
  },
  {
    id: 'm3', section: 'moral', sectionLabel: 'Moral Foundations',
    text: 'Respecting authority and hierarchy makes sense, even when you disagree with specific decisions.',
    type: 'likert', dimension: 'authority', options: likert,
  },
  {
    id: 'm4', section: 'moral', sectionLabel: 'Moral Foundations',
    text: 'Some behaviors are simply wrong, regardless of whether anyone is directly harmed.',
    type: 'likert', dimension: 'sanctity', options: likert,
  },
  {
    id: 'm5', section: 'moral', sectionLabel: 'Moral Foundations',
    text: 'A system that produces unequal outcomes is unjust, even if everyone followed the same rules.',
    type: 'likert', dimension: 'fairness_equity', options: likert,
  },
  {
    id: 'm6', section: 'moral', sectionLabel: 'Moral Foundations',
    text: 'If a close friend acted in a way I considered morally wrong, I would say something.',
    type: 'likert', dimension: 'moral_courage', options: likert,
  },
  {
    id: 'm7', section: 'moral', sectionLabel: 'Moral Foundations',
    text: 'Individual freedom should rarely be restricted, even to protect people from their own choices.',
    type: 'likert', dimension: 'liberty', options: likert,
  },
  {
    id: 'm8', section: 'moral', sectionLabel: 'Moral Foundations',
    text: 'When a group I belong to does something I disagree with, I:',
    type: 'forced_choice', dimension: 'loyalty_vs_principle',
    options: [
      { label: 'Speak against it openly, even at personal cost',     value: 1 },
      { label: 'Raise it privately but stay in the group',            value: 3 },
      { label: 'Accept the group\'s position — cohesion matters more', value: 5 },
    ],
  },
  {
    id: 'm9', section: 'moral', sectionLabel: 'Moral Foundations',
    text: 'Traditions and established customs exist for good reasons — they should be preserved unless there\'s a strong case against them.',
    type: 'likert', dimension: 'tradition', options: likert,
  },
  {
    id: 'm10', section: 'moral', sectionLabel: 'Moral Foundations',
    text: 'The most important moral duty is:',
    type: 'forced_choice', dimension: 'moral_priority',
    options: [
      { label: 'Not to harm others',                              value: 1 },
      { label: 'To treat everyone fairly and equally',            value: 2 },
      { label: 'To protect and be loyal to those who depend on you', value: 3 },
      { label: 'To preserve what is sacred or meaningful in human life', value: 4 },
    ],
  },
  {
    id: 'm11', section: 'moral', sectionLabel: 'Moral Foundations',
    text: 'I judge betrayal more harshly than most other moral failures.',
    type: 'likert', dimension: 'betrayal_sensitivity', options: likert,
  },
  {
    id: 'm12', section: 'moral', sectionLabel: 'Moral Foundations',
    text: 'Human dignity is non-negotiable — even those who have done terrible things retain some inherent worth.',
    type: 'likert', dimension: 'universalism_dignity', options: likert,
  },
]
