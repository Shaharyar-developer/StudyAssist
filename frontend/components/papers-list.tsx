import { PaperHead } from "../../backend/handlers/papers";
import { trpcReact } from "../libs/trpc";
import { Spinner } from "@heroui/spinner";
import { Card, CardBody } from "@heroui/card";
import { Button, cn } from "@heroui/react";
import { usePaper } from "../providers/paper";
import { useSidebar } from "../providers/sidebar";
import { IconAdjustments, IconInfoCircle } from "@tabler/icons-react";
import { withPaperAdjustments } from "./paper-adjustments";

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
                Error {data?.reason}
                <Button variant="light" onPress={() => refetch()}>
                    Refetch
                </Button>
            </div>
        );
    }
    return (
        <main className="flex flex-col gap-y-4">
            {data.value?.map((p) => {
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
    const { Component: AdjustmentsComp, onOpen } = withPaperAdjustments(paper);
    return (
        <div className="flex flex-col gap-1">
            <Card
                className="w-full bg-default-100 rounded-b-md"
                radius="lg"
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
                    <div className="flex justify-between capitalize flex-grow">
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
            <div className="flex w-full gap-1">
                <Button
                    className="py-1.5 rounded-b-2xl rounded-t-md"
                    radius="none"
                    variant="flat"
                    fullWidth
                >
                    <IconInfoCircle />
                </Button>
                <Button
                    className="h-full py-1.5 rounded-b-2xl rounded-t-md"
                    size="lg"
                    fullWidth
                    variant="flat"
                    onPress={onOpen}
                >
                    <IconAdjustments />
                </Button>
            </div>
            {AdjustmentsComp}
        </div>
    );
}
