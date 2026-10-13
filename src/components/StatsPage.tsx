import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { StudentData, Year } from '../types';
import { isSubject, isCombinedSubject } from '../types';
import type { Translations } from '../i18n/locales';
import { getSubjectsForYear } from '../utils/initializeData';
import { calculateFinalGrade } from '../utils/promotion';
import { useI18n } from '../i18n/context';

interface StatsPageProps {
  data: StudentData;
  currentYear: Year;
}

// Chart paint comes from the design tokens, so both themes follow.
// Passing is ink; red is kept for grades under 4.
const INK = 'var(--ink)';
const INK_2 = 'var(--ink-2)';
const HAIRLINE = 'var(--hairline)';
const DANGER = 'var(--danger)';

function gradeColor(grade: number): string {
  return grade >= 4 ? INK : DANGER;
}

const axisTick = { fontSize: 12, fontWeight: 700, fill: INK_2 };

// Axis labels have a fixed width; the tooltip gives the full name
const shortName = (name: string, max = 18) => {
  const plain = name.replaceAll('\u200B', '');
  return plain.length > max ? `${plain.slice(0, max - 1)}…` : plain;
};
const axisLine = { stroke: INK, strokeWidth: 2 };

// Custom tooltip that safely formats numbers
const GradeTooltip = ({ active, payload, label, decimals = 2 }: { active?: boolean; payload?: { name: string; value: number; payload?: { subjects?: string } }[]; label?: string; decimals?: number }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      {label && <p className="font-extrabold">{label}{payload[0]?.payload?.subjects ? ` — ${payload[0].payload.subjects}` : ''}</p>}
      {payload.map((p) => (
        <p key={p.name} className="text-ink-2">{p.name}: <span className="font-extrabold text-ink">{typeof p.value === 'number' ? p.value.toFixed(decimals) : p.value}</span></p>
      ))}
    </div>
  );
};

