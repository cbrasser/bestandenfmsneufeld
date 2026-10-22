import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';
import { LogOut, RefreshCw } from 'lucide-react';
import { useI18n } from '../i18n/context';
import {
  AdminAccessError,
  fetchAdminStats,
  getStoredAdminKey,
  setStoredAdminKey,
  type AdminStats,
  type TopicStats,
} from '../utils/adminStats';

// Nur für den Betreiber (/#admin), daher bewusst nur auf Deutsch.

// Chart paint comes from the design tokens, as on the statistics page
const INK = 'var(--ink)';
const INK_2 = 'var(--ink-2)';
const HAIRLINE = 'var(--hairline)';
const DANGER = 'var(--danger)';

const axisTick = { fontSize: 12, fontWeight: 700, fill: INK_2 };
const axisLine = { stroke: INK, strokeWidth: 2 };

const HALF_GRADES = Array.from({ length: 11 }, (_, i) => 1 + i * 0.5);

const fmt = (n: number | null | undefined, digits = 2) => (n == null ? '–' : n.toFixed(digits));
const pct = (part: number, total: number) => (total > 0 ? `${Math.round((part / total) * 100)}%` : '–');

const shortName = (name: string, max = 18) => {
  const plain = name.replaceAll('​', '');
  return plain.length > max ? `${plain.slice(0, max - 1)}…` : plain;
};

const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      {label && <p className="font-extrabold">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="text-ink-2">{p.name}: <span className="font-extrabold text-ink">{p.value}</span></p>
      ))}
    </div>
  );
};

export const AdminPage = () => {
  const [key, setKey] = useState<string | null>(getStoredAdminKey);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async (k: string) => {
    setLoading(true);
    setError(null);
    try {
      setStats(await fetchAdminStats(k));
      setStoredAdminKey(k);
      setKey(k);
    } catch (e) {
      if (e instanceof AdminAccessError) {
        setStoredAdminKey(null);
        setKey(null);
        setStats(null);
      }
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (key) load(key);
    // only the stored key on first load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = () => {
    setStoredAdminKey(null);
    setKey(null);
    setStats(null);
  };

  if (!key || !stats) {
    return (
      <AdminLogin
        loading={loading}
        error={error}
        onSubmit={(k) => load(k)}
      />
    );
  }

  return (
    <div className="app">
      <header className="page app-bar">
        <span className="wordmark">Admin</span>
        <div className="flex gap-2">
          <button onClick={() => load(key)} className="btn btn-icon" aria-label="Neu laden" disabled={loading}>
            <RefreshCw size={18} strokeWidth={2.5} aria-hidden="true" />
          </button>
          <button onClick={logout} className="btn btn-icon" aria-label="Abmelden">
            <LogOut size={18} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
      </header>

      <main className="page">
        <div className="page-head">
          <div className="page-head-text">
            <h1 className="display">Statistik</h1>
            <p className="meta">
              <span>Stand {new Date(stats.generatedAt).toLocaleString('de-CH', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              <a href="#" className="underline">Zur App</a>
            </p>
          </div>
        </div>

        {error && <p className="form-error mb-5">{error}</p>}

        <div className="admin">
          <Overview stats={stats} />
          <TopicSection topics={stats.topics} />
        </div>
      </main>
    </div>
  );
};

function AdminLogin({ loading, error, onSubmit }: { loading: boolean; error: string | null; onSubmit: (key: string) => void }) {
  const [value, setValue] = useState('');

  return (
    <main className="auth">
      <div className="leaf auth-card">
        <div className="grid gap-3">
          <h1 className="auth-title">Admin</h1>
          <p className="lede">Schlüssel eingeben, um die Statistik zu sehen.</p>
        </div>
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            if (value.trim()) onSubmit(value.trim());
          }}
        >
          <div className="field">
            <label htmlFor="admin-key" className="field-label">Admin-Schlüssel</label>
            <input
              id="admin-key"
              type="password"
              autoComplete="current-password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              aria-invalid={error ? true : undefined}
              className="input"
            />
            {error && <p className="field-error">{error}</p>}
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading || !value.trim()}>
            {loading ? 'Lädt…' : 'Anmelden'}
          </button>
        </form>
      </div>
    </main>
  );
}

