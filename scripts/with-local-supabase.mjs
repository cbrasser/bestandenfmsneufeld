#!/usr/bin/env node
// Gives a command exclusive use of the machine's one local Supabase stack: takes the lock, starts
// the stack, resets the database to this checkout's migrations, runs the command with the stack's
// values in its environment, and always releases the lock.
//
//   node scripts/with-local-supabase.mjs                 reset the database, print its values, exit
//   node scripts/with-local-supabase.mjs <command...>    same, then run the command under the lock
//   node scripts/with-local-supabase.mjs --stop          stop the stack
//
// Parallel worktrees share the stack and their migrations differ, so nothing may use it without
// holding the lock, and nothing may assume the database is unchanged after releasing it.

import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { constants, homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCK_DIR = path.join(homedir(), '.cache', 'bestanden-supabase.lock');
const OWNER_FILE = path.join(LOCK_DIR, 'owner.json');
const LOCK_WAIT_MS = 15 * 60 * 1000;
const LOCK_POLL_MS = 2000;
const API_WAIT_MS = 30 * 1000;
const CHILD_STOP_MS = 5 * 1000;
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]']);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const fail = (message) => {
  console.error(`[local-supabase] ${message}`);
  process.exit(1);
};

const readOwner = () => {
  try {
    return JSON.parse(readFileSync(OWNER_FILE, 'utf8'));
  } catch {
    return null; // the holder is between creating the directory and writing this file
  }
};

const isAlive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
};

let lockHeld = false;

const releaseLock = () => {
  if (!lockHeld) return;
  lockHeld = false;
  rmSync(LOCK_DIR, { recursive: true, force: true });
};

async function acquireLock() {
  mkdirSync(path.dirname(LOCK_DIR), { recursive: true });
  const deadline = Date.now() + LOCK_WAIT_MS;
  let announced = false;
  for (;;) {
    try {
      mkdirSync(LOCK_DIR); // atomic: exactly one process succeeds
      lockHeld = true;
      writeFileSync(OWNER_FILE, JSON.stringify({ pid: process.pid, cwd: ROOT, since: new Date().toISOString() }));
      return;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }

    const owner = readOwner();
    // Not broken automatically: two waiters doing so could each remove the other's fresh lock.
    if (owner && !isAlive(owner.pid)) {
      fail(`The lock was left behind by process ${owner.pid} (${owner.cwd}), which has ended. ` +
        `If no other session is using Supabase, remove it and try again: rm -r "${LOCK_DIR}"`);
    }
    if (Date.now() > deadline) {
      fail(`Gave up after ${LOCK_WAIT_MS / 60000} minutes waiting for the lock, held by ${JSON.stringify(owner)}.`);
    }
    if (!announced) {
      console.error(`[local-supabase] Waiting for the lock, held by ${JSON.stringify(owner)}`);
      announced = true;
    }
    await sleep(LOCK_POLL_MS);
  }
}

function supabase(...args) {
  const result = spawnSync('supabase', args, { cwd: ROOT, stdio: 'inherit' });
  if (result.error) fail(`Could not run supabase: ${result.error.message}`);
  if (result.status !== 0) fail(`"supabase ${args.join(' ')}" failed with exit code ${result.status}.`);
}

function readStackValues() {
  const result = spawnSync('supabase', ['status', '-o', 'env'], { cwd: ROOT, encoding: 'utf8' });
  if (result.status !== 0) fail(`"supabase status" failed: ${result.stderr}`);
  const values = Object.fromEntries(
    [...result.stdout.matchAll(/^([A-Z_]+)="?([^"\n]*)"?$/gm)].map(([, key, value]) => [key, value])
  );
  if (!values.API_URL || !values.ANON_KEY) fail('"supabase status" gave no API_URL or ANON_KEY.');
  // Everything downstream trusts these values, so never let them point anywhere but this machine.
  if (!LOOPBACK_HOSTS.has(new URL(values.API_URL).hostname)) fail(`Refusing a non-local API URL: ${values.API_URL}`);
  return values;
}

async function waitForApi({ API_URL, ANON_KEY }) {
  const deadline = Date.now() + API_WAIT_MS;
  for (;;) {
    try {
      const response = await fetch(`${API_URL}/rest/v1/`, { headers: { apikey: ANON_KEY } });
      if (response.status < 500) return;
    } catch {
      /* still restarting */
    }
    if (Date.now() > deadline) fail(`The API at ${API_URL} did not come up after the reset.`);
    await sleep(500);
  }
}

let child = null;

function runCommand([command, ...args], stack) {
  return new Promise((resolve) => {
    child = spawn(command, args, {
      cwd: ROOT,
      stdio: 'inherit',
      env: {
        ...process.env,
        // These win over any .env file, so a command can't reach a database named there.
        VITE_SUPABASE_URL: stack.API_URL,
        VITE_SUPABASE_ANON_KEY: stack.ANON_KEY,
        SUPABASE_DB_URL: stack.DB_URL,
      },
    });
    child.on('error', (error) => {
      console.error(`[local-supabase] Could not run ${command}: ${error.message}`);
      resolve(1);
    });
    child.on('exit', (code, signal) => resolve(code ?? 128 + (constants.signals[signal] ?? 0)));
  });
}

process.on('exit', releaseLock);
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(signal, () => {
    if (!child) process.exit(128 + constants.signals[signal]);
    // The lock must outlast the command, so the exit comes when the command has ended
    child.kill(signal);
    setTimeout(() => child.kill('SIGKILL'), CHILD_STOP_MS).unref();
  });
}

const command = process.argv.slice(2);
await acquireLock();

if (command[0] === '--stop') {
  supabase('stop');
  process.exit(0);
}

supabase('start');
supabase('db', 'reset');
const stack = readStackValues();
await waitForApi(stack);

if (command.length === 0) {
  console.log(`\nLocal Supabase is ready, with the migrations of ${ROOT}.`);
  console.log(`VITE_SUPABASE_URL=${stack.API_URL}`);
  console.log(`VITE_SUPABASE_ANON_KEY=${stack.ANON_KEY}`);
  process.exit(0);
}
process.exit(await runCommand(command, stack));
