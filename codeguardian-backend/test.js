const { runAnalysis } = require('./src/agent/orchestrator');

async function test() {
  try {
    const prUrl = 'https://github.com/K-Ishwar/K-Ishwar-CodeGuardian-AI-test/pull/1';
    console.log('Testing PR:', prUrl);
    await runAnalysis(prUrl, 'manual');
    console.log('Analysis done.');
  } catch (e) {
    console.error('Unhandled error:', e);
  }
}

test();
