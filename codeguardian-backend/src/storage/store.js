const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

let dbPromise;

async function initDB() {
  if (!dbPromise) {
    dbPromise = open({
      filename: path.join(__dirname, 'reviews.db'),
      driver: sqlite3.Database,
    }).then(async (db) => {
      await db.exec(`
        CREATE TABLE IF NOT EXISTS reviews (
          id TEXT PRIMARY KEY,
          repository TEXT,
          pr_url TEXT,
          timestamp TEXT,
          status TEXT,
          data TEXT
        );
        CREATE TABLE IF NOT EXISTS rulesets (
          id TEXT PRIMARY KEY,
          rules TEXT
        );
      `);
      return db;
    });
  }
  return dbPromise;
}

async function addReview(review) {
  const db = await initDB();
  await db.run(
    'INSERT INTO reviews (id, repository, pr_url, timestamp, status, data) VALUES (?, ?, ?, ?, ?, ?)',
    [
      review.id,
      review.repository,
      review.pr_url,
      review.timestamp,
      review.status,
      JSON.stringify(review),
    ]
  );
  return review;
}

async function updateReview(id, updates) {
  const db = await initDB();
  const existing = await getReviewById(id);
  if (!existing) return null;

  const merged = { ...existing, ...updates };
  await db.run(
    'UPDATE reviews SET repository = ?, pr_url = ?, timestamp = ?, status = ?, data = ? WHERE id = ?',
    [
      merged.repository,
      merged.pr_url,
      merged.timestamp,
      merged.status,
      JSON.stringify(merged),
      id,
    ]
  );
  return merged;
}

async function getAllReviews(options = {}) {
  const db = await initDB();
  const { page = 1, limit = 50, repo = '', severity = '', userRepos = null } = options;

  let query = 'SELECT data FROM reviews WHERE 1=1';
  const params = [];

  if (repo) {
    query += ' AND repository = ?';
    params.push(repo);
  } else if (userRepos !== null) {
    if (userRepos.length === 0) {
      return { data: [], total: 0, page, limit, totalPages: 0, globalMetrics: { totalReviews: 0, totalIssues: 0, debtRecovered: 0, avgLatency: 0 } };
    }
    // AuthZ: only show PRs from accessible repos
    const placeholders = userRepos.map(() => '?').join(',');
    query += ` AND repository IN (${placeholders})`;
    params.push(...userRepos);
  }

  query += ' ORDER BY timestamp DESC';

  const rows = await db.all(query, params);
  let reviews = rows.map((row) => JSON.parse(row.data));

  // Severity filtering (has to be done in-memory because SQLite JSON isn't natively queried efficiently here without json1, and the array structure is complex)
  if (severity) {
    reviews = reviews.filter((r) =>
      r.issues && r.issues.some((i) => i.severity && i.severity.toLowerCase() === severity.toLowerCase())
    );
  }

  const total = reviews.length;
  
  // Compute metrics on the FULL filtered dataset before pagination
  let globalMetrics = { totalReviews: total, totalIssues: 0, debtRecovered: 0, avgLatency: 0 };
  let sumLatency = 0;
  reviews.forEach(r => {
    if (r.metrics) {
      globalMetrics.totalIssues += (r.metrics.total_issues || 0);
      globalMetrics.debtRecovered += (r.metrics.financial_saved || 0);
    }
    sumLatency += (r.latency_seconds || 0);
  });
  globalMetrics.avgLatency = total > 0 ? (sumLatency / total).toFixed(1) : 0;

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedReviews = reviews.slice(startIndex, endIndex);

  return {
    data: paginatedReviews,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
    globalMetrics
  };
}

async function getReviewById(id) {
  const db = await initDB();
  const row = await db.get('SELECT data FROM reviews WHERE id = ?', [id]);
  return row ? JSON.parse(row.data) : null;
}

// ─────────────────────────────────────────────
// Ruleset Storage
// ─────────────────────────────────────────────
async function getRules() {
  const db = await initDB();
  const row = await db.get('SELECT rules FROM rulesets WHERE id = ?', ['global']);
  return row ? row.rules : '';
}

async function saveRules(rulesText) {
  const db = await initDB();
  await db.run(
    'INSERT INTO rulesets (id, rules) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET rules = excluded.rules',
    ['global', rulesText]
  );
  return rulesText;
}

// ─────────────────────────────────────────────
// Analytics / Gamification
// ─────────────────────────────────────────────
async function getLeaderboard(userRepos = null) {
  const db = await initDB();
  
  let query = 'SELECT data FROM reviews WHERE 1=1';
  const params = [];

  if (userRepos !== null) {
    if (userRepos.length === 0) return [];
    const placeholders = userRepos.map(() => '?').join(',');
    query += ` AND repository IN (${placeholders})`;
    params.push(...userRepos);
  }

  const rows = await db.all(query, params);
  const reviews = rows.map((row) => JSON.parse(row.data));

  const stats = {};

  for (const review of reviews) {
    if (!review.author) continue;
    const author = review.author;

    if (!stats[author]) {
      stats[author] = {
        author,
        totalPrs: 0,
        cleanPrs: 0,
        criticalBugsPrevented: 0,
        score: 0
      };
    }

    stats[author].totalPrs += 1;

    let hasIssues = false;
    if (review.issues && review.issues.length > 0) {
      hasIssues = true;
      for (const issue of review.issues) {
        const severity = (issue.severity || '').toLowerCase();
        if (severity === 'critical') {
          stats[author].criticalBugsPrevented += 1;
          stats[author].score -= 20;
        } else if (severity === 'moderate') {
          stats[author].score -= 10;
        } else if (severity === 'low') {
          stats[author].score -= 5;
        }
      }
    }

    if (!hasIssues && review.status === 'Analyzed') {
      stats[author].cleanPrs += 1;
      stats[author].score += 50;
    }
  }

  const leaderboard = Object.values(stats).map(s => {
    return {
      ...s,
      cleanPrRate: s.totalPrs > 0 ? Math.round((s.cleanPrs / s.totalPrs) * 100) : 0
    };
  });

  // Sort by score descending
  leaderboard.sort((a, b) => b.score - a.score);

  return leaderboard;
}

// Ensure database is initialized
initDB().catch((err) => console.error('[SQLite] Initialization error:', err));

module.exports = {
  addReview,
  updateReview,
  getAllReviews,
  getReviewById,
  getRules,
  saveRules,
  getLeaderboard,
};
