import { createContext, useState, useContext } from "react";
import { TestHead } from "../../backend/handlers/test-files";
import { trpcReact } from "../libs/trpc";
import { toast } from "sonner";

type PaperContextType = {
    selectedTest?: TestHead;
    setSelectedTest: (id: TestHead["id"]) => void;
    isLoading: boolean;
};

const PaperContext = createContext<PaperContextType | null>(null);

export const PaperProvider = ({ children }: { children: React.ReactNode }) => {
    const [selectedTest, setSelectedTest] = useState<TestHead>();

    const { mutateAsync, isLoading } = trpcReact.getTestById.useMutation();

    const selectTest = async (id: string) => {
        if (!id) {
            toast.warning("No test selected");
        }
        console.log(id);
        const res = await mutateAsync(id);
        if (res.reason) {
            toast.error(res.reason);
        }
        console.log(JSON.stringify(res, null, 2));
        setSelectedTest(res.value);
    };

    return (
        <PaperContext.Provider
            value={{ selectedTest, setSelectedTest: selectTest, isLoading }}
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
