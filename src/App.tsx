import { useState, useEffect } from 'react';
import type { StudentData, Year, Grade, StudentInfo } from './types';
import { storageService } from './utils/storage';
import { initializeStudentData, getSubjectsForYear } from './utils/initializeData';
import { checkPromotionCriteria } from './utils/promotion';
import { getCriteriaForYear } from './config/criteria';
import { year3Directions } from './config/subjects';
import { PromotionStatus } from './components/PromotionStatus';
import { SubjectCard } from './components/SubjectCard';
import { GradeModal } from './components/GradeModal';
import { YearSelector } from './components/YearSelector';
import { DirectionSelector } from './components/DirectionSelector';
import { Onboarding } from './components/Onboarding';
import { Menu } from './components/Menu';
import { useI18n } from './i18n/context';

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">{t('loading')}</div>
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
    const subject = yearData.subjects.find((s) => s.id === selectedSubjectId);

    if (!subject) return;

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
    const subject = yearData.subjects.find((s) => s.id === subjectId);

    if (!subject) return;

    subject.grades = subject.grades.filter((g) => g.id !== gradeId);
    setData({ ...updatedData });
  };

  const existingGrade = selectedSubjectId && editingGradeId
    ? subjects
        .find((s) => s.id === selectedSubjectId)
        ?.grades.find((g) => g.id === editingGradeId)
    : undefined;

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{t('gradeTracker')}</h1>
            <p className="text-sm text-gray-600">
              {data.studentInfo.name} • {data.studentInfo.division}
            </p>
          </div>
          <Menu isOpen={isMenuOpen} onToggle={() => setIsMenuOpen(!isMenuOpen)} />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6">
        <YearSelector currentYear={currentYear} onYearChange={handleYearChange} />

        {currentYear === 3 && (
          <DirectionSelector
            directions={year3Directions}
            selectedDirectionId={data.year3Direction}
            onSelect={handleDirectionSelect}
          />
        )}

        {currentYear === 3 && !data.year3Direction && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              {t('selectDirectionYear3')}
            </p>
          </div>
        )}

        {subjects.length > 0 ? (
          <>
            <PromotionStatus status={promotionStatus} />

            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                {t('subjectsTitle')}
              </h2>
              <div>
                {subjects.map((subject) => (
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
              </div>
            </div>
          </>
        ) : currentYear === 3 && !data.year3Direction ? null : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500">{t('noSubjectsAvailable')}</p>
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
    </div>
  );
}

export default App;
