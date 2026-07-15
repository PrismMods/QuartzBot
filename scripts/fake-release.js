// Posts a signed, fake GitHub "release published" event to the local bot so
// you can test the announcement + language button without cutting a release.
//
//   node scripts/fake-release.js               -> prerelease, default tag
//   node scripts/fake-release.js v1.2.3        -> custom tag
//   node scripts/fake-release.js v1.2.3 --stable
require("dotenv").config();
const crypto = require("crypto");

const secret = process.env.GITHUB_WEBHOOK_SECRET;
if (!secret) {
    console.error("Set GITHUB_WEBHOOK_SECRET in .env first (any value works locally).");
    process.exit(1);
}

const tag = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "v0.0.0-test-1";
const prerelease = !process.argv.includes("--stable");

const payload = {
    action: "published",
    release: {
        name: `${tag} — Local webhook test`,
        tag_name: tag,
        // Mirrors the current release format: no English header, Korean
        // section introduced by "## 한국어 (Korean)", shared "---" trailer.
        body: [
            "### Fixed",
            "- Test entry: this message was posted by scripts/fake-release.js.",
            "",
            "---",
            "",
            "## 한국어 (Korean)",
            "",
            "### 수정",
            "- 테스트 항목: scripts/fake-release.js가 보낸 메시지입니다.",
            "",
            "---",
            `test build · ${tag}`,
        ].join("\n"),
        html_url: `https://github.com/example/quartz/releases/tag/${tag}`,
        published_at: new Date().toISOString(),
        prerelease,
        assets: [
            { name: "Quartz.zip", browser_download_url: "https://example.com/Quartz.zip" },
            { name: "QuartzUmm.zip", browser_download_url: "https://example.com/QuartzUmm.zip" },
        ],
    },
    repository: { name: "quartz", full_name: "example/quartz" },
};

const body = JSON.stringify(payload);
const sig = "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");

fetch("http://localhost:3000/webhook", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "X-GitHub-Event": "release",
        "X-Hub-Signature-256": sig,
    },
    body,
}).then(res => {
    if (res.status === 200) {
        console.log("200 OK — check the Discord channel for the announcement.");
    } else {
        console.log(`webhook responded ${res.status} — check the bot's logs.`);
    }
}).catch(err => {
    console.error("request failed — is the bot running (npm start)?", err.message);
});
