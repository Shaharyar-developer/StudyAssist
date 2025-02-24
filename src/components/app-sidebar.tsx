import * as React from "react";
import { useSidebar } from "../providers/sidebar";
import { Button, cn } from "@heroui/react";
import { motion } from "framer-motion";
import { IconLayoutSidebarRight } from "@tabler/icons-react";

export const Sidebar = ({ children }: { children: React.ReactNode }) => {
  const { isOpen, toggle } = useSidebar();
  return (
    <>
      <motion.div
        className={cn(
          `absolute flex w-[350px] flex-col h-[100svh] bg-default-50 rounded-r-3xl z-[1] p-4`,
        )}
        initial={{ x: -350 }}
        animate={
          isOpen
            ? {
                x: 0,
                opacity: 1,
              }
            : {
                x: -350,
                opacity: 0,
              }
        }
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
      <motion.div
        onClick={toggle}
        className={cn(
          "transition-all",
          isOpen
            ? "z-0 absolute h-full w-full bg-background/80"
            : "opacity-0 pointer-events-none",
        )}
      />
    </>
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
  const { isOpen } = useSidebar();
  return (
    <div className={`${isOpen && "hidden"}`}>
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
  return <div className={cn("h-full", className)} {...props} />;
}
export function SidebarFooter({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return <div className={cn("", className)} {...props} />;
}
