# The Quiet Room setup

The Quiet Room is a supportive AI conversation feature, not a therapy or crisis service.

## How the API is routed

Miumi's TanStack Start app uses a custom Cloudflare Worker entry point in `src/server.ts`. Cloudflare Pages advanced mode ignores the separate `/functions` directory whenever the build outputs a `_worker.js` file. For that reason, the live `/api/quiet-room` endpoint is handled directly by `src/server.ts`, before normal requests are forwarded to TanStack Start.

The older `functions/api/quiet-room.ts` file remains as a fallback for deployments that use Pages' standard Functions routing instead of advanced mode.

## Connect the free Cloudflare AI service

Miumi's Cloudflare Pages project is configured in `wrangler.jsonc`. That file keeps the existing Pages output directory (`./dist`), the `nodejs_compat` runtime flag, and the Workers AI binding named `AI`.

1. The `wrangler.jsonc` file is committed to the `main` branch.
2. Cloudflare Pages should build and deploy the latest `main` commit.
3. The API checks for `env.AI` and calls Cloudflare Workers AI using `@cf/zai-org/glm-4.7-flash`.

No OpenAI API key is required. A GET request to `/api/quiet-room` returns a small JSON health check showing whether the binding is available.

## Free usage limits

Cloudflare documents a free allocation of 10,000 Neurons per day on the Workers Free plan. The daily allowance resets at 00:00 UTC. When the free allowance is exhausted, further requests fail until the reset. On the Workers Paid plan, usage above the free allocation is billed, so keep the account on the Free plan and do not enable paid billing. Some models require a paid billing method; the selected `@cf/zai-org/glm-4.7-flash` model is listed as available on the Free plan.

## Current experience and privacy

- Text chat calls the same-origin `/api/quiet-room` endpoint.
- The server does not write conversation history to a database.
- The page keeps the current conversation in component memory only; leaving or refreshing clears it.
- Browser speech recognition is optional and requires user permission. Voice transcription may be handled by the browser's speech service. Browser speech synthesis reads companion replies aloud.
- The 3D companion is rendered in the browser with Three.js.
- This is supportive reflection, not professional mental-health care. Avoid entering identifying or highly sensitive information.
