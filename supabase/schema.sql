-- Räkna demo-schema.
--
-- Kör i Supabase SQL Editor (Project → SQL → New query → paste → Run).
-- Denna schema är avsedd för demo-läge med en enda delad workspace.
-- Alla anrop går server-side via API-routes med SUPABASE_SERVICE_ROLE_KEY,
-- så RLS behöver inte konfigureras för att detta ska fungera. Vill du ändå
-- ha "belt and suspenders" — RLS-blocket längst ned kan aktiveras.

-- ─── Cleanup (idempotent — dropar allt om det redan finns) ───────────
drop table if exists cashflow cascade;
drop table if exists messages cascade;
drop table if exists salary_requests cascade;
drop table if exists invoices cascade;
drop table if exists learned_rules cascade;
drop table if exists orphans cascade;
drop table if exists transactions cascade;
drop table if exists clients cascade;
drop table if exists revisor_info cascade;
drop table if exists workspaces cascade;

-- ─── Workspaces ──────────────────────────────────────────────────────
create table workspaces (
  id text primary key,
  name text not null,
  created_at timestamptz default now()
);

-- ─── Revisor (byrå-info per workspace) ───────────────────────────────
create table revisor_info (
  workspace_id text primary key references workspaces(id) on delete cascade,
  id text not null,
  name text not null,
  firm text,
  email text
);

-- ─── Clients ─────────────────────────────────────────────────────────
create table clients (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  name text not null,
  org_nr text,
  contact_name text,
  email text,
  bank text,
  last_active date,
  fortnox_synced boolean default false,
  default_gross_salary numeric,
  sample_csv text,
  sort_order int default 0
);
create index clients_workspace_idx on clients(workspace_id);

-- ─── Transactions ────────────────────────────────────────────────────
create table transactions (
  id text primary key,
  client_id text not null references clients(id) on delete cascade,
  date date not null,
  description text not null,
  amount numeric not null,
  status text not null check (status in ('saknar_underlag', 'inkommen', 'bokford', 'ok')),
  receipt_url text,
  receipt_type text check (receipt_type in ('privat', 'foretagskort', 'ovrigt')),
  note text,
  posting jsonb,
  orphan_id text,
  fortnox_file_id text,
  created_at timestamptz default now()
);
create index transactions_client_idx on transactions(client_id);
create index transactions_status_idx on transactions(status);

-- ─── Orphan receipts (uppladdade underlag som väntar på bankmatch) ──
create table orphans (
  id text primary key,
  client_id text not null references clients(id) on delete cascade,
  filename text not null,
  ocr_motpart text,
  ocr_amount numeric,
  ocr_date date,
  receipt_type text check (receipt_type in ('privat', 'foretagskort', 'ovrigt')),
  note text,
  uploaded_at timestamptz default now()
);
create index orphans_client_idx on orphans(client_id);

-- ─── Learned rules (per klient) ──────────────────────────────────────
create table learned_rules (
  id text primary key,
  client_id text not null references clients(id) on delete cascade,
  pattern text not null,
  posting jsonb not null,
  count int default 1,
  last_used date
);
create index learned_rules_client_idx on learned_rules(client_id);
create unique index learned_rules_client_pattern_idx on learned_rules(client_id, pattern);

-- ─── Invoices ────────────────────────────────────────────────────────
create table invoices (
  id text primary key,
  client_id text not null references clients(id) on delete cascade,
  number text not null,
  customer_name text not null,
  customer_org_nr text,
  customer_email text,
  customer_address text,
  issue_date date not null,
  due_date date not null,
  lines jsonb not null default '[]'::jsonb,
  net numeric not null default 0,
  vat numeric not null default 0,
  total numeric not null default 0,
  status text not null check (status in ('utkast', 'skickad', 'betald', 'forfallen')),
  paid_at date,
  note text,
  fortnox_synced boolean default false,
  created_at timestamptz default now()
);
create index invoices_client_idx on invoices(client_id);

-- ─── Messages ────────────────────────────────────────────────────────
create table messages (
  id text primary key,
  client_id text not null references clients(id) on delete cascade,
  from_role text not null check (from_role in ('klient', 'revisor')),
  text text not null,
  timestamp timestamptz not null default now(),
  read boolean default false
);
create index messages_client_idx on messages(client_id);
create index messages_timestamp_idx on messages(timestamp);

-- ─── Salary requests ─────────────────────────────────────────────────
create table salary_requests (
  id text primary key,
  client_id text not null references clients(id) on delete cascade,
  month text not null,
  gross_amount numeric not null,
  benefits numeric default 0,
  expense_claims numeric default 0,
  estimated_net numeric not null default 0,
  estimated_tax numeric not null default 0,
  estimated_employer_fees numeric not null default 0,
  status text not null check (status in ('begart', 'godkand', 'utbetald', 'avvisad')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  paid_at date,
  note text,
  decision_note text
);
create index salary_client_idx on salary_requests(client_id);

-- ─── Cashflow (per klient och månad) ─────────────────────────────────
create table cashflow (
  client_id text not null references clients(id) on delete cascade,
  month text not null,
  income numeric not null default 0,
  expenses numeric not null default 0,
  saldo numeric not null default 0,
  primary key (client_id, month)
);

-- ─── OPTIONAL: Row Level Security ───────────────────────────────────
-- Aktivera bara om du vill blockera anon-nyckeln från att röra data.
-- Server-side API-routes bypassar RLS via service_role-nyckeln.
--
-- alter table workspaces enable row level security;
-- alter table revisor_info enable row level security;
-- alter table clients enable row level security;
-- alter table transactions enable row level security;
-- alter table orphans enable row level security;
-- alter table learned_rules enable row level security;
-- alter table invoices enable row level security;
-- alter table messages enable row level security;
-- alter table salary_requests enable row level security;
-- alter table cashflow enable row level security;
