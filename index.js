const express = require("express");
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const crypto = require("crypto");

const app = express();
app.use(express.json());

// Config — use environment variables in production
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const GITHUB_SECRET = process.env.GITHUB_WEBHOOK_SECRET; // optional but recommended

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

function verifySignature(req, secret) {
    const sig = req.headers["x-hub-signature-256"];
    if (!sig) return false;
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(JSON.stringify(req.body));
    const digest = "sha256=" + hmac.digest("hex");
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(digest));
}

app.post("/webhook", async (req, res) => {
    if (GITHUB_SECRET && !verifySignature(req, GITHUB_SECRET)) {
        return res.sendStatus(403);
    }

    const event = req.headers["x-github-event"];

    // Only handle release events that are published
    if (event !== "release" || req.body.action !== "published") {
        return res.sendStatus(200);
    }

    const release = req.body.release;
    const repo = req.body.repository;

    const embed = new EmbedBuilder()
        .setTitle(`🚀 ${repo.full_name} — ${release.tag_name}`)
        .setURL(release.html_url)
        .setDescription(release.body?.slice(0, 4096) || "No release notes provided.")
        .addFields(
            { name: "Version", value: release.tag_name, inline: true },
            { name: "Author", value: release.author.login, inline: true },
            { name: "Pre-release", value: release.prerelease ? "Yes" : "No", inline: true }
        )
        .setColor(release.prerelease ? 0xffa500 : 0x2ea043)
        .setTimestamp(new Date(release.published_at))
        .setFooter({ text: repo.full_name });

    try {
        const channel = await client.channels.fetch(CHANNEL_ID);
        await channel.send({ embeds: [embed] });
        res.sendStatus(200);
    } catch (err) {
        console.error("Failed to send message:", err);
        res.sendStatus(500);
    }
});

client.login(DISCORD_TOKEN);
app.listen(3000, () => console.log("Webhook server listening on port 3000"));