export type Language = 'de' | 'fr' | 'en' | 'it';

export interface Translations {
  // General
  gradeTracker: string;
  trackProgress: string;
  loading: string;
  
  // Onboarding
  welcome: string;
  onboardingDescription: string;
  yourName: string;
  enterYourName: string;
  division: string;
  continue: string;
  pleaseEnterName: string;
  pleaseSelectDivision: string;
  
  // Navigation
  currentYear: string;
  year: string;
  year1: string;
  year2: string;
  year3: string;
  
  // Direction
  selectDirection: string;
  selectDirectionYear3: string;
  directionA: string;
  directionB: string;
  directionC: string;
  subjects: string;
  
  // Promotion Status
  passing: string;
  notPassing: string;
  maximumFailures: string;
  finalGradesBelow4: string;
  averageGrade: string;
  minimum: string;
  totalDeficit: string;
  maximum: string;
  
  // Subjects
  subjectsTitle: string;
  noGradesYet: string;
  addFirstGrade: string;
  finalGrade: string;
  noSubjectsAvailable: string;
  
  // Grade Modal
  addGrade: string;
  editGrade: string;
  grade: string;
  gradeRange: string;
  weight: string;
  weightDescription: string;
  label: string;
  labelPlaceholder: string;
  cancel: string;
  save: string;
  invalidValues: string;
  
  // Menu
  menu: string;
  settings: string;
  language: string;
  
  // Languages
  german: string;
  french: string;
  english: string;
  italian: string;
  
  // Actions
  swipeHint: string;
}

