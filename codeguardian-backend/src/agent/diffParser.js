// Parses raw .diff into file chunks

const SKIP_PATTERNS = ['node_modules', '.lock', '.min.js', 'dist/'];
const MAX_PATCH_LENGTH = 3000;

/**
 * Determines the status of a file based on diff chunk content.
 * @param {string} chunk
 * @returns {"added"|"deleted"|"modified"}
 */
function getFileStatus(chunk) {
  if (chunk.includes('new file mode')) return 'added';
  if (chunk.includes('deleted file mode')) return 'deleted';
  return 'modified';
}

/**
 * Extracts the filename from a diff chunk.
 * Prefers "+++ b/" line, falls back to "--- a/" line.
 * @param {string} chunk
 * @returns {string|null}
 */
function extractFilename(chunk) {
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('+++ b/')) {
      return line.slice(6).trim();
    }
  }

  for (const line of lines) {
    if (line.startsWith('--- a/')) {
      return line.slice(6).trim();
    }
  }

  // Handle new/deleted files where path is /dev/null on one side
  for (const line of lines) {
    if (line.startsWith('+++ /dev/null')) continue;
    if (line.startsWith('--- /dev/null')) continue;
    if (line.startsWith('+++ ')) return line.slice(4).trim();
    if (line.startsWith('--- ')) return line.slice(4).trim();
  }

  return null;
}

/**
 * Parses a raw Git diff string into an array of file chunk objects.
 * @param {string} rawDiffString
 * @returns {Array<{ filename: string, status: string, additions: number, deletions: number, patch: string }>}
 */
function parseDiff(rawDiffString) {
  if (!rawDiffString || rawDiffString.trim() === '') {
    return [];
  }

  // Split on lines that start with "diff --git"
  const rawChunks = rawDiffString.split(/(?=^diff --git )/m).filter(Boolean);

  const results = [];

  for (const chunk of rawChunks) {
    // Skip binary files
    if (chunk.includes('Binary files')) {
      continue;
    }

    const filename = extractFilename(chunk);

    if (!filename) {
      continue;
    }

    // Skip unwanted files
    if (SKIP_PATTERNS.some((pattern) => filename.includes(pattern))) {
      continue;
    }

    const status = getFileStatus(chunk);

    // Count additions: lines starting with "+" but NOT "+++"
    const lines = chunk.split('\n');
    let additions = 0;
    let deletions = 0;
    const patchLines = [];

    for (const line of lines) {
      if (line.startsWith('+++') || line.startsWith('---')) {
        // These are header lines, not actual changes
        continue;
      }
      if (line.startsWith('+')) {
        additions++;
        patchLines.push(line);
      } else if (line.startsWith('-')) {
        deletions++;
        patchLines.push(line);
      } else if (line.startsWith('@') || line.startsWith(' ')) {
        // Context lines and hunk headers — include in patch for readability
        patchLines.push(line);
      }
    }

    let patch = patchLines.join('\n');

    // Truncate patch if too long
    if (patch.length > MAX_PATCH_LENGTH) {
      patch = patch.slice(0, MAX_PATCH_LENGTH) + '... [truncated]';
    }

    results.push({
      filename,
      status,
      additions,
      deletions,
      patch,
    });
  }

  return results;
}

module.exports = { parseDiff };
