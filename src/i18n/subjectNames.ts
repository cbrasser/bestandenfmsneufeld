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
  'Maths': {
    de: 'Maths',
    fr: 'Maths',
    en: 'Maths',
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
  'Berufseinblicke': {
    de: 'Berufseinblicke',
    fr: 'Aperçus professionnels',
    en: 'Career Insights',
    it: 'Approfondimenti professionali',
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
  'Geschichte & Politik': {
    de: 'Geschichte & Politik',
    fr: 'Histoire & Politique',
    en: 'History & Politics',
    it: 'Storia & Politica',
  },
  'Philosophie': {
    de: 'Philosophie',
    fr: 'Philosophie',
    en: 'Philosophy',
    it: 'Filosofia',
  },
  'Advanced Math': {
    de: 'Erweiterte Mathematik',
    fr: 'Maths avancées',
    en: 'Advanced Math',
    it: 'Matematica avanzata',
  },
  'Economics': {
    de: 'Wirtschaft',
    fr: 'Économie',
    en: 'Economics',
    it: 'Economia',
  },
  'Business': {
    de: 'Business',
    fr: 'Commerce',
    en: 'Business',
    it: 'Business',
  },
  'Math': {
    de: 'Mathematik',
    fr: 'Maths',
    en: 'Math',
    it: 'Matematica',
  },
  'History': {
    de: 'Geschichte',
    fr: 'Histoire',
    en: 'History',
    it: 'Storia',
  },
  'Literature': {
    de: 'Literatur',
    fr: 'Littérature',
    en: 'Literature',
    it: 'Letteratura',
  },
  'Languages': {
    de: 'Sprachen',
    fr: 'Langues',
    en: 'Languages',
    it: 'Lingue',
  },
  'French': {
    de: 'Französisch',
    fr: 'Français',
    en: 'French',
    it: 'Francese',
  },
  'English': {
    de: 'Englisch',
    fr: 'Anglais',
    en: 'English',
    it: 'Inglese',
  },
  'Physics': {
    de: 'Physik',
    fr: 'Physique',
    en: 'Physics',
    it: 'Fisica',
  },
  'Chemistry': {
    de: 'Chemie',
    fr: 'Chimie',
    en: 'Chemistry',
    it: 'Chimica',
  },
  'Biology': {
    de: 'Biologie',
    fr: 'Biologie',
    en: 'Biology',
    it: 'Biologia',
  },
};

export const getTranslatedSubjectName = (name: string, language: Language): string => {
  return subjectNameTranslations[name]?.[language] ?? name;
};

export const hasSubjectTranslation = (name: string): boolean => {
  return name in subjectNameTranslations;
};
