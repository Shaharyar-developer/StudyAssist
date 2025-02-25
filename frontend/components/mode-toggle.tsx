import React from "react";
import { useTheme } from "../providers/theme";
import { Button } from "@heroui/react";
import {
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
} from "@heroui/dropdown";
import { IconMoon, IconMoon2, IconSun } from "@tabler/icons-react";

export const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <Dropdown>
            <DropdownTrigger>
                <Button
                    startContent={
                        theme === "light" ? <IconSun /> : <IconMoon2 />
                    }
                    className="capitalize"
                    variant="flat"
                    fullWidth
                >
                    {theme}
                </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Static Actions">
                <DropdownItem
                    startContent={<IconSun />}
                    key={"light"}
                    onPress={theme === "dark" ? toggleTheme : undefined}
                >
                    Light
                </DropdownItem>
                <DropdownItem
                    startContent={<IconMoon />}
                    key={"dark"}
                    onPress={theme === "light" ? toggleTheme : undefined}
                >
                    Dark
                </DropdownItem>
            </DropdownMenu>
        </Dropdown>
    );
};

export default ThemeToggle;
