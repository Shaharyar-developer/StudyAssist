import z from "zod";
import { initTRPC } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import { EventEmitter } from "events";
import superjson from "superjson";
import Store from "electron-store";
import { ok, err } from "../src/types/fn";
import { TestsStore } from "./handlers/test-files";

const ee = new EventEmitter();
const store = new Store();
const testStore = new TestsStore();

const t = initTRPC.create({ isServer: true, transformer: superjson });

export const envSchema = z.object({
    GENAI_KEY: z.string().optional(),
});
export type Env = z.infer<typeof envSchema>;

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

    // Test management
    createTest: t.procedure
        .input(
            z.object({
                title: z.string().nonempty(),
                filePath: z.string().nonempty(),
            }),
        )
        .mutation(async ({ input }) => {
            const res = await testStore.addTest(input.filePath, input.title);
            return res.success ? ok(res) : err(res.reason);
        }),
    getTests: t.procedure.query(async () => {
        const res = await testStore.getTests();
        return res.success ? ok(res) : err(res.reason);
    }),
    getTestById: t.procedure.input(z.string()).query(async ({ input }) => {
        const res = await testStore.getTestById(input);
        return res.success ? ok(res) : err(res.reason);
    }),

    // Config management
    getConfig: t.procedure.query(() => {
        let env = store.get("env") || {};
        store.set("env", env);
        try {
            const parsed = envSchema.safeParse(env);
            return parsed.success
                ? ok(parsed.data)
                : err("Failed to parse env");
        } catch {
            return err("Failed to parse env");
        }
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

export type AppRouter = typeof router;
