import { defineConfig, normalizePath } from "vite";
import path from "node:path";
import electron from "vite-plugin-electron/simple";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const pdfjsDistPath = path.dirname(require.resolve("pdfjs-dist/package.json"));
const cMapsDir = normalizePath(path.join(pdfjsDistPath, "cmaps"));

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        viteStaticCopy({
            targets: [
                {
                    src: cMapsDir,
                    dest: "",
                },
            ],
        }),
        electron({
            main: {
                // Shortcut of `build.lib.entry`.
                entry: "backend/main.ts",
                vite: {
                    build: {
                        rollupOptions: {
                            external: ["canvas"],
                        },
                    },
                },
            },
            preload: {
                // Shortcut of `build.rollupOptions.input`.
                // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
                input: path.join(__dirname, "backend/preload.ts"),
            },
            // Ployfill the Electron and Node.js API for Renderer process.
            // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
            // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
            renderer:
                process.env.NODE_ENV === "test"
                    ? // https://github.com/electron-vite/vite-plugin-electron-renderer/issues/78#issuecomment-2053600808
                      undefined
                    : {},
        }),
    ],
    esbuild: {
        supported: {
            "top-level-await": true,
        },
        target: "esnext",
    },
    optimizeDeps: {
        esbuildOptions: {
            target: "esnext",
            supported: {
                "top-level-await": true,
            },
        },
    },
});
