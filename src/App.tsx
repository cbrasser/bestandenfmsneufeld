import { useState, useEffect } from 'react';
import type { StudentData, Year, Grade, StudentInfo, Subject, CombinedSubject, PromotionEntity } from './types';
import { isSubject, isCombinedSubject } from './types';
import { storageService } from './utils/storage';
import { initializeStudentData, getSubjectsForYear } from './utils/initializeData';
import { checkPromotionCriteria, calculateFinalGrade } from './utils/promotion';
import { getCriteriaForYear } from './config/criteria';
import { year3Directions } from './config/subjects';
import { PromotionStatus } from './components/PromotionStatus';
import { SubjectCard } from './components/SubjectCard';
import { GradeModal } from './components/GradeModal';
import { DirectionSelector } from './components/DirectionSelector';
import { Onboarding } from './components/Onboarding';
import { Menu } from './components/Menu';
import { useI18n } from './i18n/context';
import { CombinedSubjectCard } from './components/CombinedSubjectCard';
import { Footer } from './components/Footer';

function App() {
  const { t } = useI18n();
  const [data, setData] = useState<StudentData | null>(null);
  const [currentYear, setCurrentYear] = useState<Year>(1);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    null
  );
  const [editingGradeId, setEditingGradeId] = useState<string | null>(null);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const savedData = storageService.getData();
    if (savedData) {
      setData(savedData);
      setCurrentYear(savedData.currentYear);
    } else {
      const newData = initializeStudentData();
      setData(newData);
      // Don't save until onboarding is complete
    }
  }, []);

  useEffect(() => {
    if (data) {
      storageService.saveData(data);
    }
  }, [data]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-500 dark:text-gray-400">{t('loading')}</div>
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
          subjects: direction.subjects.map((s) => ({ ...s, grades: [] })),
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

    const finalGradeCombinedSubject = (subject: PromotionEntity) => {
      return calculateFinalGrade(subject);
    }

    const isPassing = (subject: PromotionEntity) => {
      const grade = calculateFinalGrade(subject);
      return grade >= 4;
    }
    
    const hasGrades = (subject: CombinedSubject) => {
      let hasGradesFinal = false;
      subject.subjects.forEach((sub) => {
        console.log(sub)
        if (sub.grades.length > 0) {
          hasGradesFinal = true;
        }
      })
      return hasGradesFinal;
    }

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
        const importedData = await storageService.importData(file);
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-8">
      <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('gradeTracker')}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {data.studentInfo.name} • {data.studentInfo.division} • {yearLabels[currentYear]}
            </p>
          </div>
          <Menu 
            isOpen={isMenuOpen} 
            onToggle={() => setIsMenuOpen(!isMenuOpen)}
            onExport={handleExport}
            onImport={handleImport}
            onReset={handleReset}
            currentYear={currentYear}
            onYearChange={handleYearChange}
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6">

        {currentYear === 3 && (
          <DirectionSelector
            directions={year3Directions}
            selectedDirectionId={data.year3Direction}
            onSelect={handleDirectionSelect}
          />
        )}

        {currentYear === 3 && !data.year3Direction && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              {t('selectDirectionYear3')}
            </p>
          </div>
        )}

        {subjects.length > 0 ? (
          <>
            <PromotionStatus status={promotionStatus} />

            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                {t('subjectsTitle')}
              </h2>
              <div>
                {subjects.filter(isSubject).map((subject) => (
                  <SubjectCard
                    key={subject.id}
                    subject={subject}
                    onAddGrade={() => handleAddGrade(subject.id)}
                    onEditGrade={(gradeId) =>
                      handleEditGrade(subject.id, gradeId)
                    }
                    onDeleteGrade={(gradeId) =>
                      handleDeleteGrade(subject.id, gradeId)
                    }
                  />
                ))}
                {subjects.filter(isCombinedSubject).map((subject) => {
                  const combinedFinalGrade = finalGradeCombinedSubject(subject);
                  const combinedHasGrades = hasGrades(subject);
                  const combinedIsPassing = isPassing(subject);
                  
                  return (
                    <div key={subject.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-4 overflow-hidden">
                      {/* Combined Subject Header */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {subject.name}
                          </h3>
                          {combinedHasGrades && (
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="text-xs text-gray-500 dark:text-gray-400">{t('finalGrade')}</div>
                                <span
                                  className={`text-xl font-bold ${
                                    combinedIsPassing ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                  }`}
                                >
                                  {combinedFinalGrade === 0 ? '-' : combinedFinalGrade.toFixed(1)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Nested Subjects */}
                      <div className="p-3 space-y-2">
                        {subject.subjects.map((sub) => (
                          <CombinedSubjectCard
                            key={sub.id}
                            subject={sub}
                            onAddGrade={() => handleAddGrade(sub.id)}
                            onEditGrade={(gradeId) =>
                              handleEditGrade(sub.id, gradeId)
                            }
                            onDeleteGrade={(gradeId) =>
                              handleDeleteGrade(sub.id, gradeId)
                            }
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : currentYear === 3 && !data.year3Direction ? null : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">{t('noSubjectsAvailable')}</p>
          </div>
        )}

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
      </div>

      <Footer />
    </div>
  );
}

export default App;
