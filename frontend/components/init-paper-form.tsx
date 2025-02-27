import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    useDisclosure,
} from "@heroui/modal";
import { Button, Input } from "@heroui/react";
import { toast } from "sonner";
import { z } from "zod";
import { trpcReact } from "../libs/trpc";

const schema = z.object({
    file: z.instanceof(File),
});

export const withInitPaperForm = () => {
    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
    const { mutateAsync, isLoading } = trpcReact.createPaper.useMutation();
    const utils = trpcReact.useUtils();

    async function onSubmit(formData: FormData) {
        // Create a new promise that will remain pending until submission is complete.
        const values = {
            file: formData.get("file"),
        };

        try {
            const parsedValues = schema.parse(values);
            if (!parsedValues.file) {
                toast.error("Please select a file");
                return "Please select a file";
            }
            const res = await mutateAsync({
                filePath: parsedValues.file.path,
            });
            if (res.success) {
                toast.success("Paper added successfully");
                return "Paper added successfully";
            } else {
                toast.error(res.reason);
            }
            utils.getPapers.invalidate();
            utils.getPapers.refetch();
            onClose();
        } catch (e: any) {
            e.errors.forEach((error: { message: string }) =>
                toast.error(error.message),
            );
        }
    }

    const form = (
        <>
            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>Add new Paper</ModalHeader>
                            <ModalBody>
                                <form
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        const formData = new FormData(
                                            e.currentTarget,
                                        );
                                        const res = onSubmit(formData);
                                        toast.promise(res, {
                                            loading: "Adding Paper...",
                                            success: "Paper added successfully",
                                        });
                                        await res;
                                    }}
                                    className="space-y-4"
                                >
                                    <div>
                                        <Input
                                            type="file"
                                            label="File"
                                            isRequired
                                            name="file"
                                            accept=".pdf"
                                            description="Upload your Paper PDF file"
                                            onChange={(e) => {
                                                if (!e.currentTarget.files) {
                                                    return toast.error(
                                                        "Please select a file",
                                                    );
                                                }
                                            }}
                                        />
                                    </div>

                                    <div className="flex justify-end items-end gap-3 pt-2">
                                        <Button
                                            type="reset"
                                            color="danger"
                                            variant="light"
                                            onPress={onClose}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            color="primary"
                                            variant="flat"
                                        >
                                            Submit
                                        </Button>
                                    </div>
                                </form>
                            </ModalBody>
                        </>
                    )}
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
