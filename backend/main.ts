import { app, BrowserWindow, shell } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createIPCHandler } from "electron-trpc/main";
import { router } from "./trpc";
import path from "node:path";
import fs from "node:fs";
import { ipcMain } from "electron";

// @ts-ignore
export const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pdfjsDistPath = path.dirname(require.resolve("pdfjs-dist/package.json"));
const pdfWorkerPath = path.join(
    pdfjsDistPath,
    "legacy/build",
    "pdf.worker.min.mjs",
);

fs.cpSync(pdfWorkerPath, "./dist-electron/pdf.worker.min.mjs", {
    recursive: true,
});
// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, "..");

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
    ? path.join(process.env.APP_ROOT, "public")
    : RENDERER_DIST;

let win: BrowserWindow | null;

function createWindow() {
    win = new BrowserWindow({
        icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
        webPreferences: {
            preload: path.join(__dirname, "preload.mjs"),
        },
    });
    //  win.setMenu(null);
    // Test active push message to Renderer-process.
    win.webContents.on("did-finish-load", () => {
        win?.webContents.send(
            "main-process-message",
            new Date().toLocaleString(),
        );
    });

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL);
    } else {
        // win.loadFile('dist/index.html')
        win.loadFile(path.join(RENDERER_DIST, "index.html"));
    }

    createIPCHandler({ router, windows: [win] });
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
        win = null;
    }
});

app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
app.on("web-contents-created", (_, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url); // Opens in the system browser
        return { action: "deny" }; // Prevents Electron from opening a new window
    });
});

app.whenReady().then(createWindow);

ipcMain.handle("get-worker-path", () => {
    return pdfWorkerPath;
});
