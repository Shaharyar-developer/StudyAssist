import React, { createContext, useState, useEffect, useContext } from "react";
import { trpcReact } from "../libs/trpc";

type Theme = "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [theme, setTheme] = useState<Theme>("light");
    const _setTheme = trpcReact.setTheme.useMutation();
    const _getTheme = trpcReact.getTheme.useQuery();

    useEffect(() => {
        // Get theme from server on component mount
        if (_getTheme.data) {
            setTheme(_getTheme.data as Theme);
        }
    }, [_getTheme.data]);

    useEffect(() => {
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(theme);
        // Persist theme to server when it changes
        _setTheme.mutate(theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};
