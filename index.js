const express = require("express");
const { Client, GatewayIntentBits, Partials } = require("discord.js");

const config = require("./lib/config");
const { Store } = require("./lib/store");
const { OpenRouterClient } = require("./lib/openrouter");
const { ChatHandler } = require("./lib/chat");
const releases = require("./lib/releases");

const cfg = config.load();

// The AI side needs the privileged MESSAGE CONTENT intent (enable it in the
// Discord developer portal); release-only mode sticks to Guilds so the bot
// still logs in without it.
const intents = cfg.aiEnabled
    ? [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
    ]
    : [GatewayIntentBits.Guilds];

const client = new Client({
    intents,
    partials: [Partials.Channel], // needed to receive DMs
});

let db = null;
let chat = null;
if (cfg.aiEnabled) {
    db = new Store(cfg.databaseUrl);
    chat = new ChatHandler(cfg, new OpenRouterClient(cfg.openRouterKey, cfg.openRouterModel), db);
} else {
    console.warn("AI chat disabled: set OPENROUTER_API_KEY and DATABASE_URL to enable it");
}

client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", releases.handleLanguageButton);

if (chat) {
    client.on("messageCreate", (message) => {
        chat.handle(client, message).catch(err => console.error("chat error:", err));
    });
}

const app = express();
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));

// Health endpoint — point an uptime pinger here to keep Render's free tier
// from spinning the service (and the Discord connection) down.
app.get("/", (req, res) => res.send("QuartzBot is up"));
app.post("/webhook", releases.webhookHandler(client, cfg));

const PORT = process.env.PORT || 3000;

async function main() {
    // Bind the port before anything slow (DB init, Discord login) — Render
    // kills deploys whose port never opens, and it forwards traffic to the
    // port in the PORT env var.
    await new Promise((resolve, reject) => {
        app.listen(PORT, () => {
            console.log(`Webhook server listening on port ${PORT}`);
            resolve();
        }).on("error", reject);
    });
    if (db) await db.init();
    await client.login(cfg.discordToken);
}

async function shutdown() {
    console.log("shutting down.");
    await client.destroy().catch(() => {});
    if (db) await db.close().catch(() => {});
    process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

main().catch(err => {
    console.error("startup failed:", err);
    process.exit(1);
});
