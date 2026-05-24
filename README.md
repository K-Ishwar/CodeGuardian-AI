<div align="center">
  <h1>🛡️ CodeGuardian AI</h1>
  <p><strong>The Autonomous Code Review & Self-Healing Agent</strong></p>
  <p>Built for the AI Hackathon for Builders</p>
</div>

## 🚀 Overview
CodeGuardian AI is an advanced, autonomous agent that acts as a Principal Engineer for your repository. It doesn't just review code—it explains issues via interactive chat, gamifies code quality, and automatically applies self-healing patches to GitHub PRs with a single click.

## ✨ Core Agentic Features

1. **⚡ Live Event-Driven Analysis:** Watch the agent's thought process in real-time as it parses code, queries LLMs, and computes metrics via Server-Sent Events (SSE).
2. **🤖 Interactive Agent Chat (RAG):** Don't understand why the agent flagged a vulnerability? Open the floating chat widget and converse directly with the AI about that specific PR context.
3. **✨ Self-Healing PRs:** Found a critical bug? Click "Apply Fix" and the agent will use the GitHub API to automatically author a patch commit directly to your PR branch.
4. **⚙️ Customizable AI Rulesets:** Inject custom architectural guidelines directly into the agent's system prompt (e.g., "Always enforce snake_case" or "Ban the use of specific libraries").
5. **📄 Interactive Diff Viewer:** Inspect the exact chunk of source code the agent flagged, parsed directly from GitHub with inline syntax highlighting.
6. **🏆 Gamification & Analytics Dashboard:** A comprehensive leaderboard that tracks "Code Health Scores", "Clean PR Rates", and counts of "Critical Bugs Prevented" to incentivize secure development.

## 🏗️ Technical Architecture
- **Agent Brain:** Built natively using Node.js/Express and the official `@google/genai` SDK.
- **Agent Roles:** Utilizes specialized Gemini agents (Security, Performance, Style) in a multi-agent orchestration pattern.
- **Frontend:** React + Vite with a stunning, responsive glassmorphism UI.
- **Storage:** SQLite for persistent memory of PR history, agent rules, and leaderboard stats.

## 🧪 How to Test the Agent
1. Login to the dashboard using the credentials provided.
2. Go to the **Dashboard** and paste a public GitHub Pull Request URL into the manual analysis bar.
3. Watch the real-time agent execution stream.
4. Review the flagged issues, click **View Diff 📄** to see the code context, and ask the **Agent Chat** for a detailed explanation.
5. *(Note: The "Apply Fix" button requires the backend's GitHub token to have write access to the specific repository).*

---