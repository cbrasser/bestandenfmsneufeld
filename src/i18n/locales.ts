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
  data: string;
  import: string;
  export: string;
  reset: string;
  
  // Languages
  german: string;
  french: string;
  english: string;
  italian: string;
  
  // Actions
  swipeHint: string;
  
  // Theme
  themeLight: string;
  themeDark: string;
  themeSystem: string;
  theme: string;
  
  // Data management
  exportSuccess: string;
  exportError: string;
  importSuccess: string;
  importError: string;
  importInvalidFile: string;
  resetConfirm: string;
  resetSuccess: string;
  resetError: string;
  noDataToExport: string;
  
  // Footer & Disclaimer
  disclaimer: string;
  disclaimerFull: string;
  copyright: string;
  contactEmail: string;
  underConstruction: string;
  
  // Status
  noGradesYetStatus: string;
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
    data: 'Daten',
    import: 'Importieren',
    export: 'Exportieren',
    reset: 'Zurücksetzen',
    
    // Languages
    german: 'Deutsch',
    french: 'Französisch',
    english: 'Englisch',
    italian: 'Italienisch',
    
    // Actions
    swipeHint: '',
    
    // Theme
    theme: 'Design',
    themeLight: 'Hell',
    themeDark: 'Dunkel',
    themeSystem: 'System',
    
    // Data management
    exportSuccess: 'Daten erfolgreich exportiert',
    exportError: 'Fehler beim Exportieren der Daten',
    importSuccess: 'Daten erfolgreich importiert',
    importError: 'Fehler beim Importieren der Daten',
    importInvalidFile: 'Ungültige Datei. Bitte wählen Sie eine gültige JSON-Datei.',
    resetConfirm: 'Möchten Sie wirklich alle Daten zurücksetzen? Diese Aktion kann nicht rückgängig gemacht werden.',
    resetSuccess: 'Daten erfolgreich zurückgesetzt',
    resetError: 'Fehler beim Zurücksetzen der Daten',
    noDataToExport: 'Keine Daten zum Exportieren vorhanden',
    
    // Footer & Disclaimer
    disclaimer: 'Haftungsausschluss',
    disclaimerFull: 'Achtung: Diese Anwendung ist ein inoffizielles Tool. Die angezeigten Informationen sollten immer überprüft werden. Die Nutzung erfolgt auf eigene Verantwortung. Dies ist KEIN offizieller Status über das Bestehen/Nichtbestehen von Seiten der Schule!',
    copyright: '© 2025 Bestanden FMS',
    contactEmail: 'Kontakt',
    underConstruction: 'In Arbeit',
    
    // Status
    noGradesYetStatus: 'Noch keine Noten',
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
    data: 'Données',
    import: 'Importer',
    export: 'Exporter',
    reset: 'Réinitialiser',
    
    // Languages
    german: 'Allemand',
    french: 'Français',
    english: 'Anglais',
    italian: 'Italien',
    
    // Actions
    swipeHint: '',
    
    // Theme
    theme: 'Thème',
    themeLight: 'Clair',
    themeDark: 'Sombre',
    themeSystem: 'Système',
    
    // Data management
    exportSuccess: 'Données exportées avec succès',
    exportError: 'Erreur lors de l\'exportation des données',
    importSuccess: 'Données importées avec succès',
    importError: 'Erreur lors de l\'importation des données',
    importInvalidFile: 'Fichier invalide. Veuillez sélectionner un fichier JSON valide.',
    resetConfirm: 'Êtes-vous sûr de vouloir réinitialiser toutes les données? Cette action ne peut pas être annulée.',
    resetSuccess: 'Données réinitialisées avec succès',
    resetError: 'Erreur lors de la réinitialisation des données',
    noDataToExport: 'Aucune donnée à exporter',
    
    // Footer & Disclaimer
    disclaimer: 'Avertissement',
    disclaimerFull: 'Veuillez noter: Cette application est un outil non officiel. Les informations affichées doivent toujours être vérifiées sur le site Web officiel. L\'utilisation se fait à vos propres risques. Ce n\'est PAS un statut officiel de réussite/échec de l\'école!',
    copyright: '© 2025 Bestanden FMS',
    contactEmail: 'Contact',
    underConstruction: 'En construction',
    
    // Status
    noGradesYetStatus: 'Pas encore de notes',
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
    data: 'Data',
    import: 'Import',
    export: 'Export',
    reset: 'Reset',
    
    // Languages
    german: 'German',
    french: 'French',
    english: 'English',
    italian: 'Italian',
    
    // Actions
    swipeHint: '',
    
    // Theme
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
    
    // Data management
    exportSuccess: 'Data exported successfully',
    exportError: 'Error exporting data',
    importSuccess: 'Data imported successfully',
    importError: 'Error importing data',
    importInvalidFile: 'Invalid file. Please select a valid JSON file.',
    resetConfirm: 'Are you sure you want to reset all data? This action cannot be undone.',
    resetSuccess: 'Data reset successfully',
    resetError: 'Error resetting data',
    noDataToExport: 'No data to export',
    
    // Footer & Disclaimer
    disclaimer: 'Disclaimer',
    disclaimerFull: 'Please note: This application is an unofficial tool. The displayed information should always be verified on the official website. Use at your own responsibility. This is NOT an official status of passing/failing from the school!',
    copyright: '© 2025 Bestanden FMS',
    contactEmail: 'Contact',
    underConstruction: 'Under Construction',
    
    // Status
    noGradesYetStatus: 'No grades yet',
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
    data: 'Dati',
    import: 'Importa',
    export: 'Esporta',
    reset: 'Reimposta',
    
    // Languages
    german: 'Tedesco',
    french: 'Francese',
    english: 'Inglese',
    italian: 'Italiano',
    
    // Actions
    swipeHint: '',
    
    // Theme
    theme: 'Tema',
    themeLight: 'Chiaro',
    themeDark: 'Scuro',
    themeSystem: 'Sistema',
    
    // Data management
    exportSuccess: 'Dati esportati con successo',
    exportError: 'Errore durante l\'esportazione dei dati',
    importSuccess: 'Dati importati con successo',
    importError: 'Errore durante l\'importazione dei dati',
    importInvalidFile: 'File non valido. Seleziona un file JSON valido.',
    resetConfirm: 'Sei sicuro di voler reimpostare tutti i dati? Questa azione non può essere annullata.',
    resetSuccess: 'Dati reimpostati con successo',
    resetError: 'Errore durante la reimpostazione dei dati',
    noDataToExport: 'Nessun dato da esportare',
    
    // Footer & Disclaimer
    disclaimer: 'Disclaimer',
    disclaimerFull: 'Nota: Questa applicazione è uno strumento non ufficiale. Le informazioni visualizzate dovrebbero sempre essere verificate sul sito Web ufficiale. L\'uso è a proprio rischio. Questo NON è uno status ufficiale di promozione/bocciatura dalla scuola!',
    copyright: '© 2025 Bestanden FMS',
    contactEmail: 'Contatto',
    underConstruction: 'In costruzione',
    
    // Status
    noGradesYetStatus: 'Nessun voto ancora',
  },
};






