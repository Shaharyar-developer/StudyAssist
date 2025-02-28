import React, { createContext } from "react";
import { _usePaperTimer } from "../hooks/usePaperTimer"; // Make sure to import the hook

// Define the context type
export interface TimerContextType {
    time: number;
    isRunning: boolean;
    isPaused: boolean;
    play: () => void;
    pause: () => void;
    reset: () => void;
}

// Create the context with a default value of null
export const TimerContext = createContext<TimerContextType | undefined>(
    undefined,
);

// Create the provider component
export const TimerProvider = ({ children }: { children: React.ReactNode }) => {
    const timer = _usePaperTimer();

    return (
        <TimerContext.Provider value={timer}>{children}</TimerContext.Provider>
    );
};
