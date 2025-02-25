import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./frontend/**/*.{js,ts,jsx,tsx}",
        "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    plugins: [
        heroui({
            layout: {
                radius: { small: "0.75rem", medium: "1rem", large: "1.25rem" },
            },
            themes: {
                dark: {},
            },
        }),
    ],
};
