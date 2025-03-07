import { Button, useDisclosure } from "@heroui/react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "@heroui/modal";
import { PaperHead } from "../../backend/handlers/papers";
import { IconUpload } from "@tabler/icons-react";
import { trpcReact } from "../libs/trpc";
import { toast } from "sonner";

export const withPaperAdjustments = (props: PaperHead) => {
    const { onOpen, onClose, onOpenChange, isOpen } = useDisclosure();
    const { mutateAsync: addMarkingScheme } =
        trpcReact.addMarkingScheme.useMutation();
    const Comp = (
        <>
            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1 capitalize">
                        {props.metadata?.subject.toLowerCase()} -{" "}
                        {props.metadata?.paper_code} -{" "}
                        {props.metadata?.exam_session.month}{" "}
                        {props.metadata?.exam_session.year}
                    </ModalHeader>
                    <ModalBody>
                        {props.hasMarkingScheme ? (
                            <></>
                        ) : (
                            <div className="flex items-center justify-between p-2 rounded-3xl border border-default">
                                <p>Marking Scheme Not Present</p>{" "}
                                <Button
                                    onPress={() => {
                                        toast.promise(
                                            addMarkingScheme(props.id),
                                            {
                                                loading:
                                                    "Adding Marking Scheme",
                                                success: "Marking Scheme Added",
                                                error: "Failed to add Marking Scheme",
                                            },
                                        );
                                    }}
                                    variant="flat"
                                    radius="lg"
                                    startContent={<IconUpload />}
                                >
                                    Upload
                                </Button>
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter></ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );

    return {
        Component: Comp,
        onOpen,
        onClose,
    };
};
