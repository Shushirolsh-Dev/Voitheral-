# VOITHREAL

**Voice Orchestrated Intelligence Transforming Humanity REALity**

Your voice. Your intelligence. Your life.

VOITHREAL is a voice-first personal companion and an open orchestration foundation. It is designed to help people care for themselves, keep routines, remember commitments, and make progress through natural spoken interaction.

## Product principles

- **Voice first, voice only:** the companion experience is spoken. There is no text-chat composer.
- **Warm, calm, respectful:** inspired by the emotional warmth of fictional healthcare companions, while building a distinct identity and product.
- **Proactive, not nagging:** reminders should be timely, adjustable, and respectful.
- **Reliable foundations:** scheduling and task state must not depend on an LLM.
- **Provider-independent core:** the first adapter uses the common OpenAI-compatible chat-completions protocol. The app UI does not expose BYOP or provider configuration.
- **Privacy by design:** personal routine data is stored locally in this first milestone; server-side model credentials stay on the server.

## Current build

- Responsive voice-first companion interface.
- Browser speech recognition and speech synthesis.
- Spoken onboarding and voice command flow.
- Routine and task capture, completion, and local persistence.
- Reminder scheduling while the app is open.
- Server-side, provider-independent model adapter.
- PWA manifest and installable app shell.
- Demo responses when no model credentials are configured.

## Run locally

Requirements: Node.js 20.9+.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000 in Chrome. Allow microphone access. For best voice support, use Chrome on Android or a Chromium desktop browser.

## Configure the intelligence provider

Set these server-side environment variables in `.env.local`:

- `AI_BASE_URL`: OpenAI-compatible API base URL, e.g. `https://api.example.com/v1`
- `AI_API_KEY`: secret API key
- `AI_MODEL`: model identifier

The server appends `/chat/completions` when needed. Never expose the key in browser code or commit it.

Without credentials, VOITHREAL runs in local demo mode so the voice interface and personal routine workflow can be tested. Demo mode is not a substitute for a connected model.

## Important MVP limitations

- Browser speech recognition support varies by browser and device.
- Browser reminders are best-effort while the app is open. They are not yet guaranteed when the browser is closed or the device is asleep.
- Local-first data currently lives in the browser on that device. Cross-device sync, accounts, encrypted cloud memory, durable server scheduling, and push delivery are future milestones.
- Do not use this MVP for emergency, medical, or safety-critical monitoring.

## Architecture

- `app/`: Next.js application and API route.
- `lib/ai/`: provider-neutral companion interface and OpenAI-compatible adapter.
- `public/`: PWA assets.

## Roadmap

1. Voice-first personal companion (current).
2. Durable scheduling, service worker push, and cross-device identity.
3. Consent-based long-term memory and user-controlled data export/deletion.
4. Public orchestration SDK and developer documentation.
5. Separate private business product built on the orchestration foundation.

## License

MIT
