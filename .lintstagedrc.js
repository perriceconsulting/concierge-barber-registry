module.exports = {
  // Run type-check on changed TypeScript files
  '**/*.ts?(x)': () => 'tsc --noEmit',

  // Run ESLint on changed files
  '**/*.(ts|tsx|js)': (filenames) => [
    `eslint ${filenames.map(f => `"${f}"`).join(' ')}`,
  ],

  // Run tests related to changed files (exclude integration/e2e tests that have ESM issues)
  '**/*.(ts|tsx)': (filenames) => {
    const testFiles = filenames
      .map(file => file.replace(/\\/g, '/'))
      .filter(file => !file.includes('__tests__'))
      .filter(file => !file.includes('e2e/'))
      .filter(file => !file.includes('playwright'))
      .map(file => `--findRelatedTests "${file}"`)
      .join(' ');

    // Only run jest if there are files to test
    if (!testFiles) return [];

    return `jest ${testFiles} --testPathIgnorePatterns="integration|e2e" --passWithNoTests`;
  },
};
