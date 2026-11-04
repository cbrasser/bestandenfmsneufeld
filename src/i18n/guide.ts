import type { GuideSection } from '../utils/guideRoute';
import { translations } from './locales';
import type { Language } from './locales';

// The text of the app guide (/#app). **Double stars** mark what the student taps
// or reads on screen. Labels of this site come from the translations, so the
// guide always names a button the way the button names itself.

const RELEASE_REPO = 'https://github.com/cbrasser/bestanden-releases';
const LATEST_RELEASE = `${RELEASE_REPO}/releases/latest`;
const OBTAINIUM_DOWNLOAD = 'https://github.com/ImranR98/Obtainium/releases/latest';
export const OBTAINIUM_ADD_LINK = `obtainium://add/${RELEASE_REPO}`;

const SITE = 'bestandenfms.cbradev.ch';
const OLD_SITE = 'bestandenfmsneufeld.vercel.app';

export interface GuideStep {
  text: string;
  link?: { href: string; label: string; primary?: boolean };
  /** A value the student can copy with a button */
  copy?: string;
}

export interface GuideGroup {
  title?: string;
  intro?: string;
  steps: GuideStep[];
  note?: string;
}

export interface GuideLeaf {
  id: string;
  title: string;
  intro: string;
  groups: GuideGroup[];
}

export interface GuideText {
  menuTitle: string;
  menuEntry: string;
  backToGrades: string;
  title: string;
  lede: string;
  sections: Record<GuideSection, { intro: string; warning?: string; leaves: GuideLeaf[] }>;
}

const de = translations.de;
const fr = translations.fr;
const en = translations.en;
const it = translations.it;

