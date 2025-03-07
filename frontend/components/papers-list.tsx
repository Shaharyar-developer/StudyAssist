import { PaperHead } from "../../backend/handlers/papers";
import { trpcReact } from "../libs/trpc";
import { Spinner } from "@heroui/spinner";
import { Card, CardBody } from "@heroui/card";
import { Button, cn } from "@heroui/react";
import { usePaper } from "../providers/paper";
import { useSidebar } from "../providers/sidebar";
import { IconAdjustments } from "@tabler/icons-react";
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
                Error &npbsp; {data?.reason}
                <Button onPress={() => refetch()}>Refetch</Button>
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
        <div className="flex">
            <Card
                className="w-full bg-default-100/50 rounded-l-3xl"
                radius="none"
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
            <div className="">
                <Button
                    className="h-full rounded-r-3xl"
                    radius="none"
                    size="lg"
                    fullWidth
                    isIconOnly
                    variant="flat"
                    onPress={onOpen}
                >
                    <IconAdjustments strokeWidth={1.4} />
                </Button>
            </div>
            {AdjustmentsComp}
        </div>
    );
}
