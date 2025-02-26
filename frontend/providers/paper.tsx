import { createContext, useState, useContext } from "react";
import { PaperHead } from "../../backend/handlers/papers";
import { trpcReact } from "../libs/trpc";
import { toast } from "sonner";

type PaperContextType = {
    selectedPaper?: PaperHead;
    setSelectedPaper: (id: PaperHead["id"]) => void;
    isLoading: boolean;
};

const PaperContext = createContext<PaperContextType | null>(null);

export const PaperProvider = ({ children }: { children: React.ReactNode }) => {
    const [selectedPaper, setSelectedPaper] = useState<PaperHead>();

    const { mutateAsync, isLoading } = trpcReact.getPaperById.useMutation();

    const selectPaper = async (id: string) => {
        if (!id) {
            toast.warning("No Paper selected");
        }
        console.log(id);
        const res = await mutateAsync(id);
        if (res.reason) {
            toast.error(res.reason);
        }
        console.log(JSON.stringify(res, null, 2));
        setSelectedPaper(res.value);
    };

    return (
        <PaperContext.Provider
            value={{ selectedPaper, setSelectedPaper: selectPaper, isLoading }}
        >
            {children}
        </PaperContext.Provider>
    );
};

export const usePaper = () => {
    const context = useContext(PaperContext);
    if (!context) {
        throw new Error("usePaper must be used within a PaperProvider");
    }
    return context;
};
