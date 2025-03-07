import * as React from "react";
import { useSidebar } from "../providers/sidebar";
import { Button, cn } from "@heroui/react";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
} from "@heroui/drawer";
import { IconLayoutSidebarRight } from "@tabler/icons-react";

export const Sidebar = ({ children }: { children: React.ReactNode }) => {
    const { isOpen, toggle } = useSidebar();

    return (
        <Drawer
            isOpen={isOpen}
            placement="left"
            hideCloseButton
            onOpenChange={toggle}
            backdrop="blur"
            motionProps={{
                variants: {
                    enter: {
                        opacity: 1,
                        x: 0,
                        // @ts-ignore
                        duration: 0.3,
                    },
                    exit: {
                        x: -50,
                        opacity: 0,
                        // @ts-ignore
                        duration: 0.3,
                    },
                },
            }}
        >
            <DrawerContent>{children}</DrawerContent>
        </Drawer>
    );
};

function Trigger() {
    const { toggle } = useSidebar();
    return (
        <Button
            size="sm"
            isIconOnly
            variant="light"
            className="text-default-600"
            onPress={toggle}
        >
            <IconLayoutSidebarRight />
        </Button>
    );
}

export function SidebarTrigger() {
    return (
        <div className="">
            <Trigger />
        </div>
    );
}

export function SidebarHeader({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {
    return <DrawerHeader className={cn("", className)} {...props} />;
}

export function SidebarContent({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {
    return (
        <DrawerBody
            className={cn("h-full flex-grow w-full", className)}
            {...props}
        />
    );
}

export function SidebarFooter({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {
    return <DrawerFooter className={cn("", className)} {...props} />;
}
