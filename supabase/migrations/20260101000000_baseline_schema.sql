-- =====================================================================
--  Bestanden FMS – Cloud-Sync Schema (pseudonyme Code-Anmeldung)
-- =====================================================================
--  Datenschutz-Konzept:
--   * Es werden KEINE personenbezogenen Daten gespeichert (keine Mail,
--     kein Name als Login). Eine Zeile = ein zufälliger Code + JSON-Daten.
--   * Der Code wird NIE im Klartext gespeichert, nur sein SHA-256-Hash.
--   * Die Tabelle ist per RLS komplett dicht. Zugriff ausschliesslich
--     über die SECURITY-DEFINER-Funktionen unten, die den Code prüfen.
--
--  Anwendung: In Supabase -> SQL Editor einfügen und ausführen.
--  Region beim Anlegen des Projekts: EU (Frankfurt) wählen.
-- =====================================================================

-- pgcrypto liefert digest() (SHA-256) und gen_random_uuid()
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- Tabelle
-- ---------------------------------------------------------------------
create table if not exists public.students (
  id          uuid        primary key default gen_random_uuid(),
  code_hash   text        unique not null,
  data        jsonb       not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- RLS an, KEINE Policies -> direkter Zugriff (anon/authenticated) unmöglich.
alter table public.students enable row level security;
revoke all on public.students from anon, authenticated;

-- ---------------------------------------------------------------------
-- Helfer: Code -> Hash (intern, nicht an Clients freigegeben)
-- ---------------------------------------------------------------------
create or replace function public.hash_code(p_code text)
returns text
language sql
immutable
set search_path = extensions, public
as $$
  select encode(digest(p_code, 'sha256'), 'hex');
$$;

-- ---------------------------------------------------------------------
-- RPC: Konto anlegen (Client erzeugt den Zufallscode)
-- ---------------------------------------------------------------------
create or replace function public.create_account(p_code text, p_data jsonb default '{}'::jsonb)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if length(p_code) < 12 then
    raise exception 'Code zu kurz';
  end if;
  insert into public.students (code_hash, data)
  values (public.hash_code(p_code), p_data);
end;
$$;

-- ---------------------------------------------------------------------
-- RPC: Daten laden (gibt JSON zurück oder NULL bei unbekanntem Code)
-- ---------------------------------------------------------------------
create or replace function public.load_data(p_code text)
returns jsonb
language sql
security definer
set search_path = public, extensions
as $$
  select data from public.students
  where code_hash = public.hash_code(p_code);
$$;

-- ---------------------------------------------------------------------
-- RPC: Daten speichern (nur bestehende Zeile; true = Code gültig)
-- ---------------------------------------------------------------------
create or replace function public.save_data(p_code text, p_data jsonb)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  n int;
begin
  update public.students
     set data = p_data, updated_at = now()
   where code_hash = public.hash_code(p_code);
  get diagnostics n = row_count;
  return n > 0;
end;
$$;

-- ---------------------------------------------------------------------
-- Rechte: nur die drei RPCs sind von aussen aufrufbar
-- ---------------------------------------------------------------------
revoke all on function public.create_account(text, jsonb) from public;
revoke all on function public.load_data(text)             from public;
revoke all on function public.save_data(text, jsonb)      from public;

grant execute on function public.create_account(text, jsonb) to anon, authenticated;
grant execute on function public.load_data(text)             to anon, authenticated;
grant execute on function public.save_data(text, jsonb)      to anon, authenticated;
