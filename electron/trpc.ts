import z from "zod";
import { initTRPC } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import { EventEmitter } from "events";
import superjson from "superjson";
import Store from "electron-store";
import { NewTest } from "./handlers/test-files";

const ee = new EventEmitter();
const store = new Store();

const t = initTRPC.create({ isServer: true, transformer: superjson });

const envSchema = z.object({
    GENAI_KEY?: z.string().optional(),
});

export const router = t.router({
    greeting: t.procedure.input(z.object({ name: z.string() })).query((req) => {
        const { input } = req;

        ee.emit("greeting", `Greeted ${input.name}`);
        return {
            text: `Hello ${input.name}` as const,
        };
    }),
    subscription: t.procedure.subscription(() => {
        return observable((emit) => {
            function onGreet(text: string) {
                emit.next({ text });
            }

            ee.on("greeting", onGreet);

            return () => {
                ee.off("greeting", onGreet);
            };
        });
    }),
    setTheme: t.procedure.input(z.string()).mutation((req) => {
        const { input } = req;
        store.set("theme", input);
    }),
    getTheme: t.procedure.query(() => {
        return store.get("theme") || "dark";
    }),
    createTest: t.procedure
        .input(
            z.object({
                title: z.string().nonempty(),
                filePath: z.string().nonempty(),
            }),
        )
        .mutation(async ({ input }) => {
            console.log(input);
            const test = new NewTest({
                name: input.title,
                fileUrl: input.filePath,
            });
            const res = test.getText();
            console.log(res);
        }),
    getEnv: t.procedure.query(() => {
        const env = store.get("env");
        return env ? ok(envSchema.parse(env)) : err("No env found");
    }),
    setInEnv: t.procedure.input(envSchema).mutation(({ input }) => {
        try {
        const vals = store.get("env") || {};
        store.set("env", { ...vals, ...input });
        return ok({});
        } catch {
            return err("Failed to set env");
        }
    })
});

export type AppRouter = typeof router;
