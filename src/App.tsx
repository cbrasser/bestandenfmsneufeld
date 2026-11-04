import { useState, useEffect, useCallback } from 'react';
import type { StudentData, Year, Grade, StudentInfo, Subject, GymProfile as GymProfileType } from './types';
import { isSubject, isCombinedSubject } from './types';
import { storageService } from './utils/storage';
import { isNewerData } from './utils/dataVersion';
import { dataBackup, useHasBackup } from './utils/backup';
import { countGrades } from './utils/countGrades';
import { formatDateTime } from './lib/utils';
import { initializeStudentData, getSubjectsForYear, reconcileAllYears, reconcileSubjectList, selectableYear, subjectsLosingGrades } from './utils/initializeData';
import { checkPromotionCriteria, promotionVerdict } from './utils/promotion';
import { endsWithoutPromotion, getCriteria } from './config/criteria';
import { GYM_YEARS } from './config/gymnasium';
import { year3Directions } from './config/subjects';
import { PromotionStatus } from './components/PromotionStatus';
import { SubjectCard } from './components/SubjectCard';
import { GradeModal } from './components/GradeModal';
import { AssignGradesModal } from './components/AssignGradesModal';
import { DirectionSelector } from './components/DirectionSelector';
import { Onboarding } from './components/Onboarding';
import { NamePrompt } from './components/NamePrompt';
import { Menu } from './components/Menu';
import { YearTabs } from './components/YearTabs';
import { GymProfile } from './components/GymProfile';
import { CloudSync } from './components/CloudSync';
import { ConflictPrompt } from './components/ConflictPrompt';
import { NewerDataPage, ReadOnlyNotice } from './components/ReadOnlyNotice';
import { isReadOnlyNow, syncEngine } from './sync/cloud';
import { useCloudSync, useNewerCloudData } from './sync/useCloudSync';
import { useI18n } from './i18n/context';
import { CombinedSubjectCard } from './components/CombinedSubjectCard';
import { Footer } from './components/Footer';
import { StatsPage } from './components/StatsPage';
import { BarChart2, BookOpen } from 'lucide-react';

type View = 'grades' | 'stats';

