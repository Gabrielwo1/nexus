import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const member_id = searchParams.get('member_id')
  const status = searchParams.get('status')
  const project_id = searchParams.get('project_id')

  let query = supabase
    .from('tasks')
    .select('*, team_members(name, role), clients(name), projects(name)')
    .order('start_date', { ascending: true })

  if (member_id) query = query.eq('assigned_to', member_id)
  if (status && status !== 'todos') query = query.eq('status', status)
  if (project_id) query = query.eq('project_id', project_id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, error } = await supabase
    .from('tasks')
    .insert(body)
    .select('*, team_members(name, role), clients(name)')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
