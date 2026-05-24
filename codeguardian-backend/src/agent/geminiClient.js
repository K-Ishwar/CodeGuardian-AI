// All Gemini API calls
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GEMINI_API_KEY } = require('../config');

const MODEL_NAME = 'gemini-2.5-flash';

const COMMON_JSON_SCHEMA = `
Each issue object MUST have exactly these fields:
{
  "title": "string (short, clear issue name)",
  "severity": "Critical | Moderate | Low",
  "filename": "string (which file this is in)",
  "line": "integer (the exact line number in the modified file where this issue occurs, use your best guess from the diff context)",
  "time_to_fix": "integer (estimated minutes to fix)",
  "explanation": "string (2-3 sentences explaining why this is a problem)",
  "patch_suggestion": "string (the corrected code line or block, just the code, no markdown)"
}
If no issues found, return an empty array: []`;

const SECURITY_PROMPT = `You are CodeGuardian's Security Scanner Agent. Analyze the provided code diff and identify ONLY security vulnerabilities, hardcoded secrets, SQL injection, auth bypass, data exposure, etc.
You MUST respond with ONLY a valid JSON array. No explanation text, no markdown, no backticks.
${COMMON_JSON_SCHEMA}`;

const PERFORMANCE_PROMPT = `You are CodeGuardian's Performance Bottleneck Agent. Analyze the provided code diff and identify ONLY performance issues, missing error handling, memory leaks, inefficient loops, or missing caching.
You MUST respond with ONLY a valid JSON array. No explanation text, no markdown, no backticks.
${COMMON_JSON_SCHEMA}`;

const STYLE_PROMPT = `You are CodeGuardian's Code Quality & Bug Agent. Analyze the provided code diff and identify ANY logical bugs, syntax errors, typos, code smells, naming conventions, missing comments, SOLID principle violations, and general anti-patterns.
You MUST respond with ONLY a valid JSON array. No explanation text, no markdown, no backticks.
${COMMON_JSON_SCHEMA}`;

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

const { getRules } = require('../storage/store');

/**
 * Analyzes code diff chunks using Gemini AI and returns a list of issues.
 * @param {Array<{ filename: string, status: string, additions: number, deletions: number, patch: string }>} fileDiffChunks
 * @returns {Promise<Array<{ title: string, severity: string, filename: string, line: number, time_to_fix: number, explanation: string, patch_suggestion: string }>>}
 */
async function analyzeCodeWithGemini(fileDiffChunks) {
  try {
    if (!fileDiffChunks || fileDiffChunks.length === 0) {
      console.log('GeminiClient: No diff chunks to analyze. Returning empty issues.');
      return [];
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const promptText = buildPrompt(fileDiffChunks);
    const systemPrompts = [SECURITY_PROMPT, PERFORMANCE_PROMPT, STYLE_PROMPT];
    
    // Fetch custom rules
    const rules = await getRules();

    console.log(`GeminiClient: Sending ${fileDiffChunks.length} file(s) to 3 Gemini agents...`);

    const results = await Promise.all(systemPrompts.map(async (sysPrompt, index) => {
      try {
        const model = genAI.getGenerativeModel({
          model: MODEL_NAME,
          systemInstruction: sysPrompt + (rules ? `\n\nUSER CUSTOM RULES (MUST FOLLOW):\n${rules}` : ''),
        });

        const result = await model.generateContent(promptText);
        const rawText = result.response.text();
        const cleaned = stripMarkdownFences(rawText);
        
        return JSON.parse(cleaned);
      } catch (err) {
        console.error(`GeminiClient: Agent ${index} failed:`, err.message);
        return [];
      }
    }));

    const allIssues = results.flat();
    console.log(`GeminiClient: 3 Agents finished. Found ${allIssues.length} total issue(s).`);
    return allIssues;

  } catch (err) {
    console.error('GeminiClient error in analyzeCodeWithGemini:', err.message);
    throw new Error(`GeminiClient error in analyzeCodeWithGemini: ${err.message}`);
  }
}

/**
 * Facilitates a conversational chat with the agent regarding a specific PR review.
 * @param {object} review - The full review object from the DB
 * @param {Array<{role: string, content: string}>} messages - Chat history
 * @returns {Promise<string>}
 */
async function chatWithAgent(review, messages) {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // Build context payload
    const contextStr = JSON.stringify({
      pr_title: review.pr_title,
      repository: review.repository,
      issues_found: review.issues
    }, null, 2);

    const systemInstruction = `You are CodeGuardian's Interactive Agent. 
You are assisting a developer who is asking questions about a Pull Request review you recently conducted.
Here is the context of the PR and the issues you found:
${contextStr}

Answer the user's questions clearly and concisely. If they ask for code rewrites, provide them. Use Markdown for code blocks. Be helpful but keep responses relatively short.`;

    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction,
    });

    // Format history for Gemini SDK
    // Our messages are { role: 'user' | 'agent', content: '...' }
    // Gemini expects { role: 'user' | 'model', parts: [{ text: '...' }] }
    const history = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'agent' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({ history });

    // Send the latest message
    const latestMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(latestMessage);
    
    return result.response.text();
  } catch (err) {
    console.error('GeminiClient error in chatWithAgent:', err.message);
    throw new Error(`GeminiClient error in chatWithAgent: ${err.message}`);
  }
}

module.exports = { analyzeCodeWithGemini, chatWithAgent };
