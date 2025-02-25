import { TestHead } from "../../../backend/handlers/test-files";
import { trpcReact } from "../../libs/trpc";
import { Spinner } from "@heroui/spinner";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Button } from "@heroui/react";
import { usePaper } from "../../providers/paper";

export const MainTestsContent = () => {
    const { setSelectedTest, selectedTest } = usePaper();
    const { data, isLoading, refetch } = trpcReact.getTests.useQuery();
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
                const test = Object.values(p)[0];

                return (
                    <PaperCard
                        isSelected={selectedTest?.id === test.id}
                        selectTest={setSelectedTest}
                        paper={test}
                    />
                );
            })}
        </main>
    );
};
function PaperCard({
    paper,
    selectTest,
    isSelected,
}: {
    paper: TestHead;
    selectTest: (id: string) => void;
    isSelected: boolean;
}) {
    return (
        <Card
            className="w-full min-w-[200px] bg-default-100/50"
            shadow="none"
            onPress={() => selectTest(paper.id)}
            isDisabled={isSelected}
            isHoverable
            isPressable
        >
            <CardBody className="whitespace-nowrap">
                <p>{paper.name}</p>
                <p className="text-default-500 text-xs overflow-ellipsis whitespace-nowrap">
                    {paper.id}
                </p>
            </CardBody>
        </Card>
    );
}
