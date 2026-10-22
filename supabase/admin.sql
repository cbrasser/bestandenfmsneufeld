-- =====================================================================
--  Bestanden FMS – Admin-Statistik
-- =====================================================================
--  Ergänzt schema.sql. Liefert NUR aggregierte Zahlen (keine Namen,
--  keine Codes, keine einzelnen Datensätze) und nur gegen einen
--  Admin-Schlüssel, dessen SHA-256-Hash in admin_keys liegt.
--
--  Einrichtung (einmalig):
--   1. Diese Datei im Supabase SQL Editor ausführen.
--   2. Langen Zufallsschlüssel erzeugen und lokal hashen:
--        openssl rand -base64 32
--        printf '%s' 'DEIN-SCHLUESSEL' | shasum -a 256
--   3. Nur den Hash eintragen:
--        insert into public.admin_keys (key_hash) values ('<hash>');
--   4. In der App /#admin öffnen und den Schlüssel eingeben.
-- =====================================================================

create table if not exists public.admin_keys (
  key_hash    text        primary key,
  created_at  timestamptz not null default now()
);

alter table public.admin_keys enable row level security;
revoke all on public.admin_keys from anon, authenticated;

-- ---------------------------------------------------------------------
-- Helfer: Wert als JSON-Array, sonst leeres Array (Client-Daten sind
-- nicht vertrauenswürdig, kaputte Zeilen dürfen die Statistik nicht sprengen)
-- ---------------------------------------------------------------------
create or replace function public.jsonb_array_or_empty(p jsonb)
returns jsonb
language sql
immutable
as $$
  select case when jsonb_typeof(p) = 'array' then p else '[]'::jsonb end;
$$;

-- ---------------------------------------------------------------------
-- RPC: Statistik (wirft bei falschem Schlüssel einen Fehler)
-- ---------------------------------------------------------------------
create or replace function public.admin_stats(p_key text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  result jsonb;
begin
  if p_key is null or not exists (
    select 1 from public.admin_keys where key_hash = public.hash_code(p_key)
  ) then
    raise exception 'Kein Zugriff' using errcode = '42501';
  end if;

  with st as (
    select
      id,
      created_at,
      updated_at,
      coalesce(nullif(data->'studentInfo'->>'division', ''), 'Unbekannt') as division,
      data
    from public.students
  ),
  yrs as (
    select st.id, st.division, y.key::int as year, y.value as yd
    from st
    cross join lateral jsonb_each(
      case when jsonb_typeof(st.data->'years') = 'object' then st.data->'years' else '{}'::jsonb end
    ) y
    where y.key in ('1', '2', '3', '4')
  ),
  entries as (
    select yrs.id, yrs.division, yrs.year, e.value as entry
    from yrs
    cross join lateral jsonb_array_elements(public.jsonb_array_or_empty(yrs.yd->'subjects')) e
    where jsonb_typeof(e.value) = 'object'
  ),
  -- Fächer, Teilfächer und noch nicht zugeteilte Noten eines Fachs
  topics as (
    select id, division, year, entry->>'name' as subject, entry->'grades' as grades
    from entries
    where entry ? 'grades'
    union all
    select en.id, en.division, en.year, t.value->>'name', t.value->'grades'
    from entries en
    cross join lateral jsonb_array_elements(public.jsonb_array_or_empty(en.entry->'subjects')) t
    where jsonb_typeof(t.value) = 'object'
    union all
    select id, division, year, entry->>'name', entry->'unassignedGrades'
    from entries
    where entry ? 'unassignedGrades'
  ),
  grades as (
    select tp.id, tp.division, tp.year, tp.subject, (g.value->>'value')::numeric as value
    from topics tp
    cross join lateral jsonb_array_elements(public.jsonb_array_or_empty(tp.grades)) g
    where tp.subject is not null
      and jsonb_typeof(g.value->'value') = 'number'
      and (g.value->>'value')::numeric between 1 and 6
  ),
  -- year = 0 steht für "alle Jahre", damit auch dort Schüler eindeutig zählen
  scoped as (
    select id, division, year, subject, value from grades
    union all
    select id, division, 0, subject, value from grades
  ),
  per_topic as (
    select
      division,
      year,
      subject,
      count(distinct id)                                         as students,
      count(*)                                                   as grades,
      round(avg(value), 2)                                       as avg,
      round(percentile_cont(0.5) within group (order by value)::numeric, 2) as median,
      round(coalesce(stddev_samp(value), 0), 2)                  as stddev,
      min(value)                                                 as min,
      max(value)                                                 as max,
      count(*) filter (where value < 4)                          as below4
    from scoped
    group by division, year, subject
  ),
  -- Verteilung in halben Noten: Index 0 = 1.0, Index 10 = 6.0
  buckets as (
    select division, year, subject, (round(value * 2) - 2)::int as b, count(*) as n
    from scoped
    group by 1, 2, 3, 4
  ),
  hists as (
    select k.division, k.year, k.subject, jsonb_agg(coalesce(bk.n, 0) order by gs.b) as hist
    from (select distinct division, year, subject from scoped) k
    cross join generate_series(0, 10) gs(b)
    left join buckets bk
      on bk.division = k.division and bk.year = k.year and bk.subject = k.subject and bk.b = gs.b
    group by 1, 2, 3
  )
  select jsonb_build_object(
    'generatedAt', now(),
    'users', jsonb_build_object(
      'total',      (select count(*) from st),
      'withGrades', (select count(distinct id) from grades),
      'active30d',  (select count(*) from st where updated_at > now() - interval '30 days'),
      'new30d',     (select count(*) from st where created_at > now() - interval '30 days'),
      'byDivision', coalesce((select jsonb_object_agg(division, n)
                              from (select division, count(*) n from st group by division) d), '{}'::jsonb)
    ),
    'grades', jsonb_build_object(
      'total', (select count(*) from grades),
      'avg',   (select round(avg(value), 2) from grades),
      'below4', (select count(*) from grades where value < 4)
    ),
    -- Neue Konten pro Woche
    'signups', coalesce((
      select jsonb_agg(jsonb_build_object('week', week, 'count', n) order by week)
      from (
        select to_char(date_trunc('week', created_at), 'YYYY-MM-DD') as week, count(*) n
        from st group by 1
      ) w
    ), '[]'::jsonb),
    'topics', coalesce((
      select jsonb_agg(to_jsonb(p) || jsonb_build_object('hist', h.hist)
                       order by p.division, p.year, p.grades desc)
      from per_topic p
      join hists h using (division, year, subject)
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_stats(text) from public;
grant execute on function public.admin_stats(text) to anon, authenticated;
