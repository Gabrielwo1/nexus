import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  const [clients, midias, invoices, expenses] = await Promise.all([
    supabase.from('clients').select('id, status, monthly_fee'),
    supabase.from('midias').select('id, status, created_at'),
    supabase.from('invoices').select('id, amount, status, type'),
    supabase.from('expenses').select('id, amount, date'),
  ])

  const activeClients = (clients.data || []).filter(c => c.status === 'active')
  const mrr = activeClients.reduce((a, c) => a + Number(c.monthly_fee), 0)
  const pendingMidias = (midias.data || []).filter(m => m.status === 'pendente').length
  const paidRevenue = (invoices.data || []).filter(i => i.status === 'paid' && i.type === 'invoice').reduce((a, i) => a + Number(i.amount), 0)
  const overdueInvoices = (invoices.data || []).filter(i => i.status === 'overdue').length
  const totalExpenses = (expenses.data || []).reduce((a, e) => a + Number(e.amount), 0)

  return NextResponse.json({
    active_clients: activeClients.length,
    total_clients: (clients.data || []).length,
    mrr,
    pending_midias: pendingMidias,
    paid_revenue: paidRevenue,
    overdue_invoices: overdueInvoices,
    total_expenses: totalExpenses,
    profit: paidRevenue - totalExpenses,
  })
}