function Overview({ stats }: { stats: AdminStats }) {
  const { users, grades, signups } = stats;
  const kpiRows = [
    [
      { label: 'Nutzer', value: users.total },
      { label: 'Mit Noten', value: users.withGrades },
      { label: 'Aktiv (30 Tage)', value: users.active30d },
      { label: 'Neu (30 Tage)', value: users.new30d },
    ],
    [
      { label: 'Noten', value: grades.total },
      { label: 'Ø Note', value: fmt(grades.avg) },
      { label: 'Noten unter 4', value: pct(grades.below4, grades.total) },
    ],
  ];

  const signupData = signups.map((s) => ({
    week: new Date(s.week).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: '2-digit' }),
    count: s.count,
  }));

  return (
    <>
      {kpiRows.map((kpis, i) => (
        <section key={i} className="kpis" aria-label={i === 0 ? 'Nutzer' : 'Noten'}>
          {kpis.map(({ label, value }) => (
            <div key={label} className="leaf kpi">
              <span className="kpi-value">{value}</span>
              <span className="kpi-label">{label}</span>
            </div>
          ))}
        </section>
      ))}

      <div className="stats">
        <section className="leaf subject">
          <h2 className="leaf-title">Nutzer nach Bildungsgang</h2>
          <div>
            {Object.entries(users.byDivision)
              .sort((a, b) => b[1] - a[1])
              .map(([division, n]) => (
                <div key={division} className="kv-row">
                  <span className="kv-label">{division}</span>
                  <span className="kv-value">{n}</span>
                </div>
              ))}
          </div>
        </section>

        <section className="leaf subject">
          <h2 className="leaf-title">Neue Nutzer pro Woche</h2>
          {signupData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200} className="chart">
              <BarChart data={signupData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={HAIRLINE} />
                <XAxis dataKey="week" tick={axisTick} tickLine={false} axisLine={axisLine} />
                <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--hue-wash)' }} />
                <Bar dataKey="count" name="Neue Nutzer" fill={INK} radius={[4, 4, 0, 0]} stroke={INK} strokeWidth={2} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="muted">Noch keine Nutzer.</p>
          )}
        </section>
      </div>
    </>
  );
}

