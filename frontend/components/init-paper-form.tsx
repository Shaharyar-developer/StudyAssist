import { Modal, ModalContent, ModalBody, useDisclosure } from "@heroui/modal";
import { Spinner } from "@heroui/react";
import { toast } from "sonner";
import { trpcReact } from "../libs/trpc";

export const withInitPaperForm = () => {
    const { isOpen, onOpen: _onOpen, onOpenChange, onClose } = useDisclosure();
    const { mutateAsync, isLoading } = trpcReact.createPaper.useMutation();
    const utils = trpcReact.useUtils();

    async function onOpen() {
        _onOpen();
        const res = await mutateAsync();
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (res.success) {
            toast.success("Paper created");
            utils.getPapers.invalidate();
        } else {
            toast.error("Failed to create paper");
        }
        onClose();
    }

    const form = (
        <>
            <Modal
                hideCloseButton
                isOpen={isOpen}
                size="sm"
                radius="lg"
                onOpenChange={onOpenChange}
            >
                <ModalContent>
                    <>
                        <ModalBody className="min-h-32 flex items-center justify-center">
                            <Spinner size="lg" />
                        </ModalBody>
                    </>
                </ModalContent>
            </Modal>
        </>
    );

    return {
        Component: form,
        open: onOpen,
        close: onClose,
        isLoading,
    };
};
