import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const mailbox = new Map();
const file = join(dirname(fileURLToPath(import.meta.url)), '..', '.otp-dev.json');

function readFile() {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return {};
  }
}

export function storeDevOtp(email, otp, { quiet = false } = {}) {
  if (process.env.NODE_ENV === 'production') return;
  const key = String(email).toLowerCase();
  mailbox.set(key, otp);
  const current = readFile();
  current[key] = otp;
  writeFileSync(file, JSON.stringify(current));
  if (!quiet) console.info(`Password reset code for ${email}: ${otp}`);
}

export function readDevOtp(email) {
  if (process.env.NODE_ENV === 'production') return undefined;
  const key = String(email).toLowerCase();
  return mailbox.get(key) || readFile()[key];
}
