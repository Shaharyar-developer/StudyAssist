import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../electron/trpc";

export const trpcReact = createTRPCReact<AppRouter>();
