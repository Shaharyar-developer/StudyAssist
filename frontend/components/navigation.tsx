import { IconPlus } from "@tabler/icons-react";
import { trpcReact } from "../libs/trpc";
import { SidebarTrigger } from "./app-sidebar";
import { withInitPaperForm } from "./init-paper-form";
import { PreferencesMenu } from "./preferences";
import { withSettingsModal } from "./settings-modal";
import { Button } from "@heroui/react";

export function Navigation() {
    const { data } = trpcReact.getConfig.useQuery();
    const { Component: FormModal, open: openForm } = withInitPaperForm();

    const { Component: SettingsModal, open: openSettings } = withSettingsModal(
        data?.value,
    );
    return (
        <>
            <nav className="flex flex-grow gap-8 items-center px-4 min-h-20 w-full">
                <SidebarTrigger />
                <Button
                    variant="flat"
                    color="primary"
                    endContent={<IconPlus />}
                    onPress={openForm}
                >
                    Add Paper
                </Button>

                <PreferencesMenu Modal={SettingsModal} open={openSettings} />
            </nav>
            {FormModal}
        </>
    );
}
