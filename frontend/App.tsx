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
import { Navigation } from "./components/navigation.tsx";
import { PaperProvider } from "./providers/paper.tsx";
import { TimerProvider } from "./providers/timer.tsx";

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
                        <PaperProvider>
                            <TimerProvider>
                                <SidebarProvider>
                                    <Sidebar>
                                        <SidebarOptions />
                                    </Sidebar>
                                    <div className="flex flex-col w-full">
                                        <div className="max-h-20 pt-1">
                                            <Navigation />
                                        </div>
                                        <div className="flex-grow p-4 pt-0 h-full flex flex-col">
                                            <Page />
                                        </div>
                                    </div>
                                    <Toaster />
                                </SidebarProvider>
                            </TimerProvider>
                        </PaperProvider>
                    </HeroUIProvider>
                </ThemeProvider>
            </QueryClientProvider>
        </trpcReact.Provider>
    );
}

export default App;
