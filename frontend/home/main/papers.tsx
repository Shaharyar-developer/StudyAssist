import { PaperHead } from "../../../backend/handlers/papers";
import { trpcReact } from "../../libs/trpc";
import { Spinner } from "@heroui/spinner";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/react";
import { usePaper } from "../../providers/paper";

export const MainPapersContent = () => {
    const { setSelectedPaper, selectedPaper } = usePaper();
    const { data, isLoading, refetch } = trpcReact.getPapers.useQuery();
    if (isLoading) {
        return <Spinner />;
    }
    if (data?.reason || !data?.success) {
        return (
            <div>
                Error &npbsp; {data?.reason}
                <Button onPress={() => refetch()}>Refetch</Button>
            </div>
        );
    }
    return (
        <main className="flex flex-col gap-4">
            {data.value?.map((p) => {
                const paper = Object.values(p)[0];

                return (
                    <PaperCard
                        isSelected={selectedPaper?.id === paper.id}
                        selectPaper={setSelectedPaper}
                        paper={paper}
                        key={paper.id}
                    />
                );
            })}
        </main>
    );
};
function PaperCard({
    paper,
    selectPaper,
    isSelected,
}: {
    paper: PaperHead;
    selectPaper: (id: string) => void;
    isSelected: boolean;
}) {
    return (
        <Card
            className="w-full min-w-[200px] bg-default-100/50"
            shadow="none"
            onPress={() => selectPaper(paper.id)}
            isDisabled={isSelected}
            isHoverable
            isPressable
        >
            <CardBody className="whitespace-nowrap">
                <p>{paper.metadata?.subject}</p>
                <p className="text-default-500 text-xs overflow-ellipsis whitespace-nowrap">
                    {paper.id}
                </p>
            </CardBody>
        </Card>
    );
}
