import React, { createContext, useContext } from "react";
import { usePaperTimer } from "../hooks/usePaperTimer"; // Make sure to import the hook

// Define the context type
interface TimerContextType {
    time: number;
    isRunning: boolean;
    isPaused: boolean;
    play: () => void;
    pause: () => void;
    reset: () => void;
}

// Create the context with a default value of null
const TimerContext = createContext<TimerContextType | undefined>(undefined);

// Create the provider component
export const TimerProvider = ({ children }: { children: React.ReactNode }) => {
    const timer = usePaperTimer();

    return (
        <TimerContext.Provider value={timer}>{children}</TimerContext.Provider>
    );
};

// Custom hook to access the timer context
export const useTimer = (): TimerContextType => {
    const context = useContext(TimerContext);
    if (!context) {
        throw new Error("useTimer must be used within a TimerProvider");
    }
    return context;
};
