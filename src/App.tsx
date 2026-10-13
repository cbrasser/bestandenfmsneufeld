import { useState, useEffect } from 'react';
import type { StudentData, Year, Grade, StudentInfo, Subject } from './types';
import { isSubject, isCombinedSubject } from './types';
import { storageService } from './utils/storage';
import { initializeStudentData, getSubjectsForYear, reconcileAllYears, reconcileSubjectList } from './utils/initializeData';
import { checkPromotionCriteria } from './utils/promotion';
import { getCriteriaForYear } from './config/criteria';
import { year3Directions } from './config/subjects';
import { PromotionStatus } from './components/PromotionStatus';
import { SubjectCard } from './components/SubjectCard';
import { GradeModal } from './components/GradeModal';
import { AssignGradesModal } from './components/AssignGradesModal';
import { DirectionSelector } from './components/DirectionSelector';
import { Onboarding } from './components/Onboarding';
import { Menu } from './components/Menu';
import { YearTabs } from './components/YearTabs';
import { CloudSync } from './components/CloudSync';
import { useI18n } from './i18n/context';
import { CombinedSubjectCard } from './components/CombinedSubjectCard';
import { Footer } from './components/Footer';
import { StatsPage } from './components/StatsPage';
import { BarChart2, BookOpen } from 'lucide-react';

type View = 'grades' | 'stats';

