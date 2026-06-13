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

  let query = supabase
    .from('contracts')
    .select('*, team_members(name, role)')
    .order('created_at', { ascending: false })

  if (member_id) query = query.eq('team_member_id', member_id)
  if (status && status !== 'todos') query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, error } = await supabase
    .from('contracts')
    .insert(body)
    .select('*, team_members(name, role)')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
