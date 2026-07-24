import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Criação de usuários no servidor.
 * Usa a service_role key (nunca exposta ao navegador) para:
 *  - criar o login já confirmado
 *  - NÃO trocar a sessão de quem está criando (o signUp no cliente fazia isso)
 */
function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  const { name, email, senha, role, phone, modules } = await req.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Informe o nome' }, { status: 400 })
  }
  if (email && senha && senha.length < 6) {
    return NextResponse.json({ error: 'A senha precisa ter ao menos 6 caracteres' }, { status: 400 })
  }

  const sb = admin()
  let authUserId: string | null = null

  // Cria o login quando e-mail + senha vierem preenchidos
  if (email && senha) {
    const { data, error } = await sb.auth.admin.createUser({
      email: email.trim(),
      password: senha,
      email_confirm: true, // já entra sem precisar confirmar e-mail
    })
    if (error) {
      const msg = error.message.includes('already been registered')
        ? 'Já existe um usuário com esse e-mail'
        : error.message
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    authUserId = data.user?.id ?? null
  }

  const { data, error } = await sb.from('team_members').insert({
    name: name.trim(),
    role,
    email: email || null,
    phone: phone || null,
    modules: modules ?? null,
    auth_user_id: authUserId,
    status: 'active',
  }).select().single()

  if (error) {
    // desfaz o login criado para não deixar órfão
    if (authUserId) await sb.auth.admin.deleteUser(authUserId)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ usuario: data, comLogin: !!authUserId }, { status: 201 })
}

/** Redefinir a senha de um usuário existente */
export async function PATCH(req: NextRequest) {
  const { auth_user_id, senha } = await req.json()
  if (!auth_user_id || !senha || senha.length < 6) {
    return NextResponse.json({ error: 'Informe uma senha com ao menos 6 caracteres' }, { status: 400 })
  }
  const { error } = await admin().auth.admin.updateUserById(auth_user_id, { password: senha })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
