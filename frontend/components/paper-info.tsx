import { PaperHead } from "../../backend/handlers/papers";
import { Button, Divider, Spinner, useDisclosure } from "@heroui/react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "@heroui/modal";
import { trpcReact } from "../libs/trpc";
import { useEffect, useState } from "react";
import { valueToPercentage } from "../libs/utils";

export const withPaperStatus = (props: PaperHead) => {
    const { onOpen, onClose, onOpenChange, isOpen } = useDisclosure();
    const [obtainedMarks, setObtainedMarks] = useState(0);
    const { data, isLoading } = trpcReact.getSubmissionById.useQuery(props.id);
    const totalMarks = props.metadata?.total_marks!;

    useEffect(() => {
        if (!data?.value?.submissions || !data?.value?.correctAnswers) {
            console.log("No data available yet.");
            return;
        }

        console.log("Data received:", data.value);

        const correctAnswersMap = new Map(
            data.value.correctAnswers.map((q) => [q.question, q]),
        );

        let newObtainedMarks = 0;
        for (const submission of data.value.submissions) {
            const correct = correctAnswersMap.get(submission.question);
            if (correct) {
                // Ensure string comparison is accurate
                const submittedAnswer = submission.answer.trim().toLowerCase();
                const correctAnswer = correct.answer.trim().toLowerCase();

                if (submittedAnswer === correctAnswer) {
                    newObtainedMarks += correct.marks;
                }
            }
        }

        setObtainedMarks(newObtainedMarks);
    }, [data]);

    const Comp = (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1 capitalize">
                    {props.metadata?.subject.toLowerCase()} -{" "}
                    {props.metadata?.paper_code} -{" "}
                    {props.metadata?.exam_session.month}{" "}
                    {props.metadata?.exam_session.year}
                </ModalHeader>
                <ModalBody>
                    {isLoading ? (
                        <Spinner size="lg" />
                    ) : data?.reason ? (
                        "Error: " + data.reason
                    ) : data?.success && data.value?.submissions ? (
                        <div className="flex flex-col">
                            <div>
                                Obtained Marks: {obtainedMarks}/{totalMarks} -{" "}
                                {valueToPercentage(obtainedMarks, totalMarks)}%
                            </div>
                            <Divider />
                            {data.value.submissions
                                .filter((v) => {
                                    const correctAnswersMap = new Map(
                                        data?.value?.correctAnswers.map((q) => [
                                            q.question,
                                            q,
                                        ]),
                                    );
                                    const correct = correctAnswersMap.get(
                                        v.question,
                                    );
                                    return (
                                        correct &&
                                        correct.answer.trim().toLowerCase() !==
                                            v.answer.trim().toLowerCase()
                                    );
                                })
                                .map((s) => (
                                    <div className="flex gap-2">
                                        <div>Question {s.question}</div>
                                        <div>Submitted: {s.answer.trim()}</div>
                                        <div>
                                            Correct:{" "}
                                            {
                                                data?.value?.correctAnswers.find(
                                                    (v) =>
                                                        v.question ===
                                                        s.question,
                                                )?.answer
                                            }
                                        </div>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        "Failed to fetch data"
                    )}
                </ModalBody>
                <ModalFooter></ModalFooter>
            </ModalContent>
        </Modal>
    );

    return {
        Component: Comp,
        onOpen,
        onClose,
    };
};
