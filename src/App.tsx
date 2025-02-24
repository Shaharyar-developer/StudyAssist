import { useState } from "react";
import { ipcLink } from "electron-trpc/renderer";
import superjson from "superjson";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Page from "./home/page";
import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider } from "./providers/theme.tsx";
import { trpcReact } from "./libs/trpc.ts";
import { SidebarProvider } from "./providers/sidebar.tsx";
import { Sidebar } from "./components/app-sidebar.tsx";
import { SidebarOptions } from "./components/sidebar-content.tsx";
import { Toaster } from "sonner";

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
          <HeroUIProvider>
            <SidebarProvider>
              <Sidebar>
                <SidebarOptions />
              </Sidebar>
              <Page />
              <Toaster />
            </SidebarProvider>
          </HeroUIProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </trpcReact.Provider>
  );
}

export default App;
