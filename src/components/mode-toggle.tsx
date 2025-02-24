import React from "react";
import { useTheme } from "../providers/theme";
import { Switch } from "@nextui-org/react";
import { SunIcon, MoonIcon } from "lucide-react";

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Switch
      checked={theme === "dark"}
      onChange={toggleTheme}
      size="lg"
      color="secondary"
      startContent={<SunIcon />}
      endContent={<MoonIcon />}
    />
  );
};

export default ThemeToggle;
