-- Decoder v2 - Tabelas Completas
-- Execute no SQL Editor do Supabase Dashboard

-- 1. Catálogos (seedáveis)
create table public.airlines (
  id uuid primary key default gen_random_uuid(),
  iata text unique,
  icao text unique,
  name text not null,
  country_iso char(2),
  verified boolean default true,
  created_at timestamptz default now()
);
alter table public.airlines
  add constraint chk_iata_airlines check (iata ~ '^[A-Z0-9]{2}$' or iata is null),
  add constraint chk_icao_airlines check (icao ~ '^[A-Z]{3}$' or icao is null);

create table public.airports (
  id uuid primary key default gen_random_uuid(),
  iata text unique,
  icao text unique,
  name text not null,
  city text,
  country text,
  country_iso char(2),
  verified boolean default true,
  created_at timestamptz default now()
);
alter table public.airports
  add constraint chk_iata_airports check (iata ~ '^[A-Z]{3}$' or iata is null),
  add constraint chk_icao_airports check (icao ~ '^[A-Z]{4}$' or icao is null);

-- 2. Aliases (sinônimos) – leitura
create table public.code_aliases (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('airline','airport')),
  alias text not null,              -- ex: "LONDRES HEATHROW", "LATAM AIR"
  target_id uuid not null,          -- -> airlines.id ou airports.id
  target_kind text not null check (target_kind in ('airline','airport')),
  created_at timestamptz default now()
);
create index on public.code_aliases (kind, alias);

-- 3. Overrides (correções) – escrita do usuário
create table public.decoder_overrides (
  id uuid primary key default gen_random_uuid(),
  scope text not null default 'global' check (scope in ('global','org','user')),
  org_id uuid,                      -- opcional p/ futura multi-org
  user_id uuid,                     -- quem criou
  token text not null,              -- o que veio no PNR (ex: "LON", "LATAM 8084", "AF459")
  token_kind text not null check (token_kind in ('airline','airport','city','segment')),
  target_id uuid not null,
  target_kind text not null check (target_kind in ('airline','airport')),
  reason text,
  created_at timestamptz default now()
);
create index on public.decoder_overrides (token_kind, token);

-- 4. Telemetria (auditável)
create table public.decode_events (
  id uuid primary key default gen_random_uuid(),
  pnr_hash text not null,           -- sha256 do texto PNR
  token text not null,              -- cada item decodificado
  token_kind text not null check (token_kind in ('airline','airport','city','segment')),
  status text not null check (status in ('exact','override','alias','heuristic','error')),
  target_id uuid,                   -- quando houver match
  target_kind text check (target_kind in ('airline','airport')),
  message text,                     -- erro/observação
  user_id uuid,
  created_at timestamptz default now()
);
create index on public.decode_events (created_at);
