# The Quiet Room setup

The Quiet Room is a supportive AI conversation feature, not a therapy or crisis service.

## Connect the free Cloudflare AI service

Miumi's Cloudflare Pages project is configured in `wrangler.jsonc`. That file keeps the existing Pages output directory (`./dist`), the `nodejs_compat` runtime flag, and the Workers AI binding named `AI`.

1. The `wrangler.jsonc` file is committed to the `main` branch.
2. Cloudflare Pages should build and deploy the latest `main` commit.
3. The Pages Function at `functions/api/quiet-room.ts` reads the `AI` binding and calls Cloudflare Workers AI. No OpenAI key is required.

Because Wrangler is the source of truth, the Cloudflare dashboard may show the binding but keep its Add button disabled. Do not try to add a duplicate binding in the dashboard.

## Free usage limits

Cloudflare documents a free allocation of 10,000 Neurons per day on the Workers Free plan. The daily allowance resets at 00:00 UTC. When the free allowance is exhausted, further requests fail until the reset; using more than the free allocation requires moving to Workers Paid. Keep the account on the Free plan and do not enable paid billing.

## Current experience and privacy

- Text chat calls the same-origin `/api/quiet-room` Pages Function.
- The server does not write conversation history to a database.
- The page keeps the current conversation in component memory only; leaving or refreshing clears it.
- Browser speech recognition is optional and requires user permission. Voice transcription may be handled by the browser's speech service. Browser speech synthesis reads companion replies aloud.
- The 3D companion is rendered in the browser with Three.js.
- This is supportive reflection, not professional mental-health care. Avoid entering identifying or highly sensitive information.
