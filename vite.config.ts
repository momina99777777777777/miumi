
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isNetlifyBuild = !!process.env.NETLIFY;
const isCloudflareBuild = !!process.env.CF_PAGES;

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    spa: isNetlifyBuild || isCloudflareBuild
      ? { enabled: false }
      : {
          enabled: true,
          prerender: {
            outputPath: "/index.html",
          },
        },
  },
});
