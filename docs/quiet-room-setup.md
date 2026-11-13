# The Quiet Room setup

The Quiet Room is a supportive AI conversation feature, not a therapy or crisis service.

## Connect the free Cloudflare AI service

The Quiet Room uses Cloudflare Workers AI through a server-side Pages binding. It does not need an OpenAI API key or a payment card when the project stays on Cloudflare's Workers Free plan and within its free daily allocation.

1. Open the Cloudflare dashboard and select the account that hosts the Miumi Pages project.
2. Open **Workers & Pages** and select the Miumi Pages project.
3. Open **Settings → Bindings**.
4. Choose **Add → Workers AI**.
5. Set the variable name to exactly `AI`.
6. Add the binding to **Production**. Repeat for **Preview** only if you want preview deployments to use it.
7. Save the binding and redeploy the latest deployment.

The Pages Function uses the Cloudflare-hosted `@cf/zai-org/glm-4.7-flash` model. No provider API key is stored in the repository or browser.

## Free usage limits

Cloudflare documents a 10,000-Neuron daily free allocation on the Workers Free plan. The allocation resets daily. When the Free-plan allowance is exhausted, further AI requests fail until it resets; do not upgrade to a paid Workers plan or add billing just for this feature. Check the current Cloudflare pricing and account plan before enabling AI.

## Current experience and privacy

- Text chat calls the same-origin `/api/quiet-room` Pages Function.
- The server does not write conversation history to a database.
- The page keeps the current conversation in component memory only; leaving or refreshing clears it.
- Browser speech recognition is optional and requires user permission. Voice transcription may be handled by the browser's speech service. Browser speech synthesis reads companion replies aloud.
- The 3D companion is rendered in the browser with Three.js.
- This is supportive reflection, not professional mental-health care. Avoid entering identifying or highly sensitive information.
