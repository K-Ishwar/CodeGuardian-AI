/**
 * CodeGuardian AI — End-to-End Manual Test
 * Run: node src/test-manual.js  (server must be running on port 3001)
 */
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const TEST_PR_URL = 'https://github.com/facebook/react/pull/31823';

async function runTests() {
  console.log('═══════════════════════════════════════════════');
  console.log('  CodeGuardian AI — End-to-End Backend Test');
  console.log('═══════════════════════════════════════════════\n');

  // ─────────────────────────────────────────────
  // TEST 1 — POST /analyze
  // ─────────────────────────────────────────────
  console.log('▶ TEST 1: POST /analyze');
  console.log(`  PR URL : ${TEST_PR_URL}\n`);

  try {
    const startTime = Date.now();

    const response = await axios.post(
      `${BASE_URL}/analyze`,
      { prUrl: TEST_PR_URL },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    const result = response.data;

    console.log(`  ✅ Response received in ${elapsed}s (HTTP ${response.status})\n`);
    console.log('─── Full Review Object ───────────────────────');
    console.log(JSON.stringify(result, null, 2));
    console.log('──────────────────────────────────────────────\n');

    // Print a quick summary
    console.log('  📊 Summary:');
    console.log(`     Status          : ${result.status}`);
    console.log(`     PR Title        : ${result.pr_title}`);
    console.log(`     Author          : ${result.author}`);
    console.log(`     Repository      : ${result.repository}`);
    console.log(`     Latency         : ${result.latency_seconds}s`);
    console.log(`     Total Issues    : ${result.metrics?.total_issues ?? 'N/A'}`);
    console.log(`     Hours Saved     : ${result.metrics?.hours_saved ?? 'N/A'}`);
    console.log(`     Financial Saved : $${result.metrics?.financial_saved ?? 'N/A'}`);
    console.log(`     Issues Found    : ${result.issues?.length ?? 0}\n`);

    if (result.issues && result.issues.length > 0) {
      console.log('  🔍 Issues:');
      result.issues.forEach((issue, i) => {
        const emoji =
          issue.severity === 'Critical' ? '🔴' :
          issue.severity === 'Moderate' ? '🟡' : '🟢';
        console.log(`     [${i + 1}] ${emoji} [${issue.severity}] ${issue.title}`);
        console.log(`         File    : ${issue.filename}`);
        console.log(`         Fix Time: ${issue.time_to_fix} min`);
        console.log(`         Details : ${issue.explanation}\n`);
      });
    }
  } catch (err) {
    console.error('  ❌ TEST 1 FAILED');
    if (err.response) {
      console.error('  HTTP Status :', err.response.status);
      console.error('  Error Body  :', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('  Error       :', err.message);
      console.error('  (Is the server running on port 3001?)');
    }
  }

  // ─────────────────────────────────────────────
  // TEST 2 — GET /reviews
  // ─────────────────────────────────────────────
  console.log('\n▶ TEST 2: GET /reviews');

  try {
    const response = await axios.get(`${BASE_URL}/reviews`);
    const reviews = response.data;

    console.log(`  ✅ HTTP ${response.status} — ${reviews.length} review(s) stored in memory\n`);

    if (reviews.length > 0) {
      console.log('  Recent reviews (newest first):');
      reviews.slice(0, 5).forEach((r, i) => {
        const emoji =
          r.status === 'Analyzed' ? '✅' :
          r.status === 'Processing' ? '⏳' : '❌';
        console.log(`     [${i + 1}] ${emoji} ${r.status} | ${r.repository} | Issues: ${r.metrics?.total_issues ?? '—'} | ${r.pr_title || '(no title yet)'}`);
      });
    }
  } catch (err) {
    console.error('  ❌ TEST 2 FAILED');
    if (err.response) {
      console.error('  HTTP Status :', err.response.status);
      console.error('  Error Body  :', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('  Error       :', err.message);
    }
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log('  Tests complete.');
  console.log('═══════════════════════════════════════════════\n');
}

runTests();