function TopicSection({ topics }: { topics: TopicStats[] }) {
  const { tSubject } = useI18n();
  const divisions = useMemo(() => [...new Set(topics.map((t) => t.division))].sort(), [topics]);
  const [division, setDivision] = useState(() => (divisions.includes('FMS') ? 'FMS' : divisions[0] ?? ''));
  const [year, setYear] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const years = useMemo(
    () => [...new Set(topics.filter((t) => t.division === division && t.year > 0).map((t) => t.year))].sort(),
    [topics, division],
  );

  // The chosen year's hue is the page, as in the app; all years stay neutral
  useEffect(() => {
    const root = document.documentElement;
    if (year > 0) root.dataset.year = String(year);
    else delete root.dataset.year;
    return () => {
      delete root.dataset.year;
    };
  }, [year]);

  const rows = useMemo(
    () => topics.filter((t) => t.division === division && t.year === year).sort((a, b) => b.grades - a.grades),
    [topics, division, year],
  );
  const current = rows.find((r) => r.subject === selected) ?? rows[0];

  const avgData = rows.map((r) => ({ name: tSubject(r.subject), avg: r.avg }));
  const histData = current
    ? HALF_GRADES.map((g, i) => ({ grade: g.toFixed(1), count: current.hist[i] ?? 0, below: g < 4 }))
    : [];

  if (divisions.length === 0) {
    return (
      <div className="leaf state-card">
        <h2>Noch keine Noten</h2>
        <p>Sobald Nutzer Noten synchronisieren, erscheinen hier die Fächer.</p>
      </div>
    );
  }

  return (
    <>
      <div className="admin-filters">
        <h2 className="section-title">Fächer</h2>
        <div className="flex flex-wrap gap-3">
          <nav className="segmented" aria-label="Bildungsgang">
            {divisions.map((d) => (
              <button
                key={d}
                onClick={() => {
                  setDivision(d);
                  setYear(0);
                  setSelected(null);
                }}
                aria-pressed={division === d}
              >
                {d}
              </button>
            ))}
          </nav>
          <nav className="segmented" aria-label="Jahr">
            {[0, ...years].map((y) => (
              <button key={y} onClick={() => setYear(y)} aria-pressed={year === y}>
                {y === 0 ? 'Alle Jahre' : `Jahr ${y}`}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="leaf state-card">
          <p>Keine Noten für diese Auswahl.</p>
        </div>
      ) : (
        <>
          <section className="leaf">
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Fach</th>
                    <th scope="col">Nutzer</th>
                    <th scope="col">Noten</th>
                    <th scope="col">Ø</th>
                    <th scope="col">Median</th>
                    <th scope="col">Std.-Abw.</th>
                    <th scope="col">Min–Max</th>
                    <th scope="col">Unter 4</th>
                    <th scope="col">Verteilung</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.subject} className={r.subject === current?.subject ? 'is-selected' : undefined}>
                      <th scope="row">
                        <button
                          className="row-button"
                          onClick={() => setSelected(r.subject)}
                          aria-pressed={r.subject === current?.subject}
                        >
                          {tSubject(r.subject)}
                        </button>
                      </th>
                      <td>{r.students}</td>
                      <td>{r.grades}</td>
                      <td className={r.avg < 4 ? 'is-below' : undefined}>{fmt(r.avg)}</td>
                      <td>{fmt(r.median)}</td>
                      <td>{fmt(r.stddev)}</td>
                      <td>{fmt(r.min)}–{fmt(r.max)}</td>
                      <td>{pct(r.below4, r.grades)}</td>
                      <td>
                        <MiniHistogram hist={r.hist} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="stats">
            <section className="leaf subject">
              <h3 className="leaf-title">Durchschnitt pro Fach</h3>
              <ResponsiveContainer width="100%" height={avgData.length * 34 + 36} className="chart">
                <BarChart data={avgData} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid horizontal={false} stroke={HAIRLINE} />
                  <XAxis type="number" domain={[0, 6]} ticks={[1, 2, 3, 4, 5, 6]} tick={axisTick} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={132}
                    tick={axisTick}
                    tickFormatter={(name: string) => shortName(name)}
                    tickLine={false}
                    axisLine={axisLine}
                    interval={0}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--hue-wash)' }} />
                  <ReferenceLine x={4} stroke={INK} strokeWidth={2} strokeDasharray="5 4" />
                  <Bar dataKey="avg" name="Ø Note" radius={[0, 4, 4, 0]} stroke={INK} strokeWidth={2} barSize={18} isAnimationActive={false}>
                    {avgData.map((entry) => (
                      <Cell key={entry.name} fill={entry.avg >= 4 ? INK : DANGER} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </section>

            {current && (
              <section className="leaf subject">
                <div className="chart-head">
                  <h3 className="leaf-title">Verteilung</h3>
                  <select
                    value={current.subject}
                    onChange={(e) => setSelected(e.target.value)}
                    aria-label="Fach"
                    className="select"
                  >
                    {rows.map((r) => (
                      <option key={r.subject} value={r.subject}>{tSubject(r.subject).replaceAll('​', '')}</option>
                    ))}
                  </select>
                </div>
                <ResponsiveContainer width="100%" height={220} className="chart">
                  <BarChart data={histData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={HAIRLINE} />
                    <XAxis dataKey="grade" tick={axisTick} tickLine={false} axisLine={axisLine} interval={1} />
                    <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--hue-wash)' }} />
                    <ReferenceLine x="4.0" stroke={INK} strokeWidth={2} strokeDasharray="5 4" />
                    <Bar dataKey="count" name="Noten" radius={[4, 4, 0, 0]} stroke={INK} strokeWidth={2} isAnimationActive={false}>
                      {histData.map((entry) => (
                        <Cell key={entry.grade} fill={entry.below ? DANGER : INK} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="muted text-sm">Auf halbe Noten gerundet.</p>
              </section>
            )}
          </div>
        </>
      )}
    </>
  );
}

// Eleven half-grade columns, scaled to the fullest one
function MiniHistogram({ hist }: { hist: number[] }) {
  const max = Math.max(1, ...hist);
  return (
    <span className="mini-hist" aria-hidden="true">
      {hist.map((n, i) => (
        <i
          key={i}
          className={HALF_GRADES[i] < 4 ? 'is-below' : undefined}
          style={{ height: `${n === 0 ? 0 : Math.max(12, (n / max) * 100)}%` }}
        />
      ))}
    </span>
  );
}
