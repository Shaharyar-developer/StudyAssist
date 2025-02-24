import { createContext, useState, useContext } from "react";

export type SidebarContext = {
  isOpen: boolean;
  toggle: () => void;
  selection: string;
  setSelection: (selection: string) => void;
};

const SidebarContext = createContext<SidebarContext | null>(null);

export const SidebarProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selection, setSelection] = useState("photos");

  const toggle = () => setIsOpen(!isOpen);

  return (
    <SidebarContext.Provider
      value={{ isOpen, toggle, selection, setSelection }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};
