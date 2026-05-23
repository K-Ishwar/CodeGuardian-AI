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
        )
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

// Ensure database is initialized
initDB().catch((err) => console.error('[SQLite] Initialization error:', err));

module.exports = {
  addReview,
  updateReview,
  getAllReviews,
  getReviewById,
};
