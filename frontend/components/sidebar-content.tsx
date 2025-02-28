import { MainPapersContent } from "./papers-list";
import { SidebarContent, SidebarFooter, SidebarHeader } from "./app-sidebar";

export const SidebarOptions = () => {
    return (
        <>
            <SidebarHeader></SidebarHeader>
            <SidebarContent>
                <MainPapersContent />
            </SidebarContent>
            <SidebarFooter></SidebarFooter>
        </>
    );
};