export const guideText: Record<Language, GuideText> = {
  de: {
    menuTitle: 'App',
    menuEntry: 'App-Anleitung',
    backToGrades: 'Zu meinen Noten',
    title: 'Bestanden auf dem Handy',
    lede: 'Wähle dein Handy und folge den Schritten der Reihe nach.',
    sections: {
      android: {
        intro: 'Für Android gibt es eine App. Sie funktioniert auch ohne Internet und ist gratis.',
        leaves: [
          {
            id: 'install',
            title: 'App installieren',
            intro: 'Du brauchst Android 8 oder neuer. Die App ist nicht im Play Store, du holst sie direkt von unserer Download-Seite.',
            groups: [
              {
                title: 'Mit Obtainium (empfohlen)',
                intro: 'Obtainium ist eine kleine App, die Bestanden installiert und aktuell hält.',
                steps: [
                  {
                    text: 'Installiere Obtainium: Lade **app-arm64-v8a-release.apk** herunter (passt auf fast jedes neuere Handy) und öffne die Datei. Falls Android fragt, ob dein Browser Apps installieren darf, erlaube es.',
                    link: { href: OBTAINIUM_DOWNLOAD, label: 'Obtainium herunterladen' },
                  },
                  {
                    text: 'Tippe auf diesem Handy auf den Knopf. Obtainium öffnet sich, und die Adresse von Bestanden ist schon eingetragen. Tippe dort auf **Hinzufügen** (Add).',
                    link: { href: OBTAINIUM_ADD_LINK, label: 'Zu Obtainium hinzufügen', primary: true },
                  },
                  {
                    text: 'Tippe auf **Installieren** (Install). Beim ersten Mal fragt Android, ob Obtainium Apps installieren darf. Erlaube es.',
                  },
                  {
                    text: 'Öffne Bestanden. Neue Versionen erscheinen künftig in Obtainium.',
                  },
                ],
              },
              {
                title: 'Falls sich Obtainium nicht öffnet',
                steps: [
                  {
                    text: 'Tippe in Obtainium auf **App hinzufügen** (Add app), füge diese Adresse ein und tippe auf **Hinzufügen** (Add).',
                    copy: RELEASE_REPO,
                  },
                ],
              },
              {
                title: 'Von Hand',
                intro: 'Es geht auch ohne Obtainium. Dann musst du jedes Update selbst installieren.',
                steps: [
                  {
                    text: 'Öffne die neuste Version und lade **bestanden-…apk** herunter.',
                    link: { href: LATEST_RELEASE, label: 'Neuste Version öffnen' },
                  },
                  {
                    text: 'Öffne die Datei. Falls Android fragt, ob dein Browser Apps installieren darf, erlaube es.',
                  },
                ],
              },
            ],
          },
          {
            id: 'code',
            title: 'Noten in die App holen',
            intro: 'Am besten mit einem Zugangscode. Dann bleiben Website und App von selbst auf dem gleichen Stand.',
            groups: [
              {
                title: 'Du benutzt die Website schon',
                steps: [
                  {
                    text: `Öffne ${SITE} und dort das Menü oben rechts. Tippe unter **${de.cloudSync}** auf **${de.cloudCreateCode}**. Bist du schon angemeldet, tippe auf **${de.cloudCopyCode}**.`,
                  },
                  {
                    text: 'Bewahre den Code gut auf. Wenn du ihn verlierst, kommst du nicht mehr an deine Daten in der Cloud.',
                  },
                  {
                    text: 'Öffne die App und sage auf dem ersten Bildschirm, dass du die Website schon benutzt. Füge dann den Code ein.',
                  },
                ],
                note: `Deine Noten liegen auf der Adresse, auf der du sie eingetragen hast. Hast du bisher ${OLD_SITE} benutzt, erstelle den Code dort.`,
              },
              {
                title: 'Du bist neu',
                steps: [
                  {
                    text: 'Öffne die App und sage auf dem ersten Bildschirm, dass du die Website noch nicht benutzt. Richte dein Profil ein und erstelle deinen Code.',
                  },
                ],
              },
            ],
          },
          {
            id: 'file',
            title: 'Ohne Code: Export und Import',
            intro: 'Das ist eine einmalige Kopie. Danach bleiben Website und App nicht auf dem gleichen Stand: Eine neue Note erscheint nur dort, wo du sie eingetragen hast.',
            groups: [
              {
                steps: [
                  {
                    text: `Öffne auf der Website das Menü und tippe unter **${de.data}** auf **${de.export}**. Die Datei landet in deinen Downloads.`,
                  },
                  {
                    text: 'Importiere die Datei in der App, beim ersten Start oder später in den Einstellungen. Das ersetzt die Daten in der App.',
                  },
                ],
              },
            ],
          },
          {
            id: 'old-install',
            title: 'Alte Website auf dem Home-Bildschirm',
            intro: 'Hast du die Website früher auf den Home-Bildschirm gelegt? Sie funktioniert weiter. Du kannst sie entfernen, sobald deine Daten in der App sind.',
            groups: [
              {
                steps: [
                  { text: 'Prüfe zuerst, ob alle deine Noten in der App sind.' },
                  { text: 'Halte das alte Symbol gedrückt und wähle **Deinstallieren** oder **Entfernen**.' },
                ],
              },
            ],
          },
        ],
      },
      iphone: {
        intro: 'Für das iPhone gibt es keine App. Du kannst die Website aber auf den Home-Bildschirm legen, dann öffnet sie sich wie eine App.',
        warning: 'Wichtig: Der Home-Bildschirm und Safari speichern getrennt. Erstelle deshalb zuerst in Safari einen Zugangscode, sonst scheinen deine Noten verschwunden zu sein.',
        leaves: [
          {
            id: 'home-screen',
            title: 'Auf den Home-Bildschirm legen',
            intro: 'Folge den Schritten in dieser Reihenfolge.',
            groups: [
              {
                steps: [
                  {
                    text: `Öffne ${SITE} in Safari und dort das Menü oben rechts. Tippe unter **${de.cloudSync}** auf **${de.cloudCreateCode}**. Bist du schon angemeldet, tippe auf **${de.cloudCopyCode}**. Bist du neu, richte zuerst dein Profil ein.`,
                  },
                  {
                    text: 'Bewahre den Code gut auf. Wenn du ihn verlierst, kommst du nicht mehr an deine Daten in der Cloud.',
                  },
                  {
                    text: `Tippe auf ${SITE} in Safari auf **Teilen** (das Quadrat mit dem Pfeil; siehst du es nicht, tippe zuerst auf die drei Punkte). Wähle **Zum Home-Bildschirm** und tippe auf **Hinzufügen**.`,
                  },
                  {
                    text: 'Öffne **Bestanden** auf dem Home-Bildschirm. Es beginnt leer, das ist normal.',
                  },
                  {
                    text: `Tippe auf **${de.cloudHaveCode}** und gib deinen Code ein. Deine Noten erscheinen. Dein Name bleibt nur auf deinem Gerät, darum fragt die Website vielleicht noch einmal danach.`,
                  },
                ],
                note: `Deine Noten liegen auf der Adresse, auf der du sie eingetragen hast. Hast du bisher ${OLD_SITE} benutzt, erstelle den Code dort.`,
              },
            ],
          },
          {
            id: 'file',
            title: 'Ohne Code: Export und Import',
            intro: 'Das ist eine einmalige Kopie. Danach bleiben Safari und Home-Bildschirm nicht auf dem gleichen Stand: Eine neue Note erscheint nur dort, wo du sie eingetragen hast.',
            groups: [
              {
                steps: [
                  {
                    text: `Öffne die Website in Safari und dort das Menü. Tippe unter **${de.data}** auf **${de.export}** und sichere die Datei in der App Dateien.`,
                  },
                  {
                    text: 'Lege die Website auf den Home-Bildschirm, wie oben beschrieben, und öffne sie dort. Richte dein Profil ein.',
                  },
                  {
                    text: `Öffne das Menü, tippe unter **${de.data}** auf **${de.import}** und wähle die Datei. Das ersetzt die Daten dort.`,
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  },
  fr: {
    menuTitle: 'App',
    menuEntry: "Guide de l'app",
    backToGrades: 'Vers mes notes',
    title: 'Bestanden sur ton téléphone',
    lede: 'Choisis ton téléphone et suis les étapes dans l\'ordre.',
    sections: {
      android: {
        intro: 'Il existe une app pour Android. Elle fonctionne aussi sans internet et elle est gratuite.',
        leaves: [
          {
            id: 'install',
            title: "Installer l'app",
            intro: "Il te faut Android 8 ou plus récent. L'app n'est pas dans le Play Store : tu la télécharges directement depuis notre page de téléchargement.",
            groups: [
              {
                title: 'Avec Obtainium (recommandé)',
                intro: 'Obtainium est une petite app qui installe Bestanden et le garde à jour.',
                steps: [
                  {
                    text: "Installe Obtainium : télécharge **app-arm64-v8a-release.apk** (convient à presque tous les téléphones récents) et ouvre le fichier. Si Android demande si ton navigateur peut installer des apps, autorise-le.",
                    link: { href: OBTAINIUM_DOWNLOAD, label: 'Télécharger Obtainium' },
                  },
                  {
                    text: "Sur ce téléphone, touche le bouton. Obtainium s'ouvre avec l'adresse de Bestanden déjà remplie. Touche alors **Ajouter** (Add).",
                    link: { href: OBTAINIUM_ADD_LINK, label: 'Ajouter à Obtainium', primary: true },
                  },
                  {
                    text: "Touche **Installer** (Install). La première fois, Android demande si Obtainium peut installer des apps. Autorise-le.",
                  },
                  {
                    text: 'Ouvre Bestanden. Les nouvelles versions apparaîtront dans Obtainium.',
                  },
                ],
              },
              {
                title: "Si Obtainium ne s'ouvre pas",
                steps: [
                  {
                    text: 'Dans Obtainium, touche **Ajouter une app** (Add app), colle cette adresse et touche **Ajouter** (Add).',
                    copy: RELEASE_REPO,
                  },
                ],
              },
              {
                title: 'À la main',
                intro: 'Ça marche aussi sans Obtainium, mais tu devras installer chaque mise à jour toi-même.',
                steps: [
                  {
                    text: 'Ouvre la dernière version et télécharge **bestanden-…apk**.',
                    link: { href: LATEST_RELEASE, label: 'Ouvrir la dernière version' },
                  },
                  {
                    text: 'Ouvre le fichier. Si Android demande si ton navigateur peut installer des apps, autorise-le.',
                  },
                ],
              },
            ],
          },
          {
            id: 'code',
            title: "Récupérer tes notes dans l'app",
            intro: "Le mieux, c'est avec un code d'accès : le site et l'app restent alors à jour tout seuls.",
            groups: [
              {
                title: 'Tu utilises déjà le site',
                steps: [
                  {
                    text: `Ouvre ${SITE}, puis le menu en haut à droite. Sous **${fr.cloudSync}**, touche **${fr.cloudCreateCode}**. Si tu es déjà connecté·e, touche **${fr.cloudCopyCode}**.`,
                  },
                  {
                    text: "Garde bien ce code. Si tu le perds, tu n'as plus accès à tes données dans le cloud.",
                  },
                  {
                    text: "Ouvre l'app et indique sur le premier écran que tu utilises déjà le site. Colle ensuite le code.",
                  },
                ],
                note: `Tes notes restent sur l'adresse où tu les as saisies. Si tu utilisais jusqu'ici ${OLD_SITE}, crée le code là-bas.`,
              },
              {
                title: 'Tu es nouveau ou nouvelle',
                steps: [
                  {
                    text: "Ouvre l'app et indique sur le premier écran que tu n'utilises pas encore le site. Configure ton profil et crée ton code.",
                  },
                ],
              },
            ],
          },
          {
            id: 'file',
            title: 'Sans code : exporter et importer',
            intro: "C'est une copie unique. Ensuite, le site et l'app ne restent pas synchronisés : une nouvelle note n'apparaît que là où tu l'as saisie.",
            groups: [
              {
                steps: [
                  {
                    text: `Sur le site, ouvre le menu et, sous **${fr.data}**, touche **${fr.export}**. Le fichier arrive dans tes téléchargements.`,
                  },
                  {
                    text: "Importe le fichier dans l'app, au premier démarrage ou plus tard dans les paramètres. Cela remplace les données de l'app.",
                  },
                ],
              },
            ],
          },
          {
            id: 'old-install',
            title: "L'ancien site sur l'écran d'accueil",
            intro: "Tu as ajouté le site à ton écran d'accueil ? Il continue de fonctionner. Tu peux le retirer dès que tes données sont dans l'app.",
            groups: [
              {
                steps: [
                  { text: "Vérifie d'abord que toutes tes notes sont dans l'app." },
                  { text: "Maintiens l'ancienne icône et choisis **Désinstaller** ou **Supprimer**." },
                ],
              },
            ],
          },
        ],
      },
      iphone: {
        intro: "Il n'y a pas d'app pour iPhone. Tu peux toutefois ajouter le site à ton écran d'accueil : il s'ouvre alors comme une app.",
        warning: "Important : l'écran d'accueil et Safari enregistrent séparément. Crée donc d'abord un code d'accès dans Safari, sinon tes notes sembleront avoir disparu.",
        leaves: [
          {
            id: 'home-screen',
            title: "Ajouter à l'écran d'accueil",
            intro: 'Suis les étapes dans cet ordre.',
            groups: [
              {
                steps: [
                  {
                    text: `Ouvre ${SITE} dans Safari, puis le menu en haut à droite. Sous **${fr.cloudSync}**, touche **${fr.cloudCreateCode}**. Si tu es déjà connecté·e, touche **${fr.cloudCopyCode}**. Si tu es nouveau ou nouvelle, configure d'abord ton profil.`,
                  },
                  {
                    text: "Garde bien ce code. Si tu le perds, tu n'as plus accès à tes données dans le cloud.",
                  },
                  {
                    text: `Sur ${SITE} dans Safari, touche **Partager** (le carré avec la flèche ; si tu ne le vois pas, touche d'abord les trois points). Choisis **Sur l'écran d'accueil** puis touche **Ajouter**.`,
                  },
                  {
                    text: "Ouvre **Bestanden** depuis l'écran d'accueil. Il démarre vide, c'est normal.",
                  },
                  {
                    text: `Touche **${fr.cloudHaveCode}** et saisis ton code. Tes notes apparaissent. Ton nom reste uniquement sur ton appareil : le site peut donc te le redemander.`,
                  },
                ],
                note: `Tes notes restent sur l'adresse où tu les as saisies. Si tu utilisais jusqu'ici ${OLD_SITE}, crée le code là-bas.`,
              },
            ],
          },
          {
            id: 'file',
            title: 'Sans code : exporter et importer',
            intro: "C'est une copie unique. Ensuite, Safari et l'écran d'accueil ne restent pas synchronisés : une nouvelle note n'apparaît que là où tu l'as saisie.",
            groups: [
              {
                steps: [
                  {
                    text: `Ouvre le site dans Safari, puis le menu. Sous **${fr.data}**, touche **${fr.export}** et enregistre le fichier dans l'app Fichiers.`,
                  },
                  {
                    text: "Ajoute le site à l'écran d'accueil comme expliqué plus haut et ouvre-le depuis là. Configure ton profil.",
                  },
                  {
                    text: `Ouvre le menu, touche **${fr.import}** sous **${fr.data}** et choisis le fichier. Cela remplace les données à cet endroit.`,
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  },
  en: {
    menuTitle: 'App',
    menuEntry: 'App guide',
    backToGrades: 'To my grades',
    title: 'Bestanden on your phone',
    lede: 'Choose your phone and follow the steps in order.',
    sections: {
      android: {
        intro: 'There is an app for Android. It also works without internet, and it is free.',
        leaves: [
          {
            id: 'install',
            title: 'Install the app',
            intro: "You need Android 8 or newer. The app isn't in the Play Store; you get it straight from our download page.",
            groups: [
              {
                title: 'With Obtainium (recommended)',
                intro: 'Obtainium is a small app that installs Bestanden and keeps it up to date.',
                steps: [
                  {
                    text: 'Install Obtainium: download **app-arm64-v8a-release.apk** (it fits almost every recent phone) and open the file. If Android asks whether your browser may install apps, allow it.',
                    link: { href: OBTAINIUM_DOWNLOAD, label: 'Download Obtainium' },
                  },
                  {
                    text: "On this phone, tap the button. Obtainium opens with Bestanden's address already filled in. Tap **Add** there.",
                    link: { href: OBTAINIUM_ADD_LINK, label: 'Add to Obtainium', primary: true },
                  },
                  {
                    text: 'Tap **Install**. The first time, Android asks whether Obtainium may install apps. Allow it.',
                  },
                  {
                    text: 'Open Bestanden. New versions will show up in Obtainium.',
                  },
                ],
              },
              {
                title: "If Obtainium doesn't open",
                steps: [
                  {
                    text: 'In Obtainium, tap **Add app**, paste this address and tap **Add**.',
                    copy: RELEASE_REPO,
                  },
                ],
              },
              {
                title: 'By hand',
                intro: "It also works without Obtainium, but you'll have to install every update yourself.",
                steps: [
                  {
                    text: 'Open the latest version and download **bestanden-…apk**.',
                    link: { href: LATEST_RELEASE, label: 'Open latest version' },
                  },
                  {
                    text: 'Open the file. If Android asks whether your browser may install apps, allow it.',
                  },
                ],
              },
            ],
          },
          {
            id: 'code',
            title: 'Get your grades into the app',
            intro: 'An access code is the best way. The website and the app then stay up to date by themselves.',
            groups: [
              {
                title: 'You already use the website',
                steps: [
                  {
                    text: `Open ${SITE}, then the menu at the top right. Under **${en.cloudSync}**, tap **${en.cloudCreateCode}**. If you're already logged in, tap **${en.cloudCopyCode}**.`,
                  },
                  {
                    text: "Keep the code safe. If you lose it, you can't get to your data in the cloud any more.",
                  },
                  {
                    text: 'Open the app and say on the first screen that you already use the website. Then paste the code.',
                  },
                ],
                note: `Your grades stay on the address where you entered them. If you have been using ${OLD_SITE}, create the code there.`,
              },
              {
                title: "You're new",
                steps: [
                  {
                    text: "Open the app and say on the first screen that you don't use the website yet. Set up your profile and create your code.",
                  },
                ],
              },
            ],
          },
          {
            id: 'file',
            title: 'Without a code: export and import',
            intro: "This is a one-time copy. Afterwards the website and the app don't stay in step: a new grade only appears where you entered it.",
            groups: [
              {
                steps: [
                  {
                    text: `On the website, open the menu and, under **${en.data}**, tap **${en.export}**. The file lands in your downloads.`,
                  },
                  {
                    text: 'Import the file in the app, at first start or later in the settings. This replaces the data in the app.',
                  },
                ],
              },
            ],
          },
          {
            id: 'old-install',
            title: 'The old website on your home screen',
            intro: 'Did you add the website to your home screen earlier? It keeps working. You can remove it once your data is in the app.',
            groups: [
              {
                steps: [
                  { text: 'First check that all your grades are in the app.' },
                  { text: 'Press and hold the old icon and choose **Uninstall** or **Remove**.' },
                ],
              },
            ],
          },
        ],
      },
      iphone: {
        intro: "There is no app for iPhone. You can add the website to your home screen instead, and it then opens like an app.",
        warning: "Important: the home screen and Safari store data separately. So create an access code in Safari first, or your grades will seem to have vanished.",
        leaves: [
          {
            id: 'home-screen',
            title: 'Add to your home screen',
            intro: 'Follow the steps in this order.',
            groups: [
              {
                steps: [
                  {
                    text: `Open ${SITE} in Safari, then the menu at the top right. Under **${en.cloudSync}**, tap **${en.cloudCreateCode}**. If you're already logged in, tap **${en.cloudCopyCode}**. If you're new, set up your profile first.`,
                  },
                  {
                    text: "Keep the code safe. If you lose it, you can't get to your data in the cloud any more.",
                  },
                  {
                    text: `On ${SITE} in Safari, tap **Share** (the square with the arrow; if you don't see it, tap the three dots first). Choose **Add to Home Screen** and tap **Add**.`,
                  },
                  {
                    text: "Open **Bestanden** from your home screen. It starts empty; that's normal.",
                  },
                  {
                    text: `Tap **${en.cloudHaveCode}** and enter your code. Your grades appear. Your name stays only on your device, so the website may ask for it again.`,
                  },
                ],
                note: `Your grades stay on the address where you entered them. If you have been using ${OLD_SITE}, create the code there.`,
              },
            ],
          },
          {
            id: 'file',
            title: 'Without a code: export and import',
            intro: "This is a one-time copy. Afterwards Safari and the home screen don't stay in step: a new grade only appears where you entered it.",
            groups: [
              {
                steps: [
                  {
                    text: `Open the website in Safari, then the menu. Under **${en.data}**, tap **${en.export}** and save the file in the Files app.`,
                  },
                  {
                    text: 'Add the website to your home screen as described above and open it from there. Set up your profile.',
                  },
                  {
                    text: `Open the menu, tap **${en.import}** under **${en.data}** and choose the file. This replaces the data there.`,
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  },
  it: {
    menuTitle: 'App',
    menuEntry: "Guida all'app",
    backToGrades: 'Ai miei voti',
    title: 'Bestanden sul telefono',
    lede: 'Scegli il tuo telefono e segui i passaggi in ordine.',
    sections: {
      android: {
        intro: "Per Android c'è un'app. Funziona anche senza internet ed è gratuita.",
        leaves: [
          {
            id: 'install',
            title: "Installare l'app",
            intro: "Ti serve Android 8 o più recente. L'app non è nel Play Store: la scarichi direttamente dalla nostra pagina di download.",
            groups: [
              {
                title: 'Con Obtainium (consigliato)',
                intro: "Obtainium è una piccola app che installa Bestanden e lo tiene aggiornato.",
                steps: [
                  {
                    text: 'Installa Obtainium: scarica **app-arm64-v8a-release.apk** (va bene per quasi tutti i telefoni recenti) e apri il file. Se Android chiede se il browser può installare app, consentilo.',
                    link: { href: OBTAINIUM_DOWNLOAD, label: 'Scarica Obtainium' },
                  },
                  {
                    text: "Su questo telefono, tocca il pulsante. Obtainium si apre con l'indirizzo di Bestanden già inserito. Lì tocca **Aggiungi** (Add).",
                    link: { href: OBTAINIUM_ADD_LINK, label: 'Aggiungi a Obtainium', primary: true },
                  },
                  {
                    text: 'Tocca **Installa** (Install). La prima volta Android chiede se Obtainium può installare app. Consentilo.',
                  },
                  {
                    text: 'Apri Bestanden. Le nuove versioni appariranno in Obtainium.',
                  },
                ],
              },
              {
                title: 'Se Obtainium non si apre',
                steps: [
                  {
                    text: 'In Obtainium tocca **Aggiungi app** (Add app), incolla questo indirizzo e tocca **Aggiungi** (Add).',
                    copy: RELEASE_REPO,
                  },
                ],
              },
              {
                title: 'A mano',
                intro: 'Funziona anche senza Obtainium, ma dovrai installare ogni aggiornamento da solo o da sola.',
                steps: [
                  {
                    text: "Apri l'ultima versione e scarica **bestanden-…apk**.",
                    link: { href: LATEST_RELEASE, label: "Apri l'ultima versione" },
                  },
                  {
                    text: 'Apri il file. Se Android chiede se il browser può installare app, consentilo.',
                  },
                ],
              },
            ],
          },
          {
            id: 'code',
            title: "Portare i voti nell'app",
            intro: "Il modo migliore è un codice di accesso: il sito e l'app restano aggiornati da soli.",
            groups: [
              {
                title: 'Usi già il sito',
                steps: [
                  {
                    text: `Apri ${SITE} e poi il menu in alto a destra. Sotto **${it.cloudSync}** tocca **${it.cloudCreateCode}**. Se hai già effettuato l'accesso, tocca **${it.cloudCopyCode}**.`,
                  },
                  {
                    text: 'Conserva bene il codice. Se lo perdi, non puoi più accedere ai tuoi dati nel cloud.',
                  },
                  {
                    text: "Apri l'app e indica nella prima schermata che usi già il sito. Poi incolla il codice.",
                  },
                ],
                note: `I tuoi voti restano sull'indirizzo dove li hai inseriti. Se finora hai usato ${OLD_SITE}, crea il codice lì.`,
              },
              {
                title: 'Sei nuovo o nuova',
                steps: [
                  {
                    text: "Apri l'app e indica nella prima schermata che non usi ancora il sito. Configura il tuo profilo e crea il tuo codice.",
                  },
                ],
              },
            ],
          },
          {
            id: 'file',
            title: 'Senza codice: esportare e importare',
            intro: "È una copia unica. In seguito il sito e l'app non restano allineati: un nuovo voto appare solo dove l'hai inserito.",
            groups: [
              {
                steps: [
                  {
                    text: `Sul sito apri il menu e, sotto **${it.data}**, tocca **${it.export}**. Il file finisce nei tuoi download.`,
                  },
                  {
                    text: "Importa il file nell'app, al primo avvio o più tardi nelle impostazioni. Questo sostituisce i dati nell'app.",
                  },
                ],
              },
            ],
          },
          {
            id: 'old-install',
            title: 'Il vecchio sito nella schermata Home',
            intro: "Avevi aggiunto il sito alla schermata Home? Continua a funzionare. Puoi rimuoverlo appena i tuoi dati sono nell'app.",
            groups: [
              {
                steps: [
                  { text: "Controlla prima che tutti i tuoi voti siano nell'app." },
                  { text: "Tieni premuta la vecchia icona e scegli **Disinstalla** o **Rimuovi**." },
                ],
              },
            ],
          },
        ],
      },
      iphone: {
        intro: "Per iPhone non c'è un'app. Puoi però aggiungere il sito alla schermata Home: si apre poi come un'app.",
        warning: 'Importante: la schermata Home e Safari salvano i dati separatamente. Crea quindi prima un codice di accesso in Safari, altrimenti i tuoi voti sembreranno spariti.',
        leaves: [
          {
            id: 'home-screen',
            title: 'Aggiungere alla schermata Home',
            intro: 'Segui i passaggi in questo ordine.',
            groups: [
              {
                steps: [
                  {
                    text: `Apri ${SITE} in Safari e poi il menu in alto a destra. Sotto **${it.cloudSync}** tocca **${it.cloudCreateCode}**. Se hai già effettuato l'accesso, tocca **${it.cloudCopyCode}**. Se sei nuovo o nuova, configura prima il tuo profilo.`,
                  },
                  {
                    text: 'Conserva bene il codice. Se lo perdi, non puoi più accedere ai tuoi dati nel cloud.',
                  },
                  {
                    text: `Su ${SITE} in Safari tocca **Condividi** (il quadrato con la freccia; se non lo vedi, tocca prima i tre puntini). Scegli **Aggiungi alla schermata Home** e tocca **Aggiungi**.`,
                  },
                  {
                    text: 'Apri **Bestanden** dalla schermata Home. Parte vuoto, è normale.',
                  },
                  {
                    text: `Tocca **${it.cloudHaveCode}** e inserisci il codice. I tuoi voti appaiono. Il tuo nome resta solo sul tuo dispositivo, quindi il sito potrebbe chiederlo di nuovo.`,
                  },
                ],
                note: `I tuoi voti restano sull'indirizzo dove li hai inseriti. Se finora hai usato ${OLD_SITE}, crea il codice lì.`,
              },
            ],
          },
          {
            id: 'file',
            title: 'Senza codice: esportare e importare',
            intro: 'È una copia unica. In seguito Safari e la schermata Home non restano allineati: un nuovo voto appare solo dove l\'hai inserito.',
            groups: [
              {
                steps: [
                  {
                    text: `Apri il sito in Safari e poi il menu. Sotto **${it.data}** tocca **${it.export}** e salva il file nell'app File.`,
                  },
                  {
                    text: 'Aggiungi il sito alla schermata Home come descritto sopra e aprilo da lì. Configura il tuo profilo.',
                  },
                  {
                    text: `Apri il menu, tocca **${it.import}** sotto **${it.data}** e scegli il file. Questo sostituisce i dati lì.`,
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  },
};
