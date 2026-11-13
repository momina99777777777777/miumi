# The Quiet Room

The Quiet Room is a supportive, non-clinical conversation space, not therapy or a crisis service.

## Modes

- **Cloudflare AI mode:** When the Pages runtime provides the Workers AI binding named `AI`, the server uses the `@cf/zai-org/glm-4.7-flash` model for generated replies.
- **Free guided mode:** If the binding is missing or the AI request fails, the server returns a built-in supportive prompt matched to common conversation topics. The interface labels this clearly; it is not generative AI and does not send the message to an external AI provider.

## Deployment configuration

The Git repository includes `wrangler.jsonc` with Pages output `./dist`, Node compatibility, and the `AI` binding. It explicitly declares the binding at top level and under production and preview environments. The Git-integrated Cloudflare Pages project uses `main` for production and automatic deployments.

The health endpoint is `/api/quiet-room`. It reports `configured: true` and `provider: cloudflare-workers-ai` only when the runtime binding is present. Otherwise it reports guided-free mode.

If the binding still does not appear, use Cloudflare's recommended command in the project checkout to download the actual dashboard configuration: `npx wrangler pages download config miumiapp`. Review the result before deploying; do not guess the dashboard's existing configuration.

## Privacy and safety

- The app does not save the conversation to a database. Messages are held in page memory and disappear when the page is closed or refreshed.
- Browser speech recognition requires microphone permission. Browser speech synthesis reads replies aloud.
- Avoid sharing identifying or highly sensitive details.
- The companion is not a therapist, doctor, or crisis service. For serious distress or danger, reach out to a trusted adult or emergency support.
