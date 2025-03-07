import { PaperHead } from "../../backend/handlers/papers";
import { trpcReact } from "../libs/trpc";
import { Spinner } from "@heroui/spinner";
import { Card, CardBody } from "@heroui/card";
import { Button, cn } from "@heroui/react";
import { usePaper } from "../providers/paper";
import { useSidebar } from "../providers/sidebar";

export const MainPapersContent = () => {
    const { setSelectedPaper, selectedPaper } = usePaper();
    const { data, isLoading, refetch } = trpcReact.getPapers.useQuery();
    const { toggle } = useSidebar();
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
                console.log(p);
                return (
                    <PaperCard
                        isSelected={selectedPaper?.id === p.id}
                        selectPaper={setSelectedPaper}
                        paper={p}
                        toggleSidebar={toggle}
                        key={p.id}
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
    toggleSidebar,
}: {
    paper: PaperHead;
    selectPaper: (id: string) => void;
    isSelected: boolean;
    toggleSidebar: () => void;
}) {
    return (
        <Card
            className="w-full min-w-[300px] bg-default-100/50"
            shadow="none"
            title={paper.status}
            onPress={() => {
                selectPaper(paper.id);
                toggleSidebar();
            }}
            isDisabled={isSelected}
            isHoverable
            isPressable
        >
            <CardBody className="whitespace-nowrap">
                <div className="flex justify-between capitalize">
                    <span>
                        {paper.metadata?.subject.toLowerCase()}
                        {" - "}
                        <span className="text-default-500">
                            {paper.metadata?.document_code}
                        </span>
                    </span>
                    <div
                        className={cn(
                            "size-1.5 rounded-3xl ",
                            paper.status === "completed"
                                ? "bg-primary"
                                : "bg-danger",
                        )}
                    />
                </div>
                <p className="text-default-500 flex justify-between text-xs overflow-ellipsis whitespace-nowrap">
                    <span>
                        {" "}
                        {paper.metadata?.paper_type}
                        {" - "}
                        {paper.metadata?.exam_session.month}{" "}
                        {paper.metadata?.exam_session.year}{" "}
                    </span>
                    {paper.metadata?.duration}
                    {" hr/mins"}
                </p>
            </CardBody>
        </Card>
    );
}