function App() {
  const { t, tSubject, language } = useI18n();
  const canRestore = useHasBackup();
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
  // A file in a newer format that the student opened: only ever shown, and gone on a reload
  const [newerFile, setNewerFile] = useState<StudentData | null>(null);
  const newerCloudData = useNewerCloudData();

  useEffect(() => {
    const savedData = storageService.getData();
    if (savedData) {
      // Newer data is shown as it is: reconciling keeps only the subjects this version knows
      const loaded = isNewerData(savedData) ? savedData : reconcileAllYears(savedData);
      setData(loaded);
      setCurrentYear(selectableYear(loaded, storageService.getSelectedYear() ?? loaded.currentYear));
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

  // Data from the cloud or another tab: this tab stays on its year, if the new data has it
  const handleDataFromElsewhere = useCallback((stored: StudentData, { keepSelectedYear }: { keepSelectedYear: boolean }) => {
    setData((current) => (JSON.stringify(current) === JSON.stringify(stored) ? current : stored));
    setCurrentYear((year) => (keepSelectedYear ? selectableYear(stored, year) : stored.currentYear));
  }, []);
  useCloudSync(data, handleDataFromElsewhere);

  // Data in a newer format is only shown: every way of changing anything is left out while it is.
  // `data` stays this device's own data, which nothing below changes meanwhile.
  const readOnlyData = newerFile ?? (data && isNewerData(data) ? data : newerCloudData);
  const readOnly = readOnlyData !== null;
  const shown = readOnlyData ?? data;
  // What was on show may have a year this device's own data doesn't, and the other way round
  const shownYear = shown ? selectableYear(shown, currentYear) : currentYear;

  // The year's hue is the page: bind it on <html> so the body and portals follow
  const hasProfile = Boolean(data?.studentInfo);
  useEffect(() => {
    const root = document.documentElement;
    if (hasProfile) {
      root.dataset.year = String(shownYear);
    } else {
      delete root.dataset.year;
    }
  }, [hasProfile, shownYear]);

  if (!data || !shown) {
    return (
      <div className="auth">
        <p className="muted">{t('loading')}</p>
      </div>
    );
  }

  const { studentInfo } = shown;

  // Show onboarding if student info is missing
  if (!studentInfo) {
    if (readOnly) return <NewerDataPage />;
    return (
      <Onboarding
        onComplete={(info: StudentInfo) => {
          // Builds the subject lists of the chosen Bildungsgang
          const updatedData = reconcileAllYears({ ...data, studentInfo: info });
          setData(updatedData);
          storageService.saveData(updatedData);
        }}
      />
    );
  }

  // Cloud data comes without the name, so a device that got its data with a code asks for it
  if (!readOnly && !studentInfo.name) {
    return <NamePrompt onComplete={(name) => setData({ ...data, studentInfo: { ...studentInfo, name } })} />;
  }

  const isGym = studentInfo.division === 'Gymnasium';
  const years: Year[] = isGym ? GYM_YEARS : [1, 2, 3];
  const subjects = getSubjectsForYear(shown, shownYear);
  const criteria = getCriteria(studentInfo.division);
  const promotionStatus = checkPromotionCriteria(subjects, criteria);

  const handleYearChange = (year: Year) => {
    setCurrentYear(year);
    if (!readOnly) storageService.saveSelectedYear(year);
  };

  // What the page last drew can be out of date after a dialog or a file being read
  const refusedAsReadOnly = () => {
    if (!isReadOnlyNow()) return false;
    alert(t('newerDataRefused'));
    return true;
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

  const handleGymProfileChange = (profile: GymProfileType) => {
    const updatedData = reconcileAllYears({ ...data, gymProfile: profile });
    const lost = subjectsLosingGrades(data, updatedData);
    if (lost.length > 0 && !window.confirm(`${t('gymConfirmDrop')} ${[...new Set(lost.map(tSubject))].join(', ')}`)) {
      return;
    }
    if (isReadOnlyNow()) return;
    setData(updatedData);
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
    const yearData = updatedData.years[shownYear];
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
    const yearData = updatedData.years[shownYear];

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
    const yearData = updatedData.years[shownYear];

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
      4: t('year4'),
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

    // For replacing the data with a version that was just kept. All of it happens at once, with no alert:
    // closing the tab during one would leave the kept version replaced and the new one not stored, and
    // a pull already under way would take the unmarked data for no change and replace it.
    const replaceData = (next: StudentData) => {
      storageService.saveData(next);
      storageService.saveSelectedYear(next.currentYear);
      if (syncEngine?.noteLocalChange()) void syncEngine.sync();
      setData(next);
      setCurrentYear(next.currentYear);
      setIsMenuOpen(false);
    };

    const handleImport = async (file: File) => {
      let imported: StudentData;
      try {
        const fileData = await storageService.importData(file);
        if (refusedAsReadOnly()) return;
        if (isNewerData(fileData)) {
          syncEngine?.setViewingNewerFile(true);
          setNewerFile(fileData);
          setIsMenuOpen(false);
          return;
        }
        imported = reconcileAllYears(fileData);
      } catch (error) {
        alert(t('importError') + ': ' + (error instanceof Error ? error.message : t('importInvalidFile')));
        console.error('Import error:', error);
        return;
      }

      if (!window.confirm(`${t('importConfirm')}\n\n${t('gradesLabel')}: ${countGrades(imported)}`)) return;
      if (refusedAsReadOnly()) return;

      try {
        // What is stored now: a sync may have changed it while the file was read or the dialog was up
        dataBackup.keep(storageService.getDataWithSelectedYear() ?? { ...data, currentYear: shownYear });
      } catch (error) {
        alert(t('importError'));
        console.error('Import error:', error);
        return;
      }
      replaceData(imported);
    };

    const closeNewerFile = () => {
      setNewerFile(null);
      syncEngine?.setViewingNewerFile(false);
    };

    const handleRestore = () => {
      const kept = dataBackup.read();
      if (!kept) return;
      if (isNewerData(kept.data)) {
        alert(t('newerDataRefused'));
        return;
      }
      const details = `${t('gradesLabel')}: ${countGrades(kept.data)}\n${formatDateTime(kept.keptAt, language)}`;
      if (!window.confirm(`${t('restoreConfirm')}\n\n${details}`)) return;
      if (refusedAsReadOnly()) return;
      try {
        const restored = dataBackup.swapWith({ ...data, currentYear: shownYear });
        if (restored) replaceData(restored);
      } catch (error) {
        alert(t('restoreError'));
        console.error('Restore error:', error);
      }
    };

    const handleReset = () => {
      if (window.confirm(t('resetConfirm'))) {
        if (refusedAsReadOnly()) return;
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

  // FMS year 3 depends on the Berufsfeld
  const hasDirections = !isGym && shownYear === 3;
  const direction = hasDirections
    ? year3Directions.find((d) => d.id === shown.year3Direction)
    : undefined;
  const needsDirection = hasDirections && !direction;
  const isLastGymYear = endsWithoutPromotion(studentInfo.division, shownYear);

  // The verdict is the page title
  const verdict = {
    noGrades: t('noGradesYetStatus'),
    passing: t('passing'),
    notPassing: t('notPassing'),
  }[promotionVerdict(promotionStatus)];

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
          onImport={readOnly ? undefined : handleImport}
          onReset={readOnly ? undefined : handleReset}
          onRestore={canRestore && !readOnly ? handleRestore : undefined}
          cloudSlot={
            <CloudSync onConnected={() => setIsMenuOpen(false)} />
          }
        />
      </header>

      <main className="page">
        <div className="page-head">
          <div className="page-head-text">
            <h1 className="display">{needsDirection ? yearLabels[3] : verdict}</h1>
            <p className="meta">
              {!needsDirection && <span>{yearLabels[shownYear]}</span>}
              {direction && <span>{tSubject(direction.name)}</span>}
              <span>{studentInfo.name}</span>
              <span>{studentInfo.division}</span>
            </p>
          </div>
          <nav className="segmented view-switch">{viewButtons}</nav>
        </div>

        {readOnly && <ReadOnlyNotice onCloseFile={newerFile ? closeNewerFile : undefined} />}

        <div className="workspace">
          <div className="workspace-side">
            <YearTabs years={years} currentYear={shownYear} onYearChange={handleYearChange} />
            <div className="side-stack">
              {subjects.length > 0 && (
                <PromotionStatus
                  status={promotionStatus}
                  note={isLastGymYear ? t('lastYearNoPromotion') : undefined}
                />
              )}
              {isGym && (
                <GymProfile year={shownYear} profile={shown.gymProfile ?? {}} onChange={handleGymProfileChange} readOnly={readOnly} />
              )}
              {hasDirections && (
                <DirectionSelector
                  directions={year3Directions}
                  selectedDirectionId={shown.year3Direction}
                  onSelect={handleDirectionSelect}
                  readOnly={readOnly}
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
                      {!readOnly && (
                        <button onClick={() => setAssigningSubjectId(subject.id)} className="btn btn-primary">
                          {t('assignGrades')}
                        </button>
                      )}
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
                          readOnly={readOnly}
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
                          readOnly={readOnly}
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
                <StatsPage data={shown} currentYear={shownYear} />
              </>
            )}
          </div>
        </div>

        <GradeModal
          isOpen={isGradeModalOpen && !readOnly}
          onClose={() => {
            setIsGradeModalOpen(false);
            setSelectedSubjectId(null);
            setEditingGradeId(null);
          }}
          onSave={handleSaveGrade}
          existingGrade={existingGrade}
        />

        <AssignGradesModal
          subject={readOnly ? undefined : assigningSubject}
          onClose={() => setAssigningSubjectId(null)}
          onSave={handleAssignGrades}
        />
      </main>

      {/* Footer only on grades view */}
      {view === 'grades' && <Footer onExport={handleExport} />}

      {/* Subjects / Statistics, docked on phones */}
      <nav className="dock">{viewButtons}</nav>

      <ConflictPrompt />
    </div>
  );
}

export default App;
