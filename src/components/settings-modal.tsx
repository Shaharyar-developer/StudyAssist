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
import { Env } from "../../electron/trpc";
import { useState } from "react";
import { IconCheck } from "@tabler/icons-react";

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
                                {env ? (
                                    <Settings GENAI_KEY={env.GENAI_KEY} />
                                ) : (
                                    <Spinner />
                                )}
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    onPress={onClose}
                                    fullWidth
                                    variant="flat"
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
function Settings(props: Env) {
    const [apiKey, setApiKey] = useState(props.GENAI_KEY || "");
    const { mutateAsync, isLoading: isMutationLoading } =
        trpcReact.setInConfig.useMutation();
    if (isMutationLoading) {
        return <Spinner />;
    }
    const handleKeySubmit = async () => {
        const res = await mutateAsync({ GENAI_KEY: apiKey });
        res.success
            ? toast.success("API Key updated")
            : toast.error("Failed to update API Key");
    };
    return (
        <div className="flex flex-col space-y-4">
            <Input
                defaultValue={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                value={apiKey}
                label="Google API Key"
                endContent={
                    apiKey !== props.GENAI_KEY ? (
                        <Button
                            onPress={handleKeySubmit}
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
        </div>
    );
}
