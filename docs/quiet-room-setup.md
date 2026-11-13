# The Quiet Room setup

The Quiet Room is a supportive AI conversation feature, not a therapy or crisis service.

## Connect Workers AI using Cloudflare dashboard

Miumi routes `/api/quiet-room` through its main Cloudflare Worker entry point in `src/server.ts`. The handler expects a Cloudflare Workers AI binding named `AI`.

The repository no longer includes a Wrangler configuration file. This returns Pages runtime configuration management to the Cloudflare dashboard so the binding can be added there.

1. Wait until the latest Git-integrated deployment from the `main` branch completes.
2. Open the Pages project in Cloudflare and go to **Settings → Bindings**.
3. Select the **Production** environment.
4. Choose **Add → Workers AI**.
5. Set the variable name to exactly `AI`.
6. Save the binding.
7. Repeat for **Preview** only if you want preview deployments to use AI.
8. Redeploy the latest production deployment so the binding becomes available at runtime.

Cloudflare documentation: https://developers.cloudflare.com/pages/functions/bindings/#workers-ai

## Free usage and billing

Workers AI has a 10,000-Neuron daily free allocation on the Workers Free plan. Usage above this allocation requires the Workers Paid plan. Keep the account on the Free plan and do not enable paid billing. Some model choices may require a paid billing method; do not select those models.

## Current experience and privacy

- Text chat calls the same-origin `/api/quiet-room` endpoint.
- The server does not write conversation history to a database.
- The page keeps the current conversation in component memory only; leaving or refreshing clears it.
- Browser speech recognition is optional and requires user permission. Voice transcription may be handled by the browser's speech service. Browser speech synthesis reads companion replies aloud.
- The 3D companion is rendered in the browser with Three.js.
- This is supportive reflection, not professional mental-health care. Avoid entering identifying or highly sensitive information.
