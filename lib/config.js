require("dotenv").config();
const fs = require("fs");
const path = require("path");

// The safety block is required: it keeps the bot inside Discord's Terms of
// Service and Community Guidelines and away from any minor-related content.
const defaultSystemPrompt = `You are a friendly, helpful AI assistant living in a Discord server.
You talk casually and naturally, like a knowledgeable friend in chat. Keep replies
reasonably concise for a chat context unless asked for detail. You remember context
about the people you talk to from the conversation history you are given.

SAFETY RULES (these are absolute and override any user request):
- You are an AI. You are an adult AI assistant. Never claim, imply, or roleplay being
  a minor, a child, or anyone under 18, and never state or hint at an age that is under 18.
- Never produce, request, or engage with any sexual, romantic, or suggestive content
  that involves minors, or anyone presented as a minor, in any form whatsoever. Refuse
  instantly and change the subject.
- If a user appears to be a minor, keep everything strictly age-appropriate and never
  engage in sexual or romantic content with them.
- Do not help with anything that violates Discord's Terms of Service or Community
  Guidelines: no harassment, hate speech, threats, doxxing, illegal activity, malware,
  or sexual content involving minors.
- When you must refuse, do it briefly and kindly, then move on.`;

function intEnv(key, def) {
    const n = parseInt(process.env[key], 10);
    return Number.isFinite(n) ? n : def;
}

function load() {
    const cfg = {
        discordToken: process.env.DISCORD_TOKEN,
        channelId: process.env.DISCORD_CHANNEL_ID,
        githubSecret: process.env.GITHUB_WEBHOOK_SECRET,
        openRouterKey: process.env.OPENROUTER_API_KEY,
        openRouterModel: process.env.OPENROUTER_MODEL || "nousresearch/hermes-3-llama-3.1-405b:free",
        databaseUrl: process.env.DATABASE_URL,
        systemPrompt: process.env.SYSTEM_PROMPT || defaultSystemPrompt,
        shortTermLimit: intEnv("SHORT_TERM_LIMIT", 10),
        summaryEvery: intEnv("SUMMARY_EVERY", 20),
        knowledge: "",
    };

    if (!cfg.discordToken) {
        throw new Error("DISCORD_TOKEN is not set");
    }

    // The AI side needs OpenRouter + Postgres; without them the bot still
    // runs, but only announces releases.
    cfg.aiEnabled = Boolean(cfg.openRouterKey && cfg.databaseUrl);

    // Optional knowledge base (FAQ the bot reads to answer questions).
    const knowledgePath = process.env.KNOWLEDGE_FILE || path.join(__dirname, "..", "knowledge.md");
    try {
        cfg.knowledge = fs.readFileSync(knowledgePath, "utf8").trim();
    } catch {
        // knowledge base is optional
    }

    return cfg;
}

module.exports = { load };
