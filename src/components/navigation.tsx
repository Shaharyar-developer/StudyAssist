import { SidebarTrigger } from "./app-sidebar";

export function Navigation() {
  return (
    <nav className="flex items-center w-full px-4 min-h-16 border-b border-b-default-100">
      <SidebarTrigger />
    </nav>
  );
}