export const translations: Record<Language, Translations> = {
  de: {
    // General
    gradeTracker: 'Noten-Tracker',
    trackProgress: 'Verfolge deinen Fortschritt und deinen Promotionsstatus',
    loading: 'Lädt...',
    
    // Onboarding
    welcome: 'Willkommen beim Noten-Tracker',
    onboardingDescription: 'Lass uns dich einrichten. Bitte gib deine Informationen unten ein.',
    yourName: 'Dein Name',
    enterYourName: 'Gib deinen Namen ein',
    division: 'Abteilung',
    continue: 'Weiter',
    pleaseEnterName: 'Bitte gib deinen Namen ein',
    pleaseSelectDivision: 'Bitte wähle eine Abteilung',
    
    // Navigation
    currentYear: 'Aktuelles Jahr',
    year: 'Jahr',
    year1: 'Jahr 1',
    year2: 'Jahr 2',
    year3: 'Jahr 3',
    
    // Direction
    selectDirection: 'Wähle deine Richtung',
    selectDirectionYear3: 'Bitte wähle eine Richtung für Jahr 3, um deine Fächer zu sehen.',
    directionA: 'Richtung A',
    directionB: 'Richtung B',
    directionC: 'Richtung C',
    subjects: 'Fächer',
    
    // Promotion Status
    passing: 'Bestanden',
    notPassing: 'Nicht bestanden',
    maximumFailures: 'Maximale Fehler',
    finalGradesBelow4: 'Endnoten unter 4',
    averageGrade: 'Durchschnittsnote',
    minimum: 'Minimum',
    totalDeficit: 'Gesamtdefizit',
    maximum: 'Maximum',
    
    // Subjects
    subjectsTitle: 'Fächer',
    noGradesYet: 'Noch keine Noten. Füge deine erste Note hinzu.',
    addFirstGrade: 'Füge deine erste Note hinzu',
    finalGrade: 'Endnote',
    noSubjectsAvailable: 'Keine Fächer für dieses Jahr verfügbar.',
    
    // Grade Modal
    addGrade: 'Note hinzufügen',
    editGrade: 'Note bearbeiten',
    grade: 'Note (1-6)',
    gradeRange: 'Gib eine Note zwischen 1-6 ein (max. 2 Dezimalstellen)',
    weight: 'Gewicht',
    weightDescription: 'z.B. 2 für doppeltes Gewicht, 0.5 für halbes Gewicht',
    label: 'Bezeichnung (optional)',
    labelPlaceholder: 'z.B. Zwischenprüfung, Abschlussprüfung',
    cancel: 'Abbrechen',
    save: 'Speichern',
    invalidValues: 'Bitte gib gültige Werte ein: Note muss zwischen 1-6 liegen, Gewicht muss positiv sein.',
    
    // Menu
    menu: 'Menü',
    settings: 'Einstellungen',
    language: 'Sprache',
    
    // Languages
    german: 'Deutsch',
    french: 'Französisch',
    english: 'Englisch',
    italian: 'Italienisch',
    
    // Actions
    swipeHint: '',
  },
  fr: {
    // General
    gradeTracker: 'Suivi des Notes',
    trackProgress: 'Suivez votre progression et votre statut de promotion',
    loading: 'Chargement...',
    
    // Onboarding
    welcome: 'Bienvenue dans le Suivi des Notes',
    onboardingDescription: 'Configurons votre profil. Veuillez entrer vos informations ci-dessous.',
    yourName: 'Votre nom',
    enterYourName: 'Entrez votre nom',
    division: 'Division',
    continue: 'Continuer',
    pleaseEnterName: 'Veuillez entrer votre nom',
    pleaseSelectDivision: 'Veuillez sélectionner une division',
    
    // Navigation
    currentYear: 'Année actuelle',
    year: 'Année',
    year1: 'Année 1',
    year2: 'Année 2',
    year3: 'Année 3',
    
    // Direction
    selectDirection: 'Sélectionnez votre orientation',
    selectDirectionYear3: 'Veuillez sélectionner une orientation pour l\'année 3 pour voir vos matières.',
    directionA: 'Orientation A',
    directionB: 'Orientation B',
    directionC: 'Orientation C',
    subjects: 'matières',
    
    // Promotion Status
    passing: 'Réussi',
    notPassing: 'Non réussi',
    maximumFailures: 'Échecs maximum',
    finalGradesBelow4: 'Notes finales inférieures à 4',
    averageGrade: 'Note moyenne',
    minimum: 'Minimum',
    totalDeficit: 'Déficit total',
    maximum: 'Maximum',
    
    // Subjects
    subjectsTitle: 'Matières',
    noGradesYet: 'Pas encore de notes. Ajoutez votre première note.',
    addFirstGrade: 'Ajoutez votre première note',
    finalGrade: 'Note finale',
    noSubjectsAvailable: 'Aucune matière disponible pour cette année.',
    
    // Grade Modal
    addGrade: 'Ajouter une note',
    editGrade: 'Modifier la note',
    grade: 'Note (1-6)',
    gradeRange: 'Entrez une note entre 1-6 (max. 2 décimales)',
    weight: 'Poids',
    weightDescription: 'Par ex. 2 pour double poids, 0.5 pour demi poids',
    label: 'Libellé (optionnel)',
    labelPlaceholder: 'Par ex. Examen intermédiaire, Examen final',
    cancel: 'Annuler',
    save: 'Enregistrer',
    invalidValues: 'Veuillez entrer des valeurs valides: la note doit être entre 1-6, le poids doit être positif.',
    
    // Menu
    menu: 'Menu',
    settings: 'Paramètres',
    language: 'Langue',
    
    // Languages
    german: 'Allemand',
    french: 'Français',
    english: 'Anglais',
    italian: 'Italien',
    
    // Actions
    swipeHint: '',
  },
  en: {
    // General
    gradeTracker: 'Grade Tracker',
    trackProgress: 'Track your progress and promotion status',
    loading: 'Loading...',
    
    // Onboarding
    welcome: 'Welcome to Grade Tracker',
    onboardingDescription: 'Let\'s get you set up. Please enter your information below.',
    yourName: 'Your Name',
    enterYourName: 'Enter your name',
    division: 'Division',
    continue: 'Continue',
    pleaseEnterName: 'Please enter your name',
    pleaseSelectDivision: 'Please select a division',
    
    // Navigation
    currentYear: 'Current Year',
    year: 'Year',
    year1: 'Year 1',
    year2: 'Year 2',
    year3: 'Year 3',
    
    // Direction
    selectDirection: 'Select Your Direction',
    selectDirectionYear3: 'Please select a direction for Year 3 to see your subjects.',
    directionA: 'Direction A',
    directionB: 'Direction B',
    directionC: 'Direction C',
    subjects: 'subjects',
    
    // Promotion Status
    passing: 'Passing',
    notPassing: 'Not Passing',
    maximumFailures: 'Maximum Failures',
    finalGradesBelow4: 'Final grades below 4',
    averageGrade: 'Average Grade',
    minimum: 'Minimum',
    totalDeficit: 'Total Deficit',
    maximum: 'Maximum',
    
    // Subjects
    subjectsTitle: 'Subjects',
    noGradesYet: 'No grades yet. Add your first grade.',
    addFirstGrade: 'Add your first grade',
    finalGrade: 'Final Grade',
    noSubjectsAvailable: 'No subjects available for this year.',
    
    // Grade Modal
    addGrade: 'Add Grade',
    editGrade: 'Edit Grade',
    grade: 'Grade (1-6)',
    gradeRange: 'Enter grade between 1-6 (max 2 decimal places)',
    weight: 'Weight',
    weightDescription: 'E.g., 2 for double weight, 0.5 for half weight',
    label: 'Label (optional)',
    labelPlaceholder: 'e.g., Midterm, Final Exam',
    cancel: 'Cancel',
    save: 'Save',
    invalidValues: 'Please enter valid values: Grade must be between 1-6, weight must be positive.',
    
    // Menu
    menu: 'Menu',
    settings: 'Settings',
    language: 'Language',
    
    // Languages
    german: 'German',
    french: 'French',
    english: 'English',
    italian: 'Italian',
    
    // Actions
    swipeHint: '',
  },
  it: {
    // General
    gradeTracker: 'Tracciamento Voti',
    trackProgress: 'Traccia i tuoi progressi e lo stato di promozione',
    loading: 'Caricamento...',
    
    // Onboarding
    welcome: 'Benvenuto nel Tracciamento Voti',
    onboardingDescription: 'Configuriamo il tuo profilo. Inserisci le tue informazioni qui sotto.',
    yourName: 'Il tuo nome',
    enterYourName: 'Inserisci il tuo nome',
    division: 'Divisione',
    continue: 'Continua',
    pleaseEnterName: 'Inserisci il tuo nome',
    pleaseSelectDivision: 'Seleziona una divisione',
    
    // Navigation
    currentYear: 'Anno corrente',
    year: 'Anno',
    year1: 'Anno 1',
    year2: 'Anno 2',
    year3: 'Anno 3',
    
    // Direction
    selectDirection: 'Seleziona la tua direzione',
    selectDirectionYear3: 'Seleziona una direzione per l\'Anno 3 per vedere le tue materie.',
    directionA: 'Direzione A',
    directionB: 'Direzione B',
    directionC: 'Direzione C',
    subjects: 'materie',
    
    // Promotion Status
    passing: 'Promosso',
    notPassing: 'Non promosso',
    maximumFailures: 'Insuff. massimi',
    finalGradesBelow4: 'Voti finali inferiori a 4',
    averageGrade: 'Voto medio',
    minimum: 'Minimo',
    totalDeficit: 'Deficit totale',
    maximum: 'Massimo',
    
    // Subjects
    subjectsTitle: 'Materie',
    noGradesYet: 'Nessun voto ancora. Aggiungi il tuo primo voto.',
    addFirstGrade: 'Aggiungi il tuo primo voto',
    finalGrade: 'Voto finale',
    noSubjectsAvailable: 'Nessuna materia disponibile per questo anno.',
    
    // Grade Modal
    addGrade: 'Aggiungi voto',
    editGrade: 'Modifica voto',
    grade: 'Voto (1-6)',
    gradeRange: 'Inserisci un voto tra 1-6 (max 2 decimali)',
    weight: 'Peso',
    weightDescription: 'Es. 2 per doppio peso, 0.5 per mezzo peso',
    label: 'Etichetta (opzionale)',
    labelPlaceholder: 'Es. Esame intermedio, Esame finale',
    cancel: 'Annulla',
    save: 'Salva',
    invalidValues: 'Inserisci valori validi: Il voto deve essere tra 1-6, il peso deve essere positivo.',
    
    // Menu
    menu: 'Menu',
    settings: 'Impostazioni',
    language: 'Lingua',
    
    // Languages
    german: 'Tedesco',
    french: 'Francese',
    english: 'Inglese',
    italian: 'Italiano',
    
    // Actions
    swipeHint: '',
  },
};






