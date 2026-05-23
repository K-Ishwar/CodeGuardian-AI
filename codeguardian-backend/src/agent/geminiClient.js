// All Gemini API calls
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GEMINI_API_KEY } = require('../config');

const MODEL_NAME = 'gemini-2.5-flash';

const SYSTEM_PROMPT = `You are CodeGuardian, an expert code review AI. Analyze the provided code diff and identify ALL issues. You MUST respond with ONLY a valid JSON array. No explanation text, no markdown, no backticks. Just the raw JSON array.

Each issue object MUST have exactly these fields:
{
  title: string (short, clear issue name),
  severity: exactly one of: Critical | Moderate | Low,
  filename: string (which file this is in),
  time_to_fix: integer (estimated minutes to fix, be realistic: Critical=30-60, Moderate=10-20, Low=5-10),
  explanation: string (2-3 sentences explaining why this is a problem),
  patch_suggestion: string (the corrected code line or block, just the code, no markdown)
}

Severity guide:
- Critical: security vulnerabilities, hardcoded secrets, SQL injection, auth bypass, data exposure
- Moderate: performance issues, missing error handling, code smells, memory leaks
- Low: naming conventions, unused variables, missing comments, style issues

If no issues found, return an empty array: []`;

/**
 * Builds a single prompt string from all file diff chunks.
 * @param {Array<{ filename: string, patch: string }>} fileDiffChunks
 * @returns {string}
 */
function buildPrompt(fileDiffChunks) {
  const sections = fileDiffChunks
    .map(
      (chunk) =>
        `FILE: ${chunk.filename}\nCHANGES:\n${chunk.patch}`
    )
    .join('\n\n---\n\n');

  return `Review the following code diff and return a JSON array of issues:\n\n${sections}`;
}

/**
 * Strips accidental markdown code fences from a Gemini response.
 * @param {string} text
 * @returns {string}
 */
function stripMarkdownFences(text) {
  return text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
}

/**
 * Analyzes code diff chunks using Gemini AI and returns a list of issues.
 * @param {Array<{ filename: string, status: string, additions: number, deletions: number, patch: string }>} fileDiffChunks
 * @returns {Promise<Array<{ title: string, severity: string, filename: string, time_to_fix: number, explanation: string, patch_suggestion: string }>>}
 */
async function analyzeCodeWithGemini(fileDiffChunks) {
  try {
    if (!fileDiffChunks || fileDiffChunks.length === 0) {
      console.log('GeminiClient: No diff chunks to analyze. Returning empty issues.');
      return [];
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: SYSTEM_PROMPT,
    });

    const prompt = buildPrompt(fileDiffChunks);

    console.log(`GeminiClient: Sending ${fileDiffChunks.length} file(s) to Gemini for analysis...`);

    const result = await model.generateContent(prompt);
    const response = result.response;
    const rawText = response.text();

    console.log('GeminiClient: Received response from Gemini.');

    // Strip any accidental markdown fences
    const cleaned = stripMarkdownFences(rawText);

    // Parse JSON
    try {
      const issues = JSON.parse(cleaned);
      console.log(`GeminiClient: Parsed ${issues.length} issue(s).`);
      return issues;
    } catch (parseErr) {
      console.error('GeminiClient: Failed to parse Gemini response as JSON.');
      console.error('GeminiClient: Raw response was:', rawText);
      return [];
    }
  } catch (err) {
    console.error('GeminiClient error in analyzeCodeWithGemini:', err.message);
    throw new Error(`GeminiClient error in analyzeCodeWithGemini: ${err.message}`);
  }
}

module.exports = { analyzeCodeWithGemini };
