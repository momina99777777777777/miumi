# The Quiet Room setup

The Quiet Room is a supportive AI conversation feature, not a therapy or crisis service.

## Cloudflare Pages configuration

Miumi uses the Pages Wrangler configuration file `wrangler.jsonc` as the source of truth. It declares the Workers AI binding named `AI` at the top level, which is inherited by production and preview deployments unless an environment override is added.

The Cloudflare dashboard may label bindings as **Managed by Wrangler** and disable the Add button. This is expected while the repository contains this configuration. Do not try to add a duplicate dashboard binding.

The repository is connected to Cloudflare Pages through Git integration, with the production branch set to `main` and automatic deployments enabled. A new commit should trigger a deployment. After the deployment that includes `wrangler.jsonc` succeeds, the health endpoint `/api/quiet-room` should report `configured: true` if Cloudflare has applied the binding.

## API routing

Miumi's TanStack Start app uses a custom Worker entry point in `src/server.ts`. The `/api/quiet-room` route is handled in that Worker before normal app requests are forwarded to TanStack Start. This is necessary for Pages advanced mode, where Cloudflare ignores the separate `/functions` directory when a `_worker.js` is present in the build output.

## Free usage and billing

Workers AI has a daily free allocation on the Workers Free plan. Keep the account on the Free plan and do not enable paid billing. Requests may stop after the free daily allowance is exhausted. Do not upgrade to a paid plan for this feature.

The selected model is `@cf/zai-org/glm-4.7-flash`. Check Cloudflare's current model pricing and Free-plan limits before use, because Cloudflare can change availability and limits.

## Privacy and experience

- The browser sends text to the same-origin `/api/quiet-room` endpoint.
- The server does not write conversation history to a database.
- The page keeps the current conversation in component memory only; leaving or refreshing clears it.
- Browser speech recognition is optional and requires user permission. Voice transcription may be handled by the browser's speech service. Browser speech synthesis reads companion replies aloud.
- The 3D companion is rendered in the browser with Three.js.
- This is supportive reflection, not professional mental-health care. Avoid entering identifying or highly sensitive information.
