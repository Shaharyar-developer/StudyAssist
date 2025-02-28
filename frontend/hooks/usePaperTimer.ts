import { useState, useEffect, useRef, useContext } from "react";
import { TimerContext, TimerContextType } from "../providers/timer";

export const useTimer = (): TimerContextType => {
    const context = useContext(TimerContext);
    if (!context) {
        throw new Error("useTimer must be used within a TimerProvider");
    }
    return context;
};
export const _usePaperTimer = () => {
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const intervalRef = useRef<NodeJS.Timer | null>(null);

    useEffect(() => {
        if (isRunning && !isPaused) {
            intervalRef.current = setInterval(() => {
                setTime((prev) => prev + 1);
            }, 1000);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isRunning, isPaused]);

    const play = () => {
        setIsRunning(true);
        setIsPaused(false);
    };

    const pause = () => {
        if (isRunning) {
            setIsPaused(true);
        }
    };

    const reset = () => {
        setIsRunning(false);
        setIsPaused(false);
        setTime(0);
    };

    return {
        time,
        isRunning,
        isPaused,
        play,
        pause,
        reset,
    };
};
