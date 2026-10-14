import type { GymProfile, Subject, Year } from '../types';

// Gymnasium Neufeld, from its Lektionentafel (Lehrplan 17, from school year 2022/23).
// The canton leaves the split of subjects across the four years to each school.
// Promotion-relevant subjects per "Auszug aus den Promotionsbestimmungen" (2023):
// Sport and the Maturaarbeit are not among them.

export const GYM_YEARS: Year[] = [1, 2, 3, 4];

export const thirdLanguages = ['Englisch', 'Italienisch', 'Latein'];
export const artsOptions = ['Bildnerisches Gestalten', 'Musik'];

export type GymChoice = { id: string; name: string };

export const schwerpunktfaecher: GymChoice[] = [
  { id: 'bildnerisches-gestalten', name: 'Bildnerisches Gestalten' },
  { id: 'biologie-chemie', name: 'Biologie und Chemie' },
  { id: 'englisch', name: 'Englisch' },
  { id: 'italienisch', name: 'Italienisch' },
  { id: 'latein', name: 'Latein' },
  { id: 'musik', name: 'Musik' },
  { id: 'philosophie-paedagogik-psychologie', name: 'Philosophie/Pädagogik/Psychologie' },
  { id: 'physik-anwendungen-der-mathematik', name: 'Physik und Anwendungen der Mathematik' },
  { id: 'spanisch', name: 'Spanisch' },
  { id: 'wirtschaft-und-recht', name: 'Wirtschaft und Recht' },
];

export const ergaenzungsfaecher: GymChoice[] = [
  'Anwendungen der Mathematik',
  'Bildnerisches Gestalten',
  'Biologie',
  'Chemie',
  'Geografie',
  'Geschichte',
  'Informatik',
  'Musik',
  'Pädagogik/Psychologie',
  'Philosophie',
  'Physik',
  'Religionslehre',
  'Sport',
  'Wirtschaft und Recht',
].map((name) => ({ id: slug(name), name }));

// The language Schwerpunktfächer start in year 3; until then those students
// take that language as their Grundlagenfach (Lektionentafel, notes 5 to 7).
const languageSpfs = ['englisch', 'italienisch', 'latein'];
const SPF_LANGUAGE_FROM_YEAR = 3;
const EF_FROM_YEAR = 3;

const THIRD_LANGUAGE = 'third-language';
const ARTS = 'arts';
const EWR = 'Einführung in Wirtschaft und Recht';

// Grundlagenfächer graded in each year
const grundlagenfaecher: Record<Year, string[]> = {
  1: ['Deutsch', 'Französisch', THIRD_LANGUAGE, 'Mathematik', 'Biologie', 'Chemie', 'Informatik', 'Geografie', 'Geschichte', ARTS],
  2: ['Deutsch', 'Französisch', THIRD_LANGUAGE, 'Mathematik', 'Biologie', 'Chemie', 'Physik', 'Informatik', 'Geografie', 'Geschichte', EWR, ARTS],
  3: ['Deutsch', 'Französisch', THIRD_LANGUAGE, 'Mathematik', 'Biologie', 'Chemie', 'Physik', 'Geschichte', ARTS],
  4: ['Deutsch', 'Französisch', THIRD_LANGUAGE, 'Mathematik', 'Physik', 'Geografie', 'Geschichte', ARTS],
};

function slug(name: string): string {
  return name.toLowerCase().replace(/[/\s]+/g, '-');
}

const subject = (name: string, kind?: Subject['kind'], id = slug(name)): Subject => ({
  id,
  name,
  grades: [],
  ...(kind && { kind }),
});

export const isLanguageSpf = (spfId?: string): boolean =>
  Boolean(spfId && languageSpfs.includes(spfId));

// With a language Schwerpunktfach, the third language is that language
export const effectiveThirdLanguage = (profile: GymProfile): string | undefined => {
  if (isLanguageSpf(profile.spf)) {
    return schwerpunktfaecher.find((s) => s.id === profile.spf)?.name;
  }
  return profile.thirdLanguage;
};

// The promotion-relevant subjects of one year. Choices the student has not
// made yet are left out until they are made.
export const gymSubjectsForYear = (year: Year, profile: GymProfile = {}): Subject[] => {
  const spf = schwerpunktfaecher.find((s) => s.id === profile.spf);
  const spfIsLanguage = isLanguageSpf(profile.spf);
  const spfStarted = !spfIsLanguage || year >= SPF_LANGUAGE_FROM_YEAR;
  const thirdLanguage = effectiveThirdLanguage(profile);

  const subjects: Subject[] = [];
  grundlagenfaecher[year].forEach((name) => {
    if (name === THIRD_LANGUAGE) {
      // From year 3 a language Schwerpunktfach takes the place of the Grundlagenfach
      if (thirdLanguage && !(spfIsLanguage && spfStarted)) subjects.push(subject(thirdLanguage));
    } else if (name === ARTS) {
      if (profile.arts) subjects.push(subject(profile.arts));
    } else if (name === EWR) {
      // Not for students with the Schwerpunktfach Wirtschaft und Recht
      if (profile.spf !== 'wirtschaft-und-recht') subjects.push(subject(name));
    } else {
      subjects.push(subject(name));
    }
  });

  if (spf && spfStarted) subjects.push(subject(spf.name, 'spf', `spf-${spf.id}`));

  const ef = ergaenzungsfaecher.find((e) => e.id === profile.ef);
  if (ef && year >= EF_FROM_YEAR) subjects.push(subject(ef.name, 'ef', `ef-${ef.id}`));

  return subjects;
};

// The Ergänzungsfach is chosen at the end of year 2, so it is only asked for from year 3
export const isGymProfileComplete = (year: Year, profile: GymProfile = {}): boolean =>
  Boolean(
    profile.spf &&
      profile.arts &&
      effectiveThirdLanguage(profile) &&
      (year < EF_FROM_YEAR || profile.ef)
  );
