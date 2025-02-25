import * as React from "react";
import { useSidebar } from "../providers/sidebar";
import { Button, cn } from "@heroui/react";
import { motion } from "framer-motion";
import { IconLayoutSidebarRight } from "@tabler/icons-react";

export const Sidebar = ({ children }: { children: React.ReactNode }) => {
    const { isOpen } = useSidebar();

    return (
        <motion.div
            className="flex flex-col w-[400px] h-screen bg-default-50/75 shadow-md overflow-hidden"
            initial={{ width: 400 }}
            animate={{ width: isOpen ? 400 : 0 }}
            transition={{ duration: 0.2 }}
        >
            <motion.div
                className="p-4"
                initial={{ opacity: 1, x: 0 }}
                animate={{ opacity: isOpen ? 1 : 0, x: isOpen ? 0 : -50 }}
                transition={{ duration: 0.1 }}
            >
                {children}
            </motion.div>
        </motion.div>
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
        <div className="flex-grow">
            <Trigger />
        </div>
    );
}

export function SidebarHeader({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {
    return <div className={cn("", className)} {...props} />;
}

export function SidebarContent({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {
    return (
        <div className={cn("h-full flex-grow min-w-0", className)} {...props} />
    );
}

export function SidebarFooter({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {
    return <div className={cn("", className)} {...props} />;
}
