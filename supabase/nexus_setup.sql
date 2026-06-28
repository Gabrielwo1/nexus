-- ============================================================
-- NEXUS ERP — Setup completo (estrutura + dados)
-- Rode este script no SQL Editor de um projeto Supabase NOVO.
-- Recria todas as tabelas, RLS e re-popula equipe, Instituto Mussi,
-- salários e os 35 posts de exemplo do calendário.
-- ============================================================

-- ---------- TABELAS ----------
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  type text default 'doctor',
  name text not null,
  specialty text,
  contract_start date,
  instagram_handle text,
  telegram_chat_id text,
  google_ads_account_id text,
  notes text,
  status text default 'active',
  monthly_fee numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  telegram_chat_id text unique,
  bot_workflow_id text,
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client_id uuid references clients(id),
  created_at timestamptz default now()
);

create table if not exists midias (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  team_member_id uuid references team_members(id),
  approved_by uuid references team_members(id),
  file_name text not null,
  file_url text not null,
  type text default 'reel',
  status text default 'pendente',
  duration_sec int,
  notes text,
  rejection_reason text,
  approved_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  amount numeric not null,
  type text default 'invoice',
  status text default 'pending',
  due_date date,
  paid_at timestamptz,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  amount numeric not null,
  category text default 'outros',
  date date default current_date,
  recurring boolean default false,
  notes text,
  created_at timestamptz default now()
);

create table if not exists instagram_metrics (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  week_label text not null,
  week_start date not null,
  followers_total int default 0,
  followers_new int default 0,
  reach int default 0,
  impressions int default 0,
  likes int default 0,
  comments int default 0,
  saves int default 0,
  shares int default 0,
  profile_visits int default 0,
  created_at timestamptz default now()
);

create table if not exists branding_assets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  name text not null,
  type text default 'logo',
  file_url text,
  hex_color text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists calendar_posts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  title text not null,
  copy text,
  caption text,
  type text default 'reel',
  status text default 'rascunho',
  scheduled_at timestamptz,
  scheduled_date date,
  published_at timestamptz,
  assigned_to uuid references team_members(id),
  current_stage text default 'roteiro',
  -- Etapa 1: Roteiro
  roteiro_status text default 'pendente',
  roteiro_text text,
  roteiro_url text,
  roteiro_by uuid references team_members(id),
  roteiro_done_at timestamptz,
  roteiro_approved_at timestamptz,
  -- Etapa 2: Gravação
  gravacao_status text default 'pendente',
  gravacao_url text,
  gravacao_by uuid references team_members(id),
  gravacao_done_at timestamptz,
  gravacao_approved_at timestamptz,
  -- Etapa 3: Edição
  edicao_status text default 'pendente',
  edicao_url text,
  edicao_by uuid references team_members(id),
  edicao_done_at timestamptz,
  edicao_approved_at timestamptz,
  -- Etapa 4: Publicação
  publicacao_status text default 'pendente',
  post_link text,
  publicacao_by uuid references team_members(id),
  publicacao_approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  team_member_id uuid references team_members(id),
  title text not null,
  type text default 'pj',
  status text default 'vigente',
  start_date date not null,
  end_date date,
  value numeric,
  recurrence text default 'mensal',
  file_url text,
  file_name text,
  notes text,
  signed_at date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists notas_fiscais (
  id uuid primary key default gen_random_uuid(),
  team_member_id uuid references team_members(id),
  client_id uuid references clients(id),
  contract_id uuid references contracts(id),
  number text,
  competencia text not null,
  value numeric not null,
  status text default 'pendente',
  file_url text,
  file_name text,
  due_date date,
  paid_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id),
  client_id uuid references clients(id),
  assigned_to uuid references team_members(id),
  title text not null,
  type text,
  status text default 'pending',
  priority text default 'normal',
  due_date date,
  start_date date,
  end_date date,
  estimated_hours int,
  actual_hours int,
  depends_on uuid,
  color text default '#6366f1',
  description text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------- RLS (permissivo: app usa a anon key) ----------
