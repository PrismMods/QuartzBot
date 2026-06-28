const express = require("express");
const crypto = require("crypto");
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const app = express();
app.use(express.json());

// Config — use environment variables in production
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const GITHUB_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

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
    const event = req.headers["x-github-event"];

    if (event !== "release" || req.body.action !== "published") {
        return res.sendStatus(200);
    }

    const release = req.body.release;
    const repo = req.body.repository;

    const melonAsset = release.assets?.[0];
    const ummAsset = release.assets?.[1];

    const embed = new EmbedBuilder()
        .setTitle(release.prerelease ? "🧪 New Pre-release!" : "🚀 New Update!")
        .setDescription(
            `**${release.name || release.tag_name}**\n\n` +
            `📦 **Download**\n` +
            (melonAsset ? `\`${melonAsset.name}\` — MelonLoader\n` : "") +
            (ummAsset ? `\`${ummAsset.name}\` — UMM\n` : "") +
            `\n📋 **Changelog**\n${release.body || "No changelog provided."}`
        )
        .setColor(release.prerelease ? 0xffa500 : 0x5865f2) // orange for prerelease, purple for stable
        .setTimestamp(new Date(release.published_at))
        .setFooter({ text: `${repo.name} > JRP` });

    const buttons = new ActionRowBuilder().addComponents(
        ...(melonAsset ? [
            new ButtonBuilder()
                .setLabel("Download (MelonLoader)")
                .setEmoji("⬇️")
                .setStyle(ButtonStyle.Link)
                .setURL(melonAsset.browser_download_url)
        ] : []),
        ...(ummAsset ? [
            new ButtonBuilder()
                .setLabel("Download (UMM)")
                .setEmoji("⬇️")
                .setStyle(ButtonStyle.Link)
                .setURL(ummAsset.browser_download_url)
        ] : []),
        new ButtonBuilder()
            .setLabel("View on GitHub")
            .setEmoji("🔗")
            .setStyle(ButtonStyle.Link)
            .setURL(release.html_url)
    );

    try {

        const channel = await client.channels.fetch(CHANNEL_ID);

        const ROLE_ID = "1501202364302889142";
        const PRERELEASE_ROLE_ID = "1520786654238081094";

        const pingRole = release.prerelease ? PRERELEASE_ROLE_ID : ROLE_ID;

        await channel.send({
            content: `<@&${pingRole}>`,
            embeds: [embed],
            components: [buttons]
        });

        res.sendStatus(200);
    } catch (err) {
        console.error("Failed to send message:", err);
        res.sendStatus(500);
    }
});

client.login(DISCORD_TOKEN);
app.listen(3000, () => console.log("Webhook server listening on port 3000"));