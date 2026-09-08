import fs from 'node:fs';
const report = JSON.parse(fs.readFileSync('/tmp/admin-vitest.json', 'utf8'));
for (const file of report.testResults ?? []) {
  if (file.status !== 'passed') {
    console.log(`FILE ${file.name} STATUS ${file.status}`);
    for (const assertion of file.assertionResults ?? []) {
      if (assertion.status === 'failed') {
        console.log(`  TEST ${assertion.fullName}`);
        for (const failure of assertion.failureMessages ?? []) console.log(`    ${failure.split('\n').slice(0, 8).join('\n    ')}`);
      }
    }
  }
}
console.log(`SUMMARY files=${report.numFailedTestSuites ?? '?'} failed_suites tests_failed=${report.numFailedTests ?? '?'}`);