function App() {
  const { t, tSubject } = useI18n();
  const [view, setView] = useState<View>('grades');
  const [data, setData] = useState<StudentData | null>(null);
  const [currentYear, setCurrentYear] = useState<Year>(1);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    null
  );
  const [editingGradeId, setEditingGradeId] = useState<string | null>(null);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [assigningSubjectId, setAssigningSubjectId] = useState<string | null>(null);

  useEffect(() => {
    const savedData = storageService.getData();
    if (savedData) {
      const reconciled = reconcileAllYears(savedData);
      setData(reconciled);
      setCurrentYear(reconciled.currentYear);
    } else {
      const newData = initializeStudentData();
      setData(newData);
    }
  }, []);

  useEffect(() => {
    if (data) {
      storageService.saveData(data);
    }
  }, [data]);

  // The year's hue is the page: bind it on <html> so the body and portals follow
  const hasProfile = Boolean(data?.studentInfo);
  useEffect(() => {
    const root = document.documentElement;
    if (hasProfile) {
      root.dataset.year = String(currentYear);
    } else {
      delete root.dataset.year;
    }
  }, [hasProfile, currentYear]);

  if (!data) {
    return (
      <div className="auth">
        <p className="muted">{t('loading')}</p>
      </div>
    );
  }

  // Show onboarding if student info is missing
  if (!data.studentInfo) {
    return (
      <Onboarding
        onComplete={(info: StudentInfo) => {
          const updatedData = { ...data, studentInfo: info };
          setData(updatedData);
          storageService.saveData(updatedData);
        }}
        onLoadFromCode={(loaded) => {
          const reconciled = reconcileAllYears(loaded);
          setData(reconciled);
          setCurrentYear(reconciled.currentYear);
        }}
      />
    );
  }

  const subjects = getSubjectsForYear(data, currentYear);
  const criteria = getCriteriaForYear(currentYear);
  const promotionStatus = checkPromotionCriteria(subjects, criteria);

  const handleYearChange = (year: Year) => {
    setCurrentYear(year);
    const updatedData = { ...data, currentYear: year };
    setData(updatedData);
    storageService.saveData(updatedData);
  };

  const handleDirectionSelect = (directionId: string) => {
    const direction = year3Directions.find((d) => d.id === directionId);
    if (!direction) return;

    const updatedData: StudentData = {
      ...data,
      year3Direction: directionId,
      years: {
        ...data.years,
        3: {
          subjects: reconcileSubjectList(data.years[3].subjects, direction.subjects),
        },
      },
    };

    setData(updatedData);
    storageService.saveData(updatedData);
  };

  const handleAddGrade = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setEditingGradeId(null);
    setIsGradeModalOpen(true);
  };

  const handleEditGrade = (subjectId: string, gradeId: string) => {
    setSelectedSubjectId(subjectId);
    setEditingGradeId(gradeId);
    setIsGradeModalOpen(true);
  };

  const handleSaveGrade = (gradeData: Omit<Grade, 'id'>) => {
    if (!selectedSubjectId) return;

    const updatedData = { ...data };
    const yearData = updatedData.years[currentYear];
    console.log(yearData)
    let subject: Subject | undefined = yearData.subjects.find((s) => isSubject(s) && s.id === selectedSubjectId) as Subject | undefined;
    if (!subject) {
      const combinedSubjects = yearData.subjects.filter(isCombinedSubject);
      console.log(combinedSubjects)
      const flattenedList = combinedSubjects.flatMap((s) => s.subjects);
      console.log(flattenedList)
      subject = flattenedList.find((s) => s.id === selectedSubjectId);
      console.log(subject)
    };
    
    if (!subject) {
      return undefined;
    }
    console.log("TEST")
    if (editingGradeId) {
      // Edit existing grade
      const gradeIndex = subject.grades.findIndex(
        (g) => g.id === editingGradeId
      );
      if (gradeIndex !== -1) {
        subject.grades[gradeIndex] = {
          ...subject.grades[gradeIndex],
          ...gradeData,
        };
      }
    } else {
      // Add new grade
      const newGrade: Grade = {
        id: `grade-${Date.now()}-${Math.random()}`,
        ...gradeData,
      };
      subject.grades.push(newGrade);
    }

    setData({ ...updatedData });
    setIsGradeModalOpen(false);
    setSelectedSubjectId(null);
    setEditingGradeId(null);
  };

  const handleDeleteGrade = (subjectId: string, gradeId: string) => {
    const updatedData = { ...data };
    const yearData = updatedData.years[currentYear];

    // First try to find as a direct Subject
    let subject = yearData.subjects.find((s) => isSubject(s) && s.id === subjectId) as Subject | undefined;

    // If not found, search in CombinedSubject nested subjects
    if (!subject) {
      const combinedSubjects = yearData.subjects.filter(isCombinedSubject);
      const flattenedList = combinedSubjects.flatMap((s) => s.subjects);
      subject = flattenedList.find((s) => s.id === subjectId);
    }

    if (!subject) return;

    subject.grades = subject.grades.filter((g) => g.id !== gradeId);
    setData({ ...updatedData });
  };

  const handleOralGradeUpdate = (subjectId: string, oralGrade: number | undefined) => {
    const updatedData = { ...data };
    const yearData = updatedData.years[currentYear];

    // First try to find as a direct Subject
    let subject = yearData.subjects.find((s) => isSubject(s) && s.id === subjectId) as Subject | undefined;

    // If not found, search in CombinedSubject nested subjects
    if (!subject) {
      const combinedSubjects = yearData.subjects.filter(isCombinedSubject);
      const flattenedList = combinedSubjects.flatMap((s) => s.subjects);
      subject = flattenedList.find((s) => s.id === subjectId);
    }

    if (!subject) return;

    subject.oralGrade = oralGrade;
    setData({ ...updatedData });
  };

  const assigningSubject = subjects
    .filter(isCombinedSubject)
    .find((s) => s.id === assigningSubjectId);

  const handleAssignGrades = (assignments: Record<string, string | null>) => {
    if (!assigningSubject?.unassignedGrades) return;

    const remaining: Grade[] = [];
    assigningSubject.unassignedGrades.forEach((grade) => {
      const target = assigningSubject.subjects.find((s) => s.id === assignments[grade.id]);
      if (target) {
        target.grades = [...target.grades, grade];
      } else if (assignments[grade.id] !== null) {
        remaining.push(grade);
      }
    });
    assigningSubject.unassignedGrades = remaining.length > 0 ? remaining : undefined;
    setData({ ...data });
  };

  const existingGrade = selectedSubjectId && editingGradeId
    ? (() => {
        // First try to find as a direct Subject
        const subject = subjects.find((s) => isSubject(s) && s.id === selectedSubjectId) as Subject | undefined;
        if (subject) {
          return subject.grades.find((g) => g.id === editingGradeId);
        }
        // If not found, search in CombinedSubject nested subjects
        const combinedSubjects = subjects.filter(isCombinedSubject);
        const flattenedList = combinedSubjects.flatMap((s) => s.subjects);
        const nestedSubject = flattenedList.find((s) => s.id === selectedSubjectId);
        return nestedSubject?.grades.find((g) => g.id === editingGradeId);
      })()
    : undefined;

    const yearLabels: Record<Year, string> = {
      1: t('year1'),
      2: t('year2'),
      3: t('year3'),
    };

    const handleExport = () => {
      try {
        storageService.exportData();
        alert(t('exportSuccess'));
      } catch (error) {
        alert(t('exportError'));
        console.error('Export error:', error);
      }
    };

    const handleImport = async (file: File) => {
      try {
        const importedData = reconcileAllYears(await storageService.importData(file));
        setData(importedData);
        setCurrentYear(importedData.currentYear);
        alert(t('importSuccess'));
        setIsMenuOpen(false);
      } catch (error) {
        alert(t('importError') + ': ' + (error instanceof Error ? error.message : t('importInvalidFile')));
        console.error('Import error:', error);
      }
    };

    const handleReset = () => {
      if (window.confirm(t('resetConfirm'))) {
        try {
          storageService.clearData();
          const newData = initializeStudentData();
          setData(newData);
          setCurrentYear(1);
          alert(t('resetSuccess'));
          setIsMenuOpen(false);
        } catch (error) {
          alert(t('resetError'));
          console.error('Reset error:', error);
        }
      }
    };

  const direction = currentYear === 3
    ? year3Directions.find((d) => d.id === data.year3Direction)
    : undefined;
  const needsDirection = currentYear === 3 && !direction;

  // The verdict is the page title
  const verdict = !promotionStatus.hasGrades
    ? t('noGradesYetStatus')
    : promotionStatus.isPassing
    ? t('passing')
    : t('notPassing');

  const views: { id: View; label: string; icon: typeof BookOpen }[] = [
    { id: 'grades', label: t('subjectsTitle'), icon: BookOpen },
    { id: 'stats', label: t('stats'), icon: BarChart2 },
  ];
  const viewButtons = views.map(({ id, label, icon: Icon }) => (
    <button key={id} onClick={() => setView(id)} aria-current={view === id ? 'page' : undefined}>
      <Icon size={18} strokeWidth={2.5} aria-hidden="true" />
      {label}
    </button>
  ));

  return (
    <div className="app has-dock">
      <header className="page app-bar">
        <span className="wordmark">{t('gradeTracker')}</span>
        <Menu
          isOpen={isMenuOpen}
          onToggle={() => setIsMenuOpen(!isMenuOpen)}
          onExport={handleExport}
          onImport={handleImport}
          onReset={handleReset}
          cloudSlot={
            <CloudSync
              data={data}
              onLoaded={(loaded) => {
                const reconciled = reconcileAllYears(loaded);
                setData(reconciled);
                setCurrentYear(reconciled.currentYear);
                setIsMenuOpen(false);
              }}
            />
          }
        />
      </header>

      <main className="page">
        <div className="page-head">
          <div className="page-head-text">
            <h1 className="display">{needsDirection ? yearLabels[3] : verdict}</h1>
            <p className="meta">
              {!needsDirection && <span>{yearLabels[currentYear]}</span>}
              {direction && <span>{tSubject(direction.name)}</span>}
              <span>{data.studentInfo.name}</span>
              <span>{data.studentInfo.division}</span>
            </p>
          </div>
          <nav className="segmented view-switch">{viewButtons}</nav>
        </div>

        <div className="workspace">
          <div className="workspace-side">
            <YearTabs currentYear={currentYear} onYearChange={handleYearChange} />
            <div className="side-stack">
              {subjects.length > 0 && <PromotionStatus status={promotionStatus} />}
              {currentYear === 3 && (
                <DirectionSelector
                  directions={year3Directions}
                  selectedDirectionId={data.year3Direction}
                  onSelect={handleDirectionSelect}
                />
              )}
            </div>
          </div>

          <div className="main-stack">
            {view === 'grades' ? (
              <>
                {subjects
                  .filter(isCombinedSubject)
                  .filter((subject) => subject.unassignedGrades?.length)
                  .map((subject) => (
                    <div key={subject.id} className="leaf notice">
                      <p>
                        <strong>{tSubject(subject.name)}</strong> {t('assignGradesNotice')}
                      </p>
                      <button onClick={() => setAssigningSubjectId(subject.id)} className="btn btn-primary">
                        {t('assignGrades')}
                      </button>
                    </div>
                  ))}

                {subjects.length > 0 ? (
                  <>
                    <h2 className="section-title">{t('subjectsTitle')}</h2>
                    <div className="subjects">
                      {subjects.filter(isSubject).map((subject) => (
                        <SubjectCard
                          key={subject.id}
                          subject={subject}
                          onAddGrade={() => handleAddGrade(subject.id)}
                          onEditGrade={(gradeId) => handleEditGrade(subject.id, gradeId)}
                          onDeleteGrade={(gradeId) => handleDeleteGrade(subject.id, gradeId)}
                          onOralGradeChange={(oralGrade) => handleOralGradeUpdate(subject.id, oralGrade)}
                        />
                      ))}
                      {subjects.filter(isCombinedSubject).map((subject) => (
                        <CombinedSubjectCard
                          key={subject.id}
                          subject={subject}
                          onAddGrade={handleAddGrade}
                          onEditGrade={handleEditGrade}
                          onDeleteGrade={handleDeleteGrade}
                          onOralGradeChange={handleOralGradeUpdate}
                        />
                      ))}
                    </div>
                  </>
                ) : needsDirection ? null : (
                  <div className="leaf state-card">
                    <p>{t('noSubjectsAvailable')}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="section-title">{t('stats')}</h2>
                <StatsPage data={data} currentYear={currentYear} />
              </>
            )}
          </div>
        </div>

        <GradeModal
          isOpen={isGradeModalOpen}
          onClose={() => {
            setIsGradeModalOpen(false);
            setSelectedSubjectId(null);
            setEditingGradeId(null);
          }}
          onSave={handleSaveGrade}
          existingGrade={existingGrade}
        />

        <AssignGradesModal
          subject={assigningSubject}
          onClose={() => setAssigningSubjectId(null)}
          onSave={handleAssignGrades}
        />
      </main>

      {/* Footer only on grades view */}
      {view === 'grades' && <Footer onExport={handleExport} />}

      {/* Subjects / Statistics, docked on phones */}
      <nav className="dock">{viewButtons}</nav>
    </div>
  );
}

export default App;
