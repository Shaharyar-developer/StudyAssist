import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../backend/trpc";

export const trpcReact = createTRPCReact<AppRouter>();
