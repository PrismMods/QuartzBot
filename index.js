const express = require("express");
const crypto = require("crypto");
const {
    Client,
    GatewayIntentBits,
    MessageFlags,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    TextDisplayBuilder,
} = require("discord.js");

const app = express();
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));

// Config — use environment variables in production
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const GITHUB_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

const ROLE_ID = "1501202364302889142";
const PRERELEASE_ROLE_ID = "1520786654238081094";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

function verifySignature(req, secret) {
    if (!secret) {
        console.error("GITHUB_WEBHOOK_SECRET is not set; rejecting webhook");
        return false;
    }
    const sig = req.headers["x-hub-signature-256"];
    if (!sig || !req.rawBody) return false;
    // GitHub signs the raw request bytes — hashing re-serialized req.body
    // can produce different bytes and a false mismatch.
    const digest = "sha256=" + crypto.createHmac("sha256", secret).update(req.rawBody).digest("hex");
    const sigBuf = Buffer.from(sig);
    const digestBuf = Buffer.from(digest);
    return sigBuf.length === digestBuf.length && crypto.timingSafeEqual(sigBuf, digestBuf);
}

const STRINGS = {
    en: {
        prerelease: "🧪 New Pre-release!",
        release: "🚀 New Update!",
        download: "📦 **Download**",
        changelog: "📋 **Changelog**",
        noChangelog: "No changelog provided.",
        toggleLabel: "한국어",
    },
    ko: {
        prerelease: "🧪 새 프리릴리스!",
        release: "🚀 새 업데이트!",
        download: "📦 **다운로드**",
        changelog: "📋 **변경 사항**",
        noChangelog: "변경 사항이 없습니다.",
        toggleLabel: "English",
    },
};

const HANGUL = /[ᄀ-ᇿ㄰-㆏가-힯]/;
const KO_MARKER = /^##\s*한국어\s*$/;
const EN_MARKER = /^##\s*English\s*$/i;
const DIVIDER = /^-{3,}\s*$/;

// Release bodies have a "## English" section followed by a "## 한국어"
// section, optionally ending in a "---" trailer (build number, compare link)
// that belongs to both views. The section markers themselves aren't shown.
function splitLanguages(body) {
    const lines = (body || "").split(/\r?\n/);
    const koStart = lines.findIndex(line => KO_MARKER.test(line));
    if (koStart === -1) {
        return { en: (body || "").trim(), ko: null };
    }

    const enLines = lines.slice(0, koStart).filter(line => !EN_MARKER.test(line));
    let koLines = lines.slice(koStart + 1);

    let trailer = "";
    for (let i = koLines.length - 1; i >= 0; i--) {
        if (!DIVIDER.test(koLines[i])) continue;
        const tail = koLines.slice(i + 1);
        if (tail.some(line => line.trim()) && !tail.some(line => HANGUL.test(line))) {
            trailer = "\n\n" + koLines.slice(i).join("\n").trim();
            koLines = koLines.slice(0, i);
        }
        break;
    }

    const en = (enLines.join("\n").replace(/\n*-{3,}\s*$/, "").trim() + trailer).trim();
    const ko = (koLines.join("\n").replace(/\n*-{3,}\s*$/, "").trim() + trailer).trim();
    return { en, ko };
}

