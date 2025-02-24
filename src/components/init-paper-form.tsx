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
    name: z.string().nonempty(),
    file: z.instanceof(File),
});

export const withInitPaperForm = () => {
    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
    const { mutate } = trpcReact.createTest.useMutation();

    async function onSubmit(formData: FormData) {
        const values = {
            name: formData.get("name"),
            file: formData.get("file"),
        };
        try {
            const parsedValues = schema.parse(values);
            if (!parsedValues.file) {
                return toast.error("Please select a file");
            }
            mutate({
                title: parsedValues.name,
                filePath: parsedValues.file.path,
            });
            console.log(parsedValues);
        } catch (e: any) {
            e.errors.map((error: { message: string }) =>
                toast.error(error.message),
            );
            return;
        }
    }

    const form = (
        <>
            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="">
                                Add new Paper
                            </ModalHeader>
                            <ModalBody>
                                <form
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        const formData = new FormData(
                                            e.currentTarget,
                                        );
                                        onSubmit(formData);
                                    }}
                                    className="space-y-4"
                                >
                                    <div>
                                        <Input
                                            label="Title"
                                            isRequired
                                            type="text"
                                            name="name"
                                            description="This is the title for your Test"
                                        />
                                    </div>

                                    <div>
                                        <Input
                                            type="file"
                                            label="File"
                                            isRequired
                                            name="file"
                                            accept=".pdf"
                                            description="Upload your Test PDF file"
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
    };
};
