import type { Language } from './locales';

const subjectNameTranslations: Record<string, Record<Language, string>> = {
  'Deutsch': {
    de: 'Deutsch',
    fr: 'Allemand',
    en: 'German',
    it: 'Tedesco',
  },
  'Französisch': {
    de: 'Französisch',
    fr: 'Français',
    en: 'French',
    it: 'Francese',
  },
  'Englisch': {
    de: 'Englisch',
    fr: 'Anglais',
    en: 'English',
    it: 'Inglese',
  },
  'Mathematik': {
    de: 'Mathematik',
    fr: 'Mathématiques',
    en: 'Mathematics',
    it: 'Matematica',
  },
  'Psychologie': {
    de: 'Psychologie',
    fr: 'Psychologie',
    en: 'Psychology',
    it: 'Psicologia',
  },
  'Sport': {
    de: 'Sport',
    fr: 'Sport',
    en: 'Sports',
    it: 'Sport',
  },
  'Berufsfeldeinblicke': {
    de: 'Berufsfeldeinblicke',
    fr: 'Aperçus des champs professionnels',
    en: 'Career Field Insights',
    it: 'Approfondimenti sui campi professionali',
  },
  'Humanbiologie': {
    de: 'Humanbiologie',
    fr: 'Biologie humaine',
    en: 'Human Biology',
    it: 'Biologia umana',
  },
  'Soziologie': {
    de: 'Soziologie',
    fr: 'Sociologie',
    en: 'Sociology',
    it: 'Sociologia',
  },
  'Pädagogik/Entwicklungspsychologie': {
    de: 'Pädagogik/Entwicklungspsychologie',
    fr: 'Pédagogie/Psychologie du développement',
    en: 'Pedagogy/Developmental Psychology',
    it: 'Pedagogia/Psicologia dello sviluppo',
  },
  'Naturwissenschaften': {
    de: 'Naturwissenschaften',
    fr: 'Sciences naturelles',
    en: 'Natural Sciences',
    it: 'Scienze naturali',
  },
  'Chemie': {
    de: 'Chemie',
    fr: 'Chimie',
    en: 'Chemistry',
    it: 'Chimica',
  },
  'Biologie': {
    de: 'Biologie',
    fr: 'Biologie',
    en: 'Biology',
    it: 'Biologia',
  },
  'Physik': {
    de: 'Physik',
    fr: 'Physique',
    en: 'Physics',
    it: 'Fisica',
  },
  'Geisteswissenschaften': {
    de: 'Geisteswissenschaften',
    fr: 'Sciences humaines',
    en: 'Humanities',
    it: 'Scienze umane',
  },
  'Geschichte und Politik': {
    de: 'Geschichte und Politik',
    fr: 'Histoire et politique',
    en: 'History and Politics',
    it: 'Storia e politica',
  },
  'Geography': {
    de: 'Geografie',
    fr: 'Géographie',
    en: 'Geography',
    it: 'Geografia',
  },
  'Geografie': {
    de: 'Geografie',
    fr: 'Géographie',
    en: 'Geography',
    it: 'Geografia',
  },
  'Wirtschaft und Recht': {
    de: 'Wirtschaft und Recht',
    fr: 'Économie et droit',
    en: 'Economics and Law',
    it: 'Economia e diritto',
  },
  'Musische Fächer': {
    de: 'Musische Fächer',
    fr: 'Disciplines artistiques',
    en: 'Arts',
    it: 'Discipline artistiche',
  },
  'Musik': {
    de: 'Musik',
    fr: 'Musique',
    en: 'Music',
    it: 'Musica',
  },
  'Bildnerisches Gestalten': {
    de: 'Bildnerisches Gestalten',
    fr: 'Arts visuels',
    en: 'Visual Arts',
    it: 'Arti visive',
  },
  'Geistes- und Sozialwissenschaften': {
    de: 'Geistes- und Sozialwissenschaften',
    fr: 'Sciences humaines et sociales',
    en: 'Humanities and Social Sciences',
    it: 'Scienze umane e sociali',
  },
  'Philosophie': {
    de: 'Philosophie',
    fr: 'Philosophie',
    en: 'Philosophy',
    it: 'Filosofia',
  },
  'Philosophie/Ethik': {
    de: 'Philosophie/Ethik',
    fr: 'Philosophie/Éthique',
    en: 'Philosophy/Ethics',
    it: 'Filosofia/Etica',
  },
  'Chemie und Physik': {
    de: 'Chemie und Physik',
    fr: 'Chimie et physique',
    en: 'Chemistry and Physics',
    it: 'Chimica e fisica',
  },
  'Mensch und Gesellschaft': {
    de: 'Mensch und Gesellschaft',
    fr: 'Homme et société',
    en: 'People and Society',
    it: 'Uomo e società',
  },
  'Gesellschaft und Wirtschaft': {
    de: 'Gesellschaft und Wirtschaft',
    fr: 'Société et économie',
    en: 'Society and Economics',
    it: 'Società ed economia',
  },
  'Musik und Bildnerisches Gestalten': {
    de: 'Musik und Bildnerisches Gestalten',
    fr: 'Musique et arts visuels',
    en: 'Music and Visual Arts',
    it: 'Musica e arti visive',
  },
  'Naturwissenschaften und Geografie': {
    de: 'Naturwissenschaften und Geografie',
    fr: 'Sciences naturelles et géographie',
    en: 'Natural Sciences and Geography',
    it: 'Scienze naturali e geografia',
  },
  'Naturwissenschaften (Chemie/Physik)': {
    de: 'Naturwissenschaften (Chemie/Physik)',
    fr: 'Sciences naturelles (chimie/physique)',
    en: 'Natural Sciences (Chemistry/Physics)',
    it: 'Scienze naturali (chimica/fisica)',
  },
  'Gesundheit': {
    de: 'Gesundheit',
    fr: 'Santé',
    en: 'Health',
    it: 'Sanità',
  },
  'Soziale Arbeit': {
    de: 'Soziale Arbeit',
    fr: 'Travail social',
    en: 'Social Work',
    it: 'Lavoro sociale',
  },
  'Pädagogik': {
    de: 'Pädagogik',
    fr: 'Pédagogie',
    en: 'Pedagogy',
    it: 'Pedagogia',
  },
};

export const getTranslatedSubjectName = (name: string, language: Language): string => {
  return subjectNameTranslations[name]?.[language] ?? name;
};

export const hasSubjectTranslation = (name: string): boolean => {
  return name in subjectNameTranslations;
};
