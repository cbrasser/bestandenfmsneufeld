// Unambiguous characters (no 0/O, 1/I/L), so codes copied by hand have fewer typos
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** A cryptographically random code in canonical form: 16 characters, about 79 bits of entropy. */
export function generateCode(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

/** User input to canonical form: upper case, A-Z and 0-9 only. This form is what gets hashed. */
export function normalizeCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** Canonical code to display form, in groups of four (XXXX-XXXX-...). */
export function formatCode(code: string): string {
  return (code.match(/.{1,4}/g) ?? [code]).join('-');
}
