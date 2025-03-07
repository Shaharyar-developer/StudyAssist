import { toast } from "sonner";
import { trpcReact } from "../libs/trpc";

export const withInitPaperForm = () => {
    const { mutateAsync, isLoading } = trpcReact.createPaper.useMutation();
    const utils = trpcReact.useUtils();

    async function onTrigger() {
        const res = await mutateAsync();
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (res.success) {
            toast.success("Paper created");
            utils.getPapers.invalidate();
        } else {
            toast.error("Failed to create paper");
        }
    }
    async function start() {
        return toast.promise(onTrigger(), {
            loading: "Creating paper...",
            success: "Paper created",
            error: "Failed to create paper",
        });
    }

    return {
        open: start,
        isLoading,
    };
};
