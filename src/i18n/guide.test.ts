import { describe, expect, it } from 'vitest';
import { guideText, OBTAINIUM_ADD_LINK } from './guide';
import type { GuideText } from './guide';

const languages = ['de', 'fr', 'en', 'it'] as const;

// Every sentence of a language's guide, as one string
const allText = (text: GuideText) => JSON.stringify(text);

// What must match between translations: the blocks, their order and their links
const shape = (text: GuideText) =>
  (['android', 'iphone'] as const).map((id) =>
    text.sections[id].leaves.map((leaf) => ({
      id: leaf.id,
      groups: leaf.groups.map((group) => ({
        hasTitle: Boolean(group.title),
        hasNote: Boolean(group.note),
        steps: group.steps.map((step) => ({ link: step.link?.href, copy: step.copy })),
      })),
    })),
  );

describe('the app guide', () => {
  it('has the same blocks, steps and links in every language', () => {
    for (const language of languages) {
      expect(shape(guideText[language])).toEqual(shape(guideText.de));
    }
  });

  it('leaves no sentence empty in any language', () => {
    const blank = (value: unknown): boolean =>
      typeof value === 'string'
        ? value.trim() === ''
        : typeof value === 'object' && value !== null && Object.values(value).some(blank);
    for (const language of languages) {
      expect(blank(guideText[language])).toBe(false);
    }
  });

  it('writes German the Swiss way, without ß', () => {
    expect(allText(guideText.de)).not.toContain('ß');
  });

  it('offers the one-tap Obtainium link on the Android side', () => {
    expect(OBTAINIUM_ADD_LINK).toBe('obtainium://add/https://github.com/cbrasser/bestanden-releases');
    for (const language of languages) {
      const links = guideText[language].sections.android.leaves
        .flatMap((leaf) => leaf.groups)
        .flatMap((group) => group.steps)
        .map((step) => step.link?.href);
      expect(links).toContain(OBTAINIUM_ADD_LINK);
    }
  });

  it('sends iPhone students to Safari for their code before the home screen', () => {
    for (const language of languages) {
      const steps = guideText[language].sections.iphone.leaves[0].groups[0].steps.map((step) => step.text);
      expect(steps[0]).toContain('Safari');
      const homeScreenStep = steps.findIndex((text) => text.includes(homeScreenLabel[language]));
      expect(homeScreenStep).toBeGreaterThan(0);
    }
  });

  it('names the primary address and the old one, whose grades are stored apart', () => {
    for (const language of languages) {
      expect(allText(guideText[language])).toContain('bestandenfms.cbradev.ch');
      expect(allText(guideText[language])).toContain('bestandenfmsneufeld.vercel.app');
    }
  });

  it('has the blocks the spec asks for on each phone', () => {
    for (const language of languages) {
      const { android, iphone } = guideText[language].sections;
      expect(android.leaves.map((leaf) => leaf.id)).toEqual(['install', 'code', 'file', 'old-install']);
      expect(iphone.leaves.map((leaf) => leaf.id)).toEqual(['home-screen', 'file']);
    }
  });

  it('calls export and import a one-time copy on both phones', () => {
    for (const language of languages) {
      for (const section of ['android', 'iphone'] as const) {
        const file = guideText[language].sections[section].leaves.find((leaf) => leaf.id === 'file');
        expect(file?.intro).toContain(oneTimeCopy[language]);
      }
    }
  });

  it('says an old Android home-screen install can be removed once the data is in the app', () => {
    for (const language of languages) {
      const old = guideText[language].sections.android.leaves.find((leaf) => leaf.id === 'old-install');
      expect(old?.intro).toContain(canRemove[language]);
    }
  });
});

// Safari's own wording for the menu item, per language
const homeScreenLabel = {
  de: 'Zum Home-Bildschirm',
  fr: "Sur l'écran d'accueil",
  en: 'Add to Home Screen',
  it: 'Aggiungi alla schermata Home',
} as const;

const oneTimeCopy = {
  de: 'einmalige Kopie',
  fr: 'copie unique',
  en: 'one-time copy',
  it: 'copia unica',
} as const;

const canRemove = {
  de: 'Du kannst sie entfernen, sobald deine Daten in der App sind',
  fr: "Tu peux le retirer dès que tes données sont dans l'app",
  en: 'You can remove it once your data is in the app',
  it: "Puoi rimuoverlo appena i tuoi dati sono nell'app",
} as const;
