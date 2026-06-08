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

const PASSING_COLOR = '#16a34a';
const FAILING_COLOR = '#dc2626';

function gradeColor(grade: number): string {
  return grade >= 4 ? PASSING_COLOR : FAILING_COLOR;
}

// Custom tooltip that safely formats numbers
const GradeTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; payload?: { subjects?: string } }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs shadow-lg">
      {label && <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">{label}{payload[0]?.payload?.subjects ? ` — ${payload[0].payload.subjects}` : ''}</p>}
      {payload.map((p) => (
        <p key={p.name} className="text-gray-600 dark:text-gray-400">{p.name}: <span className="font-semibold">{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span></p>
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
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
        <p className="text-base">{t('noGradesYetStatus')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Bar Chart: Average per subject ────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
          {t('statsAvgPerSubject')}
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={averageBarData} margin={{ top: 4, right: 8, left: -16, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              angle={-35}
              textAnchor="end"
              interval={0}
            />
            <YAxis domain={[0, 6]} ticks={[1, 2, 3, 4, 5, 6]} tick={{ fontSize: 11 }} />
            <Tooltip content={<GradeTooltip />} />
            <ReferenceLine y={4} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: '4.0', position: 'right', fontSize: 10 }} />
            <Bar dataKey="grade" name={t('finalGrade')} radius={[3, 3, 0, 0]}>
              {averageBarData.map((entry, i) => (
                <rect key={i} fill={gradeColor(entry.grade)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {/* manual color legend for bars (recharts Cell approach) */}
        <div className="mt-1 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-green-600" />{t('passing')}</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-red-600" />{t('notPassing')}</span>
        </div>
      </div>

      {/* ── Line Chart: Grade development over time ────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
            {t('statsGradeDevelopment')}
          </h3>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            <option value="all">{t('statsAllSubjects')}</option>
            {leafSubjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        {hasDateGrades ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={timelineData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[1, 6]} ticks={[1, 2, 3, 4, 5, 6]} tick={{ fontSize: 11 }} />
              <Tooltip content={<GradeTooltip />} />
              <ReferenceLine y={4} stroke="#f59e0b" strokeDasharray="4 4" />
              <Line
                type="monotone"
                dataKey="avg"
                name={t('averageGrade')}
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 4, fill: '#2563eb' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
            {t('statsNoDates')}
          </p>
        )}
      </div>

      {/* ── Radar Chart: Performance profile ──────────────────────────── */}
      {radarData.length >= 3 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
            {t('statsPerformanceProfile')}
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
              <Radar
                name={t('finalGrade')}
                dataKey="grade"
                stroke="#2563eb"
                fill="#2563eb"
                fillOpacity={0.25}
              />
              <Tooltip content={<GradeTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Bar Chart: Grade distribution ─────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
          {t('statsGradeDistribution')}
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={distributionData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="range" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" name={t('statsCount')} radius={[3, 3, 0, 0]}>
              {distributionData.map((entry, i) => (
                <rect key={i} fill={entry.passing ? PASSING_COLOR : FAILING_COLOR} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Summary stats ────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">
          {t('statsSummary')}
        </h3>
        <SummaryStats subjects={leafSubjects} t={t} />
      </div>
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
    <div className="grid grid-cols-3 gap-3">
      {stats.map(({ label, value }) => (
        <div key={label} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-gray-800 dark:text-gray-100">{value}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
        </div>
      ))}
    </div>
  );
}
