import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    useDisclosure,
    ModalFooter,
} from "@heroui/modal";
import { Button, Input, Spinner } from "@heroui/react";
import { toast } from "sonner";
import { trpcReact } from "../libs/trpc";
import { Env } from "../../backend/trpc.ts";
import { useState } from "react";
import { IconCheck } from "@tabler/icons-react";
import { ThemeToggle } from "../components/mode-toggle.tsx";

export const withSettingsModal = (env: Env | undefined) => {
    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
    const settings = (
        <>
            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>Preferences</ModalHeader>
                            <ModalBody>
                                {env ? <Settings props={env} /> : <Spinner />}
                                <ThemeToggle />
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    onPress={onClose}
                                    fullWidth
                                    variant="bordered"
                                >
                                    Close
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
    return {
        Component: settings,
        open: onOpen,
        close: onClose,
    };
};
function Settings({ props }: { props: Env }) {
    const [genAiApiKey, setGenAiApiKey] = useState(props.GENAI_KEY || "");
    const [mistralApiKey, setMistralApiKey] = useState(props.MISTRAL_KEY || "");
    const { mutateAsync, isLoading: isMutationLoading } =
        trpcReact.setInConfig.useMutation();
    if (isMutationLoading) {
        return <Spinner />;
    }
    const handleGenAiKeySubmit = async () => {
        const res = await mutateAsync({ GENAI_KEY: genAiApiKey });
        res.success
            ? toast.success("API Key updated")
            : toast.error("Failed to update API Key");
    };
    const handleMistralKeySubmit = async () => {
        const res = await mutateAsync({ MISTRAL_KEY: mistralApiKey });
        res.success
            ? toast.success("API Key updated")
            : toast.error("Failed to update API Key");
    };

    return (
        <div className="flex flex-col space-y-4">
            <Input
                defaultValue={genAiApiKey}
                onChange={(e) => setGenAiApiKey(e.target.value)}
                value={genAiApiKey}
                label="Google API Key"
                type="password"
                isRequired
                endContent={
                    genAiApiKey !== props.GENAI_KEY ? (
                        <Button
                            onPress={handleGenAiKeySubmit}
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="primary"
                        >
                            <IconCheck />
                        </Button>
                    ) : null
                }
                name="google-api-key"
            />
            <Input
                defaultValue={mistralApiKey}
                onChange={(e) => setMistralApiKey(e.target.value)}
                value={mistralApiKey}
                label="Mistral API Key"
                type="password"
                isRequired
                endContent={
                    mistralApiKey !== props.MISTRAL_KEY && (
                        <Button
                            onPress={handleMistralKeySubmit}
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="primary"
                        >
                            <IconCheck />
                        </Button>
                    )
                }
            />
        </div>
    );
}
