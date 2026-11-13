# The Quiet Room setup

The Quiet Room is a supportive AI conversation feature, not a therapy or crisis service.

## Cloudflare Pages Workers AI binding

Cloudflare Pages treats Workers AI as a non-inheritable binding when Wrangler environments are configured. Therefore Miumi's `wrangler.jsonc` declares the `AI` binding at the top level and explicitly for both `env.production` and `env.preview`.

Current project configuration:
- Project: `miumiapp`
- Pages build output: `./dist`
- Runtime compatibility flag: `nodejs_compat`
- Workers AI binding: `AI` in production and preview

The Git-integrated Cloudflare Pages project is set to deploy the `main` branch automatically. After a new deployment containing this configuration finishes successfully, the API health endpoint `/api/quiet-room` should report `configured: true`.

Because Wrangler is the source of truth, the dashboard may show **Managed by Wrangler** and disable its Add button. Do not try to add a duplicate dashboard binding.

## API routing

Miumi's TanStack Start app uses a custom Cloudflare Worker entry point in `src/server.ts`. The `/api/quiet-room` route is handled directly in that Worker before all other requests are forwarded to TanStack Start. This is required for Pages advanced mode, where a generated `_worker.js` takes control of the domain and the separate `/functions` directory is ignored.

## Free usage and billing

Cloudflare Workers AI has a daily free allocation on the Workers Free plan. Keep the account on the Free plan and do not enable paid billing. Requests stop when the daily free allocation is exhausted. Some models require a paid plan; the selected `@cf/zai-org/glm-4.7-flash` model is listed as available on the Free plan. Check Cloudflare's current pricing before use.

## Privacy and experience

- Text chat calls the same-origin `/api/quiet-room` endpoint.
- The server does not write conversation history to a database.
- The page keeps the current conversation in component memory only; leaving or refreshing clears it.
- Browser speech recognition is optional and requires user permission. Voice transcription may be handled by the browser's speech service. Browser speech synthesis reads companion replies aloud.
- The 3D companion is rendered in the browser with Three.js.
- This is supportive reflection, not professional mental-health care. Avoid entering identifying or highly sensitive information.
