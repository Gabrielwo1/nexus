import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos
export type Client = {
  id: string
  name: string
  type: 'doctor' | 'clinic' | 'brand'
  specialty: string | null
  status: 'active' | 'paused' | 'churned'
  monthly_fee: number
  contract_start: string | null
  instagram_handle: string | null
  telegram_chat_id: string | null
  google_ads_account_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type TeamMember = {
  id: string
  name: string
  role: string
  telegram_chat_id: string | null
  bot_workflow_id: string | null
  status: string
  created_at: string
}

export type Midia = {
  id: string
  client_id: string | null
  team_member_id: string | null
  file_name: string
  file_url: string
  type: string
  status: 'pendente' | 'aprovado' | 'rejeitado'
  duration_sec: number | null
  notes: string | null
  rejection_reason: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string
  clients?: { name: string }
  team_members?: { name: string }
}

export type Invoice = {
  id: string
  client_id: string
  type: string
  amount: number
  status: 'pending' | 'sent' | 'paid' | 'overdue'
  due_date: string | null
  paid_at: string | null
  description: string | null
  created_at: string
  clients?: { name: string }
}

export type Expense = {
  id: string
  description: string
  category: string
  amount: number
  date: string
  recurring: boolean
  notes: string | null
  created_at: string
}

export type InstagramMetric = {
  id: string
  client_id: string
  week_label: string
  week_start: string
  followers_total: number
  followers_new: number
  reach: number
  impressions: number
  likes: number
  comments: number
  saves: number
  shares: number
  profile_visits: number
  created_at: string
  clients?: { name: string }
}

export type StageStatus = 'pendente' | 'em_andamento' | 'entregue' | 'aprovado' | 'ajustes'

export type CalendarPost = {
  id: string
  client_id: string | null
  title: string
  copy: string | null
  caption: string | null
  type: string
  status: string
  scheduled_at: string | null
  scheduled_date: string | null
  published_at: string | null
  assigned_to: string | null
  current_stage: string | null
  // Etapa 1: Roteiro (Gerval)
  roteiro_status: StageStatus
  roteiro_text: string | null
  roteiro_url: string | null
  roteiro_by: string | null
  roteiro_done_at: string | null
  roteiro_approved_at: string | null
  // Etapa 2: Gravação (Guto)
  gravacao_status: StageStatus
  gravacao_url: string | null
  gravacao_by: string | null
  gravacao_done_at: string | null
  gravacao_approved_at: string | null
  // Etapa 3: Edição (Petterson)
  edicao_status: StageStatus
  edicao_url: string | null
  edicao_by: string | null
  edicao_done_at: string | null
  edicao_approved_at: string | null
  // Etapa 4: Publicação (Karina)
  publicacao_status: StageStatus
  post_link: string | null
  publicacao_by: string | null
  publicacao_approved_at: string | null
  created_at: string
  clients?: { name: string }
  team_members?: { name: string }
}

export type BrandingAsset = {
  id: string
  client_id: string
  type: string
  name: string
  file_url: string | null
  hex_color: string | null
  notes: string | null
  created_at: string
}
