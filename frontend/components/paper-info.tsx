import { PaperHead } from "../../backend/handlers/papers";
import { Button, useDisclosure } from "@heroui/react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "@heroui/modal";
import { IconPercentage } from "@tabler/icons-react";

export const withPaperInfo = (props: PaperHead) => {
    const { onOpen, onClose, onOpenChange, isOpen } = useDisclosure();
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
                    <ModalBody></ModalBody>
                    <ModalFooter>
                        <Button
                            startContent={<IconPercentage />}
                            isDisabled={
                                !props.hasMarkingScheme || !props.hasSubmission
                            }
                            variant="flat"
                            color="primary"
                        >
                            Check Exam
                        </Button>
                    </ModalFooter>
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