do $$
declare t text;
begin
  foreach t in array array[
    'clients','team_members','projects','midias','invoices','expenses',
    'instagram_metrics','branding_assets','calendar_posts','contracts',
    'notas_fiscais','tasks'
  ] loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists auth_all on %I;', t);
    execute format(
      'create policy auth_all on %I for all to anon, authenticated using (true) with check (true);', t
    );
  end loop;
end $$;

-- ---------- SEED: equipe ----------
insert into team_members (name, role, status) values
 ('Augusto','stories','active'),
 ('Fernando','branding','active'),
 ('Gerval','copywriter','active'),
 ('Guto','videomaker','active'),
 ('Karina','social_media','active'),
 ('Petterson','social_media','active');

-- ---------- SEED: cliente ----------
insert into clients (name, type, specialty, status, monthly_fee, instagram_handle)
values ('Instituto Mussi','clinic','Saúde / Estética','active',0,'@institutomussi');

-- ---------- SEED: salários (pagos 22/06/2026) ----------
insert into expenses (description, category, amount, date, recurring, notes) values
 ('Salário - Fernando','salario',3000,'2026-06-22',true,'Equipe'),
 ('Salário - Gerval','salario',1890,'2026-06-22',true,'Equipe'),
 ('Salário - Guto','salario',2000,'2026-06-22',true,'Equipe'),
 ('Salário - Dino','salario',2300,'2026-06-22',true,'Equipe'),
 ('Salário - Karyne','salario',2500,'2026-06-22',true,'Equipe'),
 ('Salário - Eliab','salario',2300,'2026-06-22',true,'Equipe'),
 ('Salário - Pet','salario',2200,'2026-06-22',true,'Equipe');

-- ============================================================
-- SEED: posts de exemplo do calendário (Instituto Mussi)
-- ============================================================

-- G1: Roteiro pendente
with x as (select (select id from clients where name='Instituto Mussi') c,
  (select id from team_members where name='Gerval') g,(select id from team_members where name='Guto') gu,
  (select id from team_members where name='Petterson') p,(select id from team_members where name='Karina') k)
insert into calendar_posts (client_id,title,type,scheduled_date,caption,status,current_stage,roteiro_status,roteiro_by,gravacao_by,edicao_by,publicacao_by)
select x.c,v.t,v.tp,v.d::date,'[exemplo] '||v.cap,'producao','roteiro','pendente',x.g,x.gu,x.p,x.k
from x,(values
 ('Reel - 3 sinais de bruxismo','reel','2026-06-20','tema clínico educativo'),
 ('Story - bastidores da clínica','story','2026-06-21','rotina equipe'),
 ('Carrossel - antes e depois','carrossel','2026-06-22','case de sucesso'),
 ('Reel - mito sobre clareamento','reel','2026-06-24','desmistificar')
) v(t,tp,d,cap);

-- G2: Roteiro em andamento
with x as (select (select id from clients where name='Instituto Mussi') c,
  (select id from team_members where name='Gerval') g,(select id from team_members where name='Guto') gu,
  (select id from team_members where name='Petterson') p,(select id from team_members where name='Karina') k)
insert into calendar_posts (client_id,title,type,scheduled_date,caption,status,current_stage,roteiro_status,roteiro_by,gravacao_by,edicao_by,publicacao_by)
select x.c,v.t,v.tp,v.d::date,'[exemplo] '||v.cap,'producao','roteiro','em_andamento',x.g,x.gu,x.p,x.k
from x,(values
 ('Reel - alimentação e saúde bucal','reel','2026-06-18','dicas práticas'),
 ('Story - enquete cuidados','story','2026-06-19','engajamento'),
 ('Foto - equipe nova','foto','2026-06-23','institucional')
) v(t,tp,d,cap);

-- G3: Roteiro entregue (aguardando aprovação)
with x as (select (select id from clients where name='Instituto Mussi') c,
  (select id from team_members where name='Gerval') g,(select id from team_members where name='Guto') gu,
  (select id from team_members where name='Petterson') p,(select id from team_members where name='Karina') k)
