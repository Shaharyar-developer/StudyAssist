import {
    IconPlayerPauseFilled,
    IconPlayerPlayFilled,
    IconPlus,
    IconRestore,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { trpcReact } from "../libs/trpc";
import { SidebarTrigger } from "./app-sidebar";
import { withInitPaperForm } from "./init-paper-form";
import { PreferencesMenu } from "./preferences";
import { withSettingsModal } from "./settings-modal";
import { Button, ButtonGroup, cn } from "@heroui/react";
import { usePaper } from "../providers/paper";
import { useTimer } from "../hooks/usePaperTimer";
import { Progress } from "@heroui/progress";
import { transformValue } from "../libs/utils";

export function Navigation() {
    const { data } = trpcReact.getConfig.useQuery();
    const { open: openForm } = withInitPaperForm();

    const { Component: SettingsModal, open: openSettings } = withSettingsModal(
        data?.value,
    );
    return (
        <>
            <nav className="grid grid-cols-3 justify-between items-center px-4 min-h-20 w-full">
                <SidebarTrigger />
                <div className="w-full">
                    <Timer />
                </div>
                <div className="flex gap-8 justify-end">
                    <Button
                        variant="flat"
                        color="primary"
                        endContent={<IconPlus />}
                        onPress={openForm}
                    >
                        Add Paper
                    </Button>
                    <PreferencesMenu
                        Modal={SettingsModal}
                        open={openSettings}
                    />
                </div>
            </nav>
        </>
    );
}
function Timer() {
    const { selectedPaper, attemptStarted, setAttemptStarted } = usePaper();
    const { isRunning, isPaused, time, play, pause, reset } = useTimer();
    return (
        <motion.div
            initial={{
                opacity: 0,
                y: -50,
            }}
            animate={{
                opacity: selectedPaper ? 1 : 0,
                y: selectedPaper ? 0 : -50,
            }}
            className="flex justify-center w-full"
        >
            <div className="relative min-w-80 mb-1.5">
                <div className="rounded-full relative z-50 bg-default-100 border-2 border-default-200 px-5 py-1 max-w-full mx-auto min-h-14 flex justify-between">
                    {attemptStarted ? (
                        <>
                            <div className="flex flex-col w-full justify-center pt-1 z-10">
                                <span
                                    className={cn(
                                        "text-2xl text-foreground-400 transition-all",
                                        isRunning && "text-foreground-600",
                                    )}
                                >
                                    {`${String(Math.floor(time / 60)).padStart(2, "0")}:${String(time % 60).padStart(2, "0")}`}
                                    {" / "}{" "}
                                    {`${String(selectedPaper?.metadata?.duration || 0).padStart(2, "0")}:00`}
                                </span>
                                <Progress
                                    value={transformValue(
                                        time,
                                        0,
                                        selectedPaper?.metadata?.duration! * 60,
                                    )}
                                    size="sm"
                                />
                            </div>
                            <div className="flex items-center ml-5">
                                <ButtonGroup
                                    isDisabled={!selectedPaper}
                                    radius="full"
                                    isIconOnly
                                    size="md"
                                    variant="solid"
                                    color="primary"
                                    className="z-50 relative"
                                >
                                    <Button
                                        onPress={() => {
                                            if (isPaused) return play();
                                            isRunning ? pause() : play();
                                        }}
                                    >
                                        {isRunning && !isPaused ? (
                                            <IconPlayerPauseFilled />
                                        ) : (
                                            <IconPlayerPlayFilled />
                                        )}
                                    </Button>
                                </ButtonGroup>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center w-full z-10 text-2xl text-foreground-500">
                            Duration{": "}
                            {`${String(selectedPaper?.metadata?.duration || 0)}`}{" "}
                            Minutes
                        </div>
                    )}
                </div>
                <motion.div
                    animate={{
                        x: isPaused ? 55 : 0,
                    }}
                    className="absolute h-full w-1/2 rounded-full  top-0 flex items-center justify-end right-0 -z-0 "
                >
                    <Button
                        onPress={() => {
                            reset();
                            setAttemptStarted(false);
                        }}
                        isIconOnly
                        variant="flat"
                        color="danger"
                        className=""
                        size="lg"
                        radius="full"
                    >
                        <IconRestore />
                    </Button>
                </motion.div>
            </div>
        </motion.div>
    );
}