function truncate(text, max) {
    return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

// Cache webhook payloads so language toggles don't need to hit the GitHub
// API; falls back to the API after a restart.
const releaseCache = new Map();

function cacheKey(repoFullName, tag) {
    return `${repoFullName}:${tag}`;
}

async function getRelease(repoFullName, tag) {
    const key = cacheKey(repoFullName, tag);
    if (releaseCache.has(key)) return releaseCache.get(key);

    const res = await fetch(
        `https://api.github.com/repos/${repoFullName}/releases/tags/${encodeURIComponent(tag)}`,
        { headers: { "User-Agent": "QuartzBot", Accept: "application/vnd.github+json" } }
    );
    if (!res.ok) throw new Error(`GitHub API responded ${res.status}`);
    const release = await res.json();
    releaseCache.set(key, release);
    return release;
}

function buildReleaseMessage(release, repoFullName, lang) {
    const repoName = repoFullName.split("/")[1];
    const { en, ko } = splitLanguages(release.body);
    if (lang === "ko" && !ko) lang = "en";
    const t = STRINGS[lang];
    const changelog = (lang === "ko" ? ko : en) || ko || t.noChangelog;

    const melonAsset = release.assets?.find(a => a.name === "Quartz.zip");
    const ummAsset = release.assets?.find(a => a.name === "QuartzUmm.zip");

    const title =
        `## ${release.prerelease ? t.prerelease : t.release}\n` +
        `**${release.name || release.tag_name}**`;

    const downloads =
        `${t.download}\n` +
        (melonAsset ? `\`${melonAsset.name}\` — MelonLoader\n` : "") +
        (ummAsset ? `\`${ummAsset.name}\` — UMM\n` : "");

    const publishedAt = Math.floor(new Date(release.published_at).getTime() / 1000);

    const container = new ContainerBuilder()
        .setAccentColor(release.prerelease ? 0xffa500 : 0x5865f2); // orange for prerelease, purple for stable

    if (ko) {
        // Title with the language toggle as its accessory, top right
        container.addSectionComponents(section =>
            section
                .addTextDisplayComponents(td => td.setContent(title))
                .setButtonAccessory(btn =>
                    btn
                        .setCustomId(`lang:${lang === "ko" ? "en" : "ko"}:${repoFullName}:${release.tag_name}`)
                        .setLabel(t.toggleLabel)
                        .setEmoji("🌐")
                        .setStyle(ButtonStyle.Secondary)
                )
        );
    } else {
        container.addTextDisplayComponents(td => td.setContent(title));
    }

    container
        .addTextDisplayComponents(td => td.setContent(downloads))
        .addTextDisplayComponents(td => td.setContent(`${t.changelog}\n${truncate(changelog, 3500)}`))
        .addSeparatorComponents(sep => sep)
        .addTextDisplayComponents(td => td.setContent(`-# ${repoName} > JRP • <t:${publishedAt}:f>`));

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

    return [container, buttons];
}

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton() || !interaction.customId.startsWith("lang:")) return;

    const [, lang, repoFullName, tag] = interaction.customId.split(":");

    try {
        const release = await getRelease(repoFullName, tag);
        const pingRole = release.prerelease ? PRERELEASE_ROLE_ID : ROLE_ID;

        await interaction.update({
            components: [
                new TextDisplayBuilder().setContent(`<@&${pingRole}>`),
                ...buildReleaseMessage(release, repoFullName, lang),
            ],
            flags: MessageFlags.IsComponentsV2,
            allowedMentions: { roles: [] },
        });
    } catch (err) {
        console.error("Failed to switch language:", err);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: "Couldn't switch language, please try again later.",
                flags: MessageFlags.Ephemeral,
            }).catch(() => {});
        }
    }
});

app.post("/webhook", async (req, res) => {
    if (!verifySignature(req, GITHUB_SECRET)) {
        return res.sendStatus(401);
    }

    const event = req.headers["x-github-event"];

    if (event !== "release" || req.body.action !== "published") {
        return res.sendStatus(200);
    }

    const release = req.body.release;
    const repo = req.body.repository;

    releaseCache.set(cacheKey(repo.full_name, release.tag_name), release);

    try {
        const channel = await client.channels.fetch(CHANNEL_ID);

        const pingRole = release.prerelease ? PRERELEASE_ROLE_ID : ROLE_ID;

        await channel.send({
            components: [
                new TextDisplayBuilder().setContent(`<@&${pingRole}>`),
                ...buildReleaseMessage(release, repo.full_name, "en"),
            ],
            flags: MessageFlags.IsComponentsV2,
            allowedMentions: { roles: [pingRole] },
        });

        res.sendStatus(200);
    } catch (err) {
        console.error("Failed to send message:", err);
        res.sendStatus(500);
    }
});

client.login(DISCORD_TOKEN);
app.listen(3000, () => console.log("Webhook server listening on port 3000"));