insert into calendar_posts (client_id,title,type,scheduled_date,caption,status,current_stage,roteiro_status,roteiro_text,roteiro_done_at,roteiro_by,gravacao_by,edicao_by,publicacao_by)
select x.c,v.t,v.tp,v.d::date,'[exemplo] '||v.cap,'producao','roteiro','entregue',
 'Gancho: '||v.t||E'\nDesenvolvimento: 3 pontos.\nCTA: agende sua avaliação.',now()-interval '6 hours',x.g,x.gu,x.p,x.k
from x,(values
 ('Reel - como escolher o ortodontista','reel','2026-06-17','autoridade'),
 ('Story - depoimento paciente','story','2026-06-17','prova social'),
 ('Carrossel - 5 dúvidas frequentes','carrossel','2026-06-18','educativo')
) v(t,tp,d,cap);

-- G4: Roteiro em ajustes
with x as (select (select id from clients where name='Instituto Mussi') c,
  (select id from team_members where name='Gerval') g,(select id from team_members where name='Guto') gu,
  (select id from team_members where name='Petterson') p,(select id from team_members where name='Karina') k)
insert into calendar_posts (client_id,title,type,scheduled_date,caption,status,current_stage,roteiro_status,roteiro_text,roteiro_by,gravacao_by,edicao_by,publicacao_by)
select x.c,v.t,v.tp,v.d::date,'[exemplo] '||v.cap,'producao','roteiro','ajustes',
 'Versão 1 do roteiro (revisar gancho).',x.g,x.gu,x.p,x.k
from x,(values
 ('Reel - implante x prótese','reel','2026-06-25','comparativo'),
 ('Story - promoção junho','story','2026-06-19','oferta')
) v(t,tp,d,cap);

-- G5: Gravação pendente (fila Guto)
with x as (select (select id from clients where name='Instituto Mussi') c,
  (select id from team_members where name='Gerval') g,(select id from team_members where name='Guto') gu,
  (select id from team_members where name='Petterson') p,(select id from team_members where name='Karina') k)
insert into calendar_posts (client_id,title,type,scheduled_date,caption,status,current_stage,roteiro_status,roteiro_text,roteiro_done_at,roteiro_approved_at,gravacao_status,roteiro_by,gravacao_by,edicao_by,publicacao_by)
select x.c,v.t,v.tp,v.d::date,'[exemplo] '||v.cap,'producao','gravacao','aprovado','Roteiro aprovado de '||v.t,now()-interval '2 days',now()-interval '1 day','pendente',x.g,x.gu,x.p,x.k
from x,(values
 ('Reel - tour pela clínica','reel','2026-06-16','institucional'),
 ('Story - dica rápida do dia','story','2026-06-16','engajamento'),
 ('Reel - tecnologia em odontologia','reel','2026-06-26','autoridade'),
 ('Story - perguntas e respostas','story','2026-06-20','interação')
) v(t,tp,d,cap);

-- G6: Gravação em andamento
with x as (select (select id from clients where name='Instituto Mussi') c,
  (select id from team_members where name='Gerval') g,(select id from team_members where name='Guto') gu,
  (select id from team_members where name='Petterson') p,(select id from team_members where name='Karina') k)
insert into calendar_posts (client_id,title,type,scheduled_date,caption,status,current_stage,roteiro_status,roteiro_done_at,roteiro_approved_at,gravacao_status,roteiro_by,gravacao_by,edicao_by,publicacao_by)
select x.c,v.t,v.tp,v.d::date,'[exemplo] '||v.cap,'producao','gravacao','aprovado',now()-interval '3 days',now()-interval '2 days','em_andamento',x.g,x.gu,x.p,x.k
from x,(values
 ('Reel - sorriso planejado','reel','2026-06-17','case'),
 ('Story - making of gravação','story','2026-06-18','bastidor')
) v(t,tp,d,cap);

-- G7: Gravação entregue
with x as (select (select id from clients where name='Instituto Mussi') c,
  (select id from team_members where name='Gerval') g,(select id from team_members where name='Guto') gu,
  (select id from team_members where name='Petterson') p,(select id from team_members where name='Karina') k)
insert into calendar_posts (client_id,title,type,scheduled_date,caption,status,current_stage,roteiro_status,roteiro_done_at,roteiro_approved_at,gravacao_status,gravacao_url,gravacao_done_at,roteiro_by,gravacao_by,edicao_by,publicacao_by)
select x.c,v.t,v.tp,v.d::date,'[exemplo] '||v.cap,'producao','gravacao','aprovado',now()-interval '4 days',now()-interval '3 days','entregue','https://drive.google.com/exemplo-bruto.mp4',now()-interval '5 hours',x.g,x.gu,x.p,x.k
from x,(values
 ('Reel - cuidados pós-procedimento','reel','2026-06-17','educativo'),
 ('Story - agenda da semana','story','2026-06-16','informativo')
) v(t,tp,d,cap);

-- G8: Edição pendente (fila Petterson)
with x as (select (select id from clients where name='Instituto Mussi') c,
  (select id from team_members where name='Gerval') g,(select id from team_members where name='Guto') gu,
  (select id from team_members where name='Petterson') p,(select id from team_members where name='Karina') k)
insert into calendar_posts (client_id,title,type,scheduled_date,caption,status,current_stage,roteiro_status,roteiro_approved_at,gravacao_status,gravacao_url,gravacao_approved_at,edicao_status,roteiro_by,gravacao_by,edicao_by,publicacao_by)
select x.c,v.t,v.tp,v.d::date,'[exemplo] '||v.cap,'producao','edicao','aprovado',now()-interval '5 days','aprovado','https://drive.google.com/exemplo-bruto.mp4',now()-interval '3 days','pendente',x.g,x.gu,x.p,x.k
from x,(values
 ('Reel - depoimento Dr. Mussi','reel','2026-06-16','autoridade'),
 ('Story - resultado tratamento','story','2026-06-17','prova social'),
 ('Reel - dúvida do paciente','reel','2026-06-19','educativo')
) v(t,tp,d,cap);

-- G8b: Carrossel/foto (pulam gravação) -> edição pendente
with x as (select (select id from clients where name='Instituto Mussi') c,
  (select id from team_members where name='Gerval') g,(select id from team_members where name='Guto') gu,
  (select id from team_members where name='Petterson') p,(select id from team_members where name='Karina') k)
insert into calendar_posts (client_id,title,type,scheduled_date,caption,status,current_stage,roteiro_status,roteiro_approved_at,edicao_status,roteiro_by,gravacao_by,edicao_by,publicacao_by)
select x.c,v.t,v.tp,v.d::date,'[exemplo] '||v.cap,'producao','edicao','aprovado',now()-interval '2 days','pendente',x.g,x.gu,x.p,x.k
from x,(values
 ('Carrossel - passo a passo do tratamento','carrossel','2026-06-21','educativo'),
 ('Foto - selo de qualidade','foto','2026-06-22','institucional')
) v(t,tp,d,cap);

-- G9: Edição entregue
with x as (select (select id from clients where name='Instituto Mussi') c,
  (select id from team_members where name='Gerval') g,(select id from team_members where name='Guto') gu,
  (select id from team_members where name='Petterson') p,(select id from team_members where name='Karina') k)
insert into calendar_posts (client_id,title,type,scheduled_date,caption,status,current_stage,roteiro_status,roteiro_approved_at,gravacao_status,gravacao_approved_at,edicao_status,edicao_url,edicao_done_at,roteiro_by,gravacao_by,edicao_by,publicacao_by)
select x.c,v.t,v.tp,v.d::date,'[exemplo] '||v.cap,'producao','edicao','aprovado',now()-interval '6 days','aprovado',now()-interval '4 days','entregue','https://drive.google.com/exemplo-final.mp4',now()-interval '4 hours',x.g,x.gu,x.p,x.k
from x,(values
 ('Reel - novidades da clínica','reel','2026-06-16','institucional'),
 ('Story - dica de cuidado diário','story','2026-06-16','educativo')
) v(t,tp,d,cap);

-- G10: Publicação pendente (fila Karina)
with x as (select (select id from clients where name='Instituto Mussi') c,
  (select id from team_members where name='Gerval') g,(select id from team_members where name='Guto') gu,
  (select id from team_members where name='Petterson') p,(select id from team_members where name='Karina') k)
