# The Quiet Room setup

The Quiet Room is a supportive AI conversation feature, not a therapy or crisis service.

## Enable AI replies on Cloudflare Pages

The browser never receives the AI provider secret. The Pages Function at `functions/api/quiet-room.ts` reads it server-side.

1. Open the Cloudflare dashboard and select the Pages project connected to this repository.
2. Open **Settings → Environment variables** (or **Functions → Environment variables**, depending on the dashboard layout).
3. Add a secret named `OPENAI_API_KEY` with an API key from the account owner.
4. Add it for both **Production** and **Preview** if you want both deployments to support the feature.
5. Optionally set `QUIET_ROOM_MODEL` to a model enabled for that API account. The default is `gpt-4.1-mini`.
6. Redeploy the latest commit.

Do not put the key in source code, a `VITE_*` variable, or any client-side setting. Keep provider spending limits enabled.

## Current experience

- Text chat calls the same-origin `/api/quiet-room` Pages Function.
- The server sends `store: false` and does not write conversation history to a database.
- The page keeps the current conversation in component memory only; leaving or refreshing clears it.
- Browser speech recognition is optional and requires user permission. Browser speech synthesis reads companion replies aloud.
- The illustrated companion is a layered CSS scene with depth and speaking animation. It is not yet a downloadable rigged 3D character model.
- This is supportive reflection, not professional mental-health care. Avoid entering identifying or highly sensitive information.
