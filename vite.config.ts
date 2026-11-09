import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// On Netlify, nitro's `netlify` preset serves every route through an SSR function,
// so the SPA shell prerender (which needs a local preview server) is skipped there.
const isNetlifyBuild = !!process.env.NETLIFY;

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    spa: isNetlifyBuild
      ? { enabled: false }
      : {
          enabled: true,
          prerender: {
            outputPath: "/index.html",
          },
        },
  },
});
