import type { Year, Direction, Subject, CombinedSubject } from '../types';

// Default subjects for years 1 and 2
const createDefaultSubject = (name: string): Subject => ({
  id: name.toLowerCase().replace(/\s+/g, '-'),
  name,
  grades: [],
});

const createCombinedSubject = (name: string, subject_names: string[]): CombinedSubject => {
  const id = name.toLowerCase().replace(/\s+/g, '-');
  const subjects = subject_names.map(createDefaultSubject);
  return {
    id,
    name,
    subjects,
  };
}

export const defaultSubjects: Record<Year, (Subject | CombinedSubject)[]> = {
  1: [
    createDefaultSubject('Deutsch'),
    createDefaultSubject('Französisch'),
    createDefaultSubject('Englisch'),
    createDefaultSubject('Mathematik'),
    createDefaultSubject('Psychologie'),
    createDefaultSubject('Sport'),
    createCombinedSubject('Naturwissenschaften', ['Chemie', 'Biologie', 'Physik']),
    createCombinedSubject('Geisteswissenschaften', ['Geschichte und Politik', 'Geografie', 'Wirtschaft und Recht']),
    createCombinedSubject('Musische Fächer', ['Musik', 'Bildnerisches Gestalten']),
  ],
  2: [
    createDefaultSubject('Deutsch'),
    createDefaultSubject('Französisch'),
    createDefaultSubject('Englisch'),
    createDefaultSubject('Mathematik'),
    createDefaultSubject('Sport'),
    createCombinedSubject('Naturwissenschaften', ['Chemie', 'Biologie', 'Physik']),
    createCombinedSubject('Geistes- und Sozialwissenschaften', ['Geschichte und Politik', 'Philosophie']),
    createCombinedSubject('Musische Fächer', ['Musik', 'Bildnerisches Gestalten']),
    createCombinedSubject('Berufsfeldeinblicke', ['Humanbiologie', 'Soziologie', 'Pädagogik/Entwicklungspsychologie']),
  ],
  3: [], // Year 3 subjects depend on direction
  4: [], // The FMS has three years
};

// Old id -> current id for renamed subjects, so saved grades follow the rename
export const renamedSubjectIds: Record<string, string> = {
  'maths': 'mathematik',
  'geschichte-&-politik': 'geschichte-und-politik',
  // former year 3 placeholder subjects
  'french': 'französisch',
  'english': 'englisch',
  'math': 'mathematik',
  'biology': 'biologie',
};

// Old flat subject id -> id of the combined subject that replaced it. Its saved
// grades can't be mapped to a Teilfach automatically, so the user assigns them.
export const splitSubjectIds: Record<string, string> = {
  'berufseinblicke': 'berufsfeldeinblicke',
};

// Subjects shared by all year 3 directions. The Fach Naturwissenschaften has
// Biologie as its only Teilfach in year 3, so it is listed as Biologie.
const year3CommonSubjects = (): Subject[] => [
  createDefaultSubject('Deutsch'),
  createDefaultSubject('Französisch'),
  createDefaultSubject('Englisch'),
  createDefaultSubject('Mathematik'),
  createDefaultSubject('Biologie'),
  createDefaultSubject('Sport'),
];

// Year 3 Directions (Berufsfelder)
export const year3Directions: Direction[] = [
  {
    id: 'gesundheit',
    name: 'Gesundheit',
    subjects: [
      ...year3CommonSubjects(),
      createDefaultSubject('Humanbiologie'),
      createCombinedSubject('Chemie und Physik', ['Chemie', 'Physik']),
      createCombinedSubject('Mensch und Gesellschaft', ['Psychologie', 'Philosophie/Ethik', 'Wirtschaft und Recht']),
    ],
  },
  {
    id: 'soziale-arbeit',
    name: 'Soziale Arbeit',
    subjects: [
      ...year3CommonSubjects(),
      createDefaultSubject('Soziologie'),
      createCombinedSubject('Gesellschaft und Wirtschaft', ['Geschichte und Politik', 'Wirtschaft und Recht']),
      createCombinedSubject('Mensch und Gesellschaft', ['Philosophie/Ethik', 'Psychologie', 'Pädagogik/Entwicklungspsychologie']),
    ],
  },
  {
    id: 'paedagogik',
    name: 'Pädagogik',
    subjects: [
      ...year3CommonSubjects(),
      createCombinedSubject('Psychologie', ['Psychologie', 'Pädagogik/Entwicklungspsychologie']),
      createCombinedSubject('Musik und Bildnerisches Gestalten', ['Musik', 'Bildnerisches Gestalten']),
      createCombinedSubject('Naturwissenschaften und Geografie', ['Naturwissenschaften (Chemie/Physik)', 'Geografie']),
    ],
  },
];
