export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type Profile = {
  id: string
  username: string | null
  display_name: string | null
  confidence_score: number
  is_discoverable: boolean
  created_at: string
  updated_at: string
}

export type Section =
  | 'core_personality'
  | 'attachment'
  | 'conflict_communication'
  | 'values_ethics'
  | 'emotional_intelligence'
  | 'life_architecture'
  | 'physical_health'
  | 'moral_foundations'

export type QuestionFormat =
  | 'likert'
  | 'forced_choice'
  | 'frequency'
  | 'vignette'
  | 'slider'
