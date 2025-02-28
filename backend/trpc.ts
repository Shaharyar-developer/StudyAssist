import z from "zod";
import { initTRPC } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import { EventEmitter } from "events";
import superjson from "superjson";
import Store from "electron-store";
import { ok, err } from "../frontend/types/fn";
import { PaperStore } from "./handlers/papers";
import { dialog } from "electron";

const ee = new EventEmitter();
const store = new Store();
const paperStore = new PaperStore();

const t = initTRPC.create({ isServer: true, transformer: superjson });

export const envSchema = z.object({
    GENAI_KEY: z.string().optional(),
});
export type Env = z.infer<typeof envSchema>;

const _getConfig = () => {
    let env = store.get("env") || {};
    store.set("env", env);
    try {
        const parsed = envSchema.safeParse(env);
        return parsed.success ? ok(parsed.data) : err("Failed to parse env");
    } catch {
        return err("Failed to parse env");
    }
};

export const router = t.router({
    // Example Subscription procedure
    subscription: t.procedure.subscription(() => {
        return observable((emit) => {
            function onGreet(text: string) {
                emit.next({ text });
            }
            ee.on("greeting", onGreet);
            return () => ee.off("greeting", onGreet);
        });
    }),

    // Theme management
    setTheme: t.procedure.input(z.string()).mutation(({ input }) => {
        store.set("theme", input);
    }),
    getTheme: t.procedure.query(() => store.get("theme") || "dark"),

    // Paper management
    createPaper: t.procedure.mutation(async () => {
        const file = await dialog.showOpenDialog({
            properties: ["openFile"],
            filters: [{ extensions: ["pdf"], name: "Documents" }],
        });
        console.log(file.filePaths);
        if (!file.filePaths[0]) {
            return err("No file selected");
        }
        const res = await paperStore.addPaper(file.filePaths[0]);
        return res.success ? ok(res) : err(res.reason);
    }),
    getPapers: t.procedure.query(async () => {
        const res = await paperStore.getPapers();
        return res.success ? ok(res.value) : err(res.reason);
    }),
    getPaperPdf: t.procedure.input(z.string()).query(async ({ input }) => {
        const res = await paperStore.getPaperPdf(input);
        return res.success ? ok(res.value) : err("Failed to get paper");
    }),
    getPaperById: t.procedure.input(z.string()).mutation(async ({ input }) => {
        const res = await paperStore.getPaperById(input);
        return res.success ? ok(res.value) : err(res.reason);
    }),

    // Config management
    getConfig: t.procedure.query(() => {
        return _getConfig();
    }),
    setInConfig: t.procedure.input(envSchema).mutation(({ input }) => {
        try {
            const vals = store.get("env") || {};
            store.set("env", { ...vals, ...input });
            return ok({});
        } catch {
            return err("Failed to set env");
        }
    }),
});
export { _getConfig as getConfig };
export type AppRouter = typeof router;
