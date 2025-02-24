import { trpcReact } from "../libs/trpc";
import { SidebarTrigger } from "./app-sidebar";
import { PreferencesMenu } from "./preferences";
import { withSettingsModal } from "./settings-modal";

export function Navigation() {
    const { data } = trpcReact.getConfig.useQuery();
    const { Component: SettingsModal, open: openSettings } = withSettingsModal(
        data?.value,
    );
    console.log(data);
    return (
        <>
            <nav className="flex flex-grow items-center justify-between w-[100svw] px-4 min-h-16 border-b border-b-default-100">
                <SidebarTrigger />
                <PreferencesMenu Modal={SettingsModal} open={openSettings} />
            </nav>
        </>
    );
}
