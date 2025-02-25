import { MainTestsContent } from "../home/main/tests";
import { SidebarContent, SidebarFooter, SidebarHeader } from "./app-sidebar";

export const SidebarOptions = () => {
    return (
        <>
            <SidebarHeader></SidebarHeader>
            <SidebarContent>
                <MainTestsContent />
            </SidebarContent>
            <SidebarFooter></SidebarFooter>
        </>
    );
};
