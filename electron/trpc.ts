import z from "zod";
import { initTRPC } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import { EventEmitter } from "events";
import superjson from "superjson";
import Store from "electron-store";
import { dialog } from "electron/main";

const ee = new EventEmitter();
const store = new Store();

const t = initTRPC.create({ isServer: true, transformer: superjson });

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
});

export type AppRouter = typeof router;
