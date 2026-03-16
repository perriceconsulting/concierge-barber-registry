#!/usr/bin/env node
/**
 * Pre-dev setup script
 * - Cleans stale Next.js dev lock file
 * - Cleans stale Prisma engine DLL (Windows lock issue)
 * - Regenerates Prisma client with retry logic
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');

function log(msg) {
  console.log(`[predev] ${msg}`);
}

function sleep(ms) {
  execSync(`node -e "setTimeout(()=>{},${ms})"`);
}

// 1. Remove stale Next.js dev lock file
const lockFile = path.join(root, '.next', 'dev', 'lock');
if (fs.existsSync(lockFile)) {
  log('Removing stale .next/dev/lock...');
  try { fs.unlinkSync(lockFile); } catch { /* ignore */ }
}

// 2. Kill processes locking the Prisma DLL (tsserver, node instances)
const dllPath = path.join(root, 'node_modules', '.prisma', 'client', 'query_engine-windows.dll.node');
if (fs.existsSync(dllPath)) {
  log('Clearing Prisma engine DLL lock...');
  // Try to rename it first — if it works, the file isn't locked
  const tmpPath = dllPath + '.old';
  try {
    fs.renameSync(dllPath, tmpPath);
    fs.unlinkSync(tmpPath);
    log('DLL removed.');
  } catch {
    // File is locked — try to force release by deleting the .prisma/client directory contents
    log('DLL is locked by another process. Attempting workaround...');
    try {
      // On Windows, use robocopy trick to clear — or just remove the whole directory
      execSync('rmdir /s /q "node_modules\\.prisma\\client"', { cwd: root, stdio: 'ignore', shell: 'cmd.exe' });
      log('Cleared .prisma/client directory.');
    } catch {
      log('Warning: Could not clear locked DLL. Prisma generate may fail.');
    }
  }
}

// 3. Generate Prisma client (with retry)
log('Generating Prisma client...');
let attempts = 0;
const maxAttempts = 3;

while (attempts < maxAttempts) {
  attempts++;
  try {
    execSync('npx prisma generate', { cwd: root, stdio: 'inherit' });
    log('Prisma client ready.');
    break;
  } catch (e) {
    if (attempts < maxAttempts) {
      log(`Attempt ${attempts} failed, retrying in 2s...`);
      sleep(2000);
    } else {
      console.error(`[predev] Prisma generate failed after ${maxAttempts} attempts.`);
      console.error('[predev] Try closing VS Code, running the command, then reopening VS Code.');
      process.exit(1);
    }
  }
}

log('Ready to start dev server.');
