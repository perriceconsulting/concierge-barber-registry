module.exports = {
  // Run type-check on changed TypeScript files
  '**/*.ts?(x)': () => 'tsc --noEmit',

  // Run ESLint on changed files
  '**/*.(ts|tsx|js)': (filenames) => [
    `eslint ${filenames.join(' ')}`,
  ],

  // Run tests related to changed files
  '**/*.(ts|tsx)': (filenames) => {
    const testFiles = filenames
      .map(file => file.replace(/\\/g, '/'))
      .filter(file => !file.includes('__tests__'))
      .map(file => `--findRelatedTests ${file}`)
      .join(' ');

    return `jest ${testFiles}`;
  },
};
