// One matcher per language, not three overlapping ones.
//
// This previously declared three separate globs that all matched the same .ts
// files ('**/*.ts?(x)', '**/*.(ts|tsx|js)', '**/*.(ts|tsx)'). lint-staged runs
// *matchers* concurrently, so a full `tsc --noEmit` and a jest worker pool
// started at the same time and collided — the SIGKILL that made this hook
// unusable on Windows and forced --no-verify on every commit. Commands inside
// a single matcher run in sequence, so collapsing them fixes it without
// dropping any check.
module.exports = {
  '**/*.{ts,tsx}': (filenames) => {
    const posix = filenames.map((file) => file.replace(/\\/g, '/'));

    // Test files don't need related-test discovery run against themselves.
    const related = posix
      .filter((file) => !file.includes('__tests__'))
      .map((file) => `--findRelatedTests "${file}"`)
      .join(' ');

    return [
      'tsc --noEmit',
      `eslint ${filenames.map((file) => `"${file}"`).join(' ')}`,
      // The integration suites used to be excluded here because they could not
      // run at all. They run now (node environment, see jest.config.js), so
      // related tests in either project are fair game.
      ...(related ? [`jest ${related} --passWithNoTests`] : []),
    ];
  },

  '**/*.js': (filenames) => [
    `eslint ${filenames.map((file) => `"${file}"`).join(' ')}`,
  ],
};
