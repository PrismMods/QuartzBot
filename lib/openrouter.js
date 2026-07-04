const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

// Client for the OpenRouter chat-completions API. Messages use the
// OpenAI-style shape: { role, content, name? } — `name` carries the speaker's
// display name through the payload.
class OpenRouterClient {
    constructor(apiKey, model) {
        this.apiKey = apiKey;
        this.model = model;
    }

    // chat sends the messages and returns the assistant's reply text.
    async chat(messages) {
        const res = await fetch(ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.apiKey}`,
                // Optional attribution headers OpenRouter recommends.
                "HTTP-Referer": "https://github.com/local/discord-ai-bot",
                "X-Title": "Quartz Bot",
            },
            body: JSON.stringify({
                model: this.model,
                messages,
                temperature: 0.8,
            }),
            signal: AbortSignal.timeout(120_000),
        });

        const body = await res.text();
        if (!res.ok) {
            throw new Error(`openrouter status ${res.status}: ${body}`);
        }

        const out = JSON.parse(body);
        if (out.error) {
            throw new Error(`openrouter error: ${out.error.message}`);
        }
        if (!out.choices?.length) {
            throw new Error("openrouter returned no choices");
        }
        return out.choices[0].message.content;
    }
}

module.exports = { OpenRouterClient };
