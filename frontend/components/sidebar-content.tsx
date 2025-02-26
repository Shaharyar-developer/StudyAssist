import { MainPapersContent } from "../home/main/papers";
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