insert into calendar_posts (client_id,title,type,scheduled_date,caption,status,current_stage,roteiro_status,roteiro_approved_at,gravacao_status,gravacao_approved_at,edicao_status,edicao_url,edicao_approved_at,publicacao_status,roteiro_by,gravacao_by,edicao_by,publicacao_by)
select x.c,v.t,v.tp,v.d::date,'[exemplo] '||v.cap,'producao','publicacao','aprovado',now()-interval '7 days','aprovado',now()-interval '5 days','aprovado','https://drive.google.com/exemplo-final.mp4',now()-interval '2 days','pendente',x.g,x.gu,x.p,x.k
from x,(values
 ('Reel - chamada para avaliação','reel','2026-06-16','conversao'),
 ('Story - link na bio','story','2026-06-16','trafego'),
 ('Reel - antes e depois real','reel','2026-06-18','prova social')
) v(t,tp,d,cap);

-- G11: Publicação entregue
with x as (select (select id from clients where name='Instituto Mussi') c,
  (select id from team_members where name='Gerval') g,(select id from team_members where name='Guto') gu,
  (select id from team_members where name='Petterson') p,(select id from team_members where name='Karina') k)
insert into calendar_posts (client_id,title,type,scheduled_date,caption,status,current_stage,roteiro_status,roteiro_approved_at,gravacao_status,gravacao_approved_at,edicao_status,edicao_approved_at,publicacao_status,post_link,roteiro_by,gravacao_by,edicao_by,publicacao_by)
select x.c,v.t,v.tp,v.d::date,'[exemplo] '||v.cap,'producao','publicacao','aprovado',now()-interval '8 days','aprovado',now()-interval '6 days','aprovado',now()-interval '3 days','entregue','https://instagram.com/p/exemplo',x.g,x.gu,x.p,x.k
from x,(values
 ('Story - bom dia institucional','story','2026-06-15','relacionamento')
) v(t,tp,d,cap);

-- G12: Concluídos
with x as (select (select id from clients where name='Instituto Mussi') c,
  (select id from team_members where name='Gerval') g,(select id from team_members where name='Guto') gu,
  (select id from team_members where name='Petterson') p,(select id from team_members where name='Karina') k)
insert into calendar_posts (client_id,title,type,scheduled_date,caption,status,current_stage,published_at,roteiro_status,roteiro_approved_at,gravacao_status,gravacao_approved_at,edicao_status,edicao_approved_at,publicacao_status,post_link,publicacao_approved_at,roteiro_by,gravacao_by,edicao_by,publicacao_by)
select x.c,v.t,v.tp,v.d::date,'[exemplo] '||v.cap,'publicado','concluido',v.d::timestamptz,'aprovado',now()-interval '12 days','aprovado',now()-interval '10 days','aprovado',now()-interval '8 days','aprovado','https://instagram.com/p/exemplo',now()-interval '7 days',x.g,x.gu,x.p,x.k
from x,(values
 ('Reel - campanha dia das mães','reel','2026-06-08','campanha'),
 ('Story - resultado paciente','story','2026-06-09','prova social'),
 ('Reel - dica de higiene','reel','2026-06-10','educativo'),
 ('Carrossel - tipos de tratamento','carrossel','2026-06-11','educativo')
) v(t,tp,d,cap);

-- Backfill: garante entregável em toda etapa aprovada/entregue
update calendar_posts set roteiro_text=coalesce(roteiro_text,'Roteiro aprovado de '||title), roteiro_url=coalesce(roteiro_url,'https://drive.google.com/exemplo-roteiro.pdf') where caption like '[exemplo]%' and roteiro_status in ('aprovado','entregue');
update calendar_posts set gravacao_url=coalesce(gravacao_url,'https://drive.google.com/exemplo-gravacao.mp4') where caption like '[exemplo]%' and gravacao_status in ('aprovado','entregue');
update calendar_posts set edicao_url=coalesce(edicao_url,'https://drive.google.com/exemplo-final.mp4') where caption like '[exemplo]%' and edicao_status in ('aprovado','entregue');
update calendar_posts set post_link=coalesce(post_link,'https://instagram.com/p/exemplo') where caption like '[exemplo]%' and publicacao_status in ('aprovado','entregue');

-- FIM
