import { useState } from "react";
import { ipcLink } from "electron-trpc/renderer";
import superjson from "superjson";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Page from "./home/page";
import { NextUIProvider } from "@nextui-org/react";
import { ThemeProvider } from "./providers/theme.tsx";
import { trpcReact } from "./libs/trpc.ts";

function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpcReact.createClient({
      links: [ipcLink()],
      transformer: superjson,
    }),
  );

  return (
    <trpcReact.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <NextUIProvider>
            <Page />
          </NextUIProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </trpcReact.Provider>
  );
}

export default App;
