import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: { port: 5173 },
  plugins: [
    react(),

    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["favicon.ico", "favicon.svg", "icons.svg"],
      manifest: {
        name: "عدل گشت",
        short_name: "عدل گشت",
        description: "ثبت‌نام مسافر و ثبت موقعیت منزل",

        theme_color: "#ffffff",
        background_color: "#ffffff",

        display: "standalone",
        display_override: ["standalone", "minimal-ui"],
        orientation: "portrait",

        lang: "fa",
        dir: "rtl",

        scope: "/",
        start_url: "/",

        categories: ["travel", "productivity"],

        icons: [
          {
            src: "/icons/pwa-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/icons/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],

        shortcuts: [
          {
            name: "ثبت موقعیت منزل",
            short_name: "موقعیت منزل",
            url: "/",
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2,ttf}"],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "adl-images",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
});
