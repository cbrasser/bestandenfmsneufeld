import type { Year, Direction, Subject } from '../types';

// Default subjects for years 1 and 2
const createDefaultSubject = (name: string): Subject => ({
  id: name.toLowerCase().replace(/\s+/g, '-'),
  name,
  grades: [],
});

export const defaultSubjects: Record<Year, Subject[]> = {
  1: [
    createDefaultSubject('French'),
    createDefaultSubject('English'),
    createDefaultSubject('Biology'),
    createDefaultSubject('Math'),
    createDefaultSubject('Physics'),
    createDefaultSubject('Chemistry'),
    createDefaultSubject('History'),
    createDefaultSubject('Geography'),
    // Add more subjects as needed
  ],
  2: [
    createDefaultSubject('French'),
    createDefaultSubject('English'),
    createDefaultSubject('Biology'),
    createDefaultSubject('Math'),
    createDefaultSubject('Physics'),
    createDefaultSubject('Chemistry'),
    createDefaultSubject('History'),
    createDefaultSubject('Geography'),
    // Subjects may vary - adjust as needed
  ],
  3: [], // Year 3 subjects depend on direction
};

// Year 3 Directions - adjust names and subjects as needed
export const year3Directions: Direction[] = [
  {
    id: 'direction-a',
    name: 'Direction A',
    subjects: [
      createDefaultSubject('Advanced Math'),
      createDefaultSubject('Physics'),
      createDefaultSubject('Chemistry'),
      createDefaultSubject('Biology'),
      createDefaultSubject('French'),
      createDefaultSubject('English'),
    ],
  },
  {
    id: 'direction-b',
    name: 'Direction B',
    subjects: [
      createDefaultSubject('Economics'),
      createDefaultSubject('Business'),
      createDefaultSubject('Math'),
      createDefaultSubject('History'),
      createDefaultSubject('French'),
      createDefaultSubject('English'),
    ],
  },
  {
    id: 'direction-c',
    name: 'Direction C',
    subjects: [
      createDefaultSubject('Literature'),
      createDefaultSubject('History'),
      createDefaultSubject('Philosophy'),
      createDefaultSubject('Languages'),
      createDefaultSubject('French'),
      createDefaultSubject('English'),
    ],
  },
];