export const StatsPage = ({ data, currentYear }: StatsPageProps) => {
  const { t, tSubject } = useI18n();
  const subjects = getSubjectsForYear(data, currentYear);

  // Flatten all leaf subjects with their name
  const leafSubjects = useMemo(() => {
    const result: { id: string; name: string; grades: { value: number; weight: number; date?: string }[] }[] = [];
    subjects.forEach((s) => {
      if (isSubject(s)) {
        result.push({ id: s.id, name: tSubject(s.name), grades: s.grades });
      } else if (isCombinedSubject(s)) {
        s.subjects.forEach((sub) => {
          result.push({ id: sub.id, name: tSubject(sub.name), grades: sub.grades });
        });
      }
    });
    return result.filter((s) => s.grades.length > 0);
  }, [subjects, tSubject]);

  // ── 1. Bar chart: average final grade per subject ────────────────────────
  const averageBarData = useMemo(() => {
    return subjects
      .flatMap((s) => {
        if (isSubject(s)) {
          const grade = calculateFinalGrade(s);
          if (grade === 0) return [];
          return [{ name: tSubject(s.name), grade, passing: grade >= 4 }];
        }
        // Combined: show each sub-subject
        return s.subjects
          .map((sub) => {
            const grade = calculateFinalGrade(sub);
            return grade > 0 ? { name: tSubject(sub.name), grade, passing: grade >= 4 } : null;
          })
          .filter(Boolean) as { name: string; grade: number; passing: boolean }[];
      });
  }, [subjects, tSubject]);

  // ── 2. Line chart: grade development over time (all grades, sorted by date) ──
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');

  const timelineData = useMemo(() => {
    // Collect all grades across chosen scope
    const gradesWithMeta: { date: string; value: number; subjectName: string }[] = [];

    const scope = selectedSubjectId === 'all'
      ? leafSubjects
      : leafSubjects.filter((s) => s.id === selectedSubjectId);

    scope.forEach((s) => {
      s.grades.forEach((g) => {
        if (g.date) {
          gradesWithMeta.push({ date: g.date, value: g.value, subjectName: s.name });
        }
      });
    });

    if (gradesWithMeta.length === 0) return [];

    gradesWithMeta.sort((a, b) => a.date.localeCompare(b.date));

    // Group by date, compute weighted average for that day
    const byDate: Record<string, { sum: number; count: number; subjects: string[] }> = {};
    gradesWithMeta.forEach(({ date, value, subjectName }) => {
      if (!byDate[date]) byDate[date] = { sum: 0, count: 0, subjects: [] };
      byDate[date].sum += value;
      byDate[date].count += 1;
      byDate[date].subjects.push(subjectName);
    });

    return Object.entries(byDate).map(([date, { sum, count, subjects }]) => ({
      date: new Date(date).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' }),
      avg: Math.round((sum / count) * 100) / 100,
      subjects: subjects.join(', '),
    }));
  }, [leafSubjects, selectedSubjectId]);

  // ── 3. Radar chart: final grade per subject (shape of performance) ────────
  const radarData = useMemo(() => {
    return averageBarData.map(({ name, grade }) => ({ subject: name, grade }));
  }, [averageBarData]);

  // ── 4. Grade distribution (histogram buckets: 1-2, 2-3, 3-4, 4-5, 5-6) ──
  const distributionData = useMemo(() => {
    const buckets = [
      { range: '1.0–2.0', min: 1, max: 2, count: 0 },
      { range: '2.0–3.0', min: 2, max: 3, count: 0 },
      { range: '3.0–4.0', min: 3, max: 4, count: 0 },
      { range: '4.0–5.0', min: 4, max: 5, count: 0 },
      { range: '5.0–6.0', min: 5, max: 6.01, count: 0 },
    ];
    leafSubjects.forEach((s) => {
      s.grades.forEach((g) => {
        const bucket = buckets.find((b) => g.value >= b.min && g.value < b.max);
        if (bucket) bucket.count++;
      });
    });
    return buckets.map(({ range, count, min }) => ({ range, count, passing: min >= 4 }));
  }, [leafSubjects]);

  const hasAnyGrades = leafSubjects.length > 0;
  const hasDateGrades = timelineData.length > 0;

  if (!hasAnyGrades) {
    return (
      <div className="leaf state-card">
        <h2>{t('noGradesYetStatus')}</h2>
        <p>{t('addFirstGrade')}</p>
      </div>
    );
  }

  return (
    <div className="stats">

      {/* ── Bar Chart: Average per subject ────────────────────────────── */}
      <section className="leaf subject">
        <h3 className="leaf-title">{t('statsAvgPerSubject')}</h3>
        <ResponsiveContainer width="100%" height={averageBarData.length * 34 + 36} className="chart">
          <BarChart data={averageBarData} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
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
            <Tooltip content={<GradeTooltip />} cursor={{ fill: 'var(--hue-wash)' }} />
            <ReferenceLine x={4} stroke={INK} strokeWidth={2} strokeDasharray="5 4" />
            <Bar dataKey="grade" name={t('finalGrade')} radius={[0, 4, 4, 0]} stroke={INK} strokeWidth={2} barSize={18} isAnimationActive={false}>
              {averageBarData.map((entry) => (
                <Cell key={entry.name} fill={gradeColor(entry.grade)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="legend">
          <span><i />{t('passing')}</span>
          <span><i className="is-below" />{t('notPassing')}</span>
        </div>
      </section>

      {/* ── Line Chart: Grade development over time ────────────────────── */}
      <section className="leaf subject">
        <div className="chart-head">
          <h3 className="leaf-title">{t('statsGradeDevelopment')}</h3>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            aria-label={t('subjectsTitle')}
            className="select"
          >
            <option value="all">{t('statsAllSubjects')}</option>
            {leafSubjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        {hasDateGrades ? (
          <ResponsiveContainer width="100%" height={220} className="chart">
            <LineChart data={timelineData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={HAIRLINE} />
              <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={axisLine} />
              <YAxis domain={[1, 6]} ticks={[1, 2, 3, 4, 5, 6]} tick={axisTick} tickLine={false} axisLine={false} />
              <Tooltip content={<GradeTooltip />} cursor={{ stroke: INK, strokeWidth: 2 }} />
              <ReferenceLine y={4} stroke={INK} strokeWidth={2} strokeDasharray="5 4" />
              <Line
                type="linear"
                dataKey="avg"
                name={t('averageGrade')}
                stroke={INK}
                strokeWidth={2.5}
                dot={{ r: 4, fill: 'var(--paper)', stroke: INK, strokeWidth: 2 }}
                activeDot={{ r: 6, fill: 'var(--hue)', stroke: INK, strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="muted text-sm">{t('statsNoDates')}</p>
        )}
      </section>

      {/* ── Radar Chart: Performance profile ──────────────────────────── */}
      {radarData.length >= 3 && (
        <section className="leaf subject">
          <h3 className="leaf-title">{t('statsPerformanceProfile')}</h3>
          <ResponsiveContainer width="100%" height={280} className="chart">
            <RadarChart data={radarData} outerRadius="46%">
              <PolarGrid stroke={HAIRLINE} />
              <PolarAngleAxis dataKey="subject" tick={axisTick} tickFormatter={(name: string) => shortName(name, 9)} />
              <Radar
                name={t('finalGrade')}
                dataKey="grade"
                stroke={INK}
                strokeWidth={2}
                fill="var(--hue)"
                fillOpacity={1}
                isAnimationActive={false}
              />
              <Tooltip content={<GradeTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </section>
      )}

      {/* ── Bar Chart: Grade distribution ─────────────────────────────── */}
      <section className="leaf subject">
        <h3 className="leaf-title">{t('statsGradeDistribution')}</h3>
        <ResponsiveContainer width="100%" height={200} className="chart">
          <BarChart data={distributionData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={HAIRLINE} />
            <XAxis dataKey="range" tick={axisTick} tickLine={false} axisLine={axisLine} />
            <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} />
            <Tooltip content={<GradeTooltip decimals={0} />} cursor={{ fill: 'var(--hue-wash)' }} />
            <Bar dataKey="count" name={t('statsCount')} radius={[4, 4, 0, 0]} stroke={INK} strokeWidth={2} isAnimationActive={false}>
              {distributionData.map((entry) => (
                <Cell key={entry.range} fill={entry.passing ? INK : DANGER} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* ── Summary stats ────────────────────────────────────────────── */}
      <section className="leaf subject">
        <h3 className="leaf-title">{t('statsSummary')}</h3>
        <SummaryStats subjects={leafSubjects} t={t} />
      </section>
    </div>
  );
};

interface SummaryStatsProps {
  subjects: { name: string; grades: { value: number; weight: number }[] }[];
  t: (key: keyof Translations) => string;
}

function SummaryStats({ subjects, t }: SummaryStatsProps) {
  const allGrades = subjects.flatMap((s) => s.grades.map((g) => g.value));
  if (allGrades.length === 0) return null;

  const totalGrades = allGrades.length;
  const avg = allGrades.reduce((a, b) => a + b, 0) / allGrades.length;
  const best = Math.max(...allGrades);
  const worst = Math.min(...allGrades);
  const passing = allGrades.filter((g) => g >= 4).length;
  const failing = allGrades.filter((g) => g < 4).length;

  const stats = [
    { label: t('statsTotalGrades'), value: totalGrades },
    { label: t('statsOverallAvg'), value: avg.toFixed(2) },
    { label: t('statsBestGrade'), value: best.toFixed(2) },
    { label: t('statsWorstGrade'), value: worst.toFixed(2) },
    { label: t('statsPassing'), value: passing },
    { label: t('statsFailing'), value: failing },
  ];

  return (
    <div>
      {stats.map(({ label, value }) => (
        <div key={label} className="kv-row">
          <span className="kv-label">{label}</span>
          <span className="kv-value">{value}</span>
        </div>
      ))}
    </div>
  );
}
