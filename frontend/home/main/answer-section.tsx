import {
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    Divider,
    ScrollShadow,
} from "@heroui/react";
import { usePaper } from "../../providers/paper";
import { IconChecks, IconStopwatch } from "@tabler/icons-react";
import { useTimer } from "../../hooks/usePaperTimer";

export const AnswerSection = () => {
    const { selectedPaper, attemptStarted, setAttemptStarted } = usePaper();
    const { play, isRunning } = useTimer();
    if (!selectedPaper) return <></>;
    return (
        <div className="flex flex-col gap-1 h-full">
            <div className="border-b p-2 px-3 border-default">
                <div className="flex gap-3 flex-row text-lg items-center text-foreground-700">
                    <p className="capitalize flex-grow">
                        {selectedPaper.metadata?.subject.toLowerCase()} -{" "}
                        {selectedPaper.metadata?.paper_code} - Total{" "}
                        {selectedPaper.metadata?.total_marks} Marks -{" "}
                        {selectedPaper.metadata?.exam_session.month.replace(
                            "/",
                            ",",
                        )}
                        /{""}
                        {selectedPaper.metadata?.exam_session.year}
                        {" | "}
                        <span>{selectedPaper.metadata?.total_questions}</span>
                        <span>
                            {selectedPaper.metadata?.paper_type === "MCQs"
                                ? "MCQs"
                                : "Theory Questions"}
                        </span>
                    </p>
                    <Button
                        onPress={() => {
                            setAttemptStarted(true);
                            play();
                        }}
                        isDisabled={isRunning}
                        size="md"
                        startContent={<IconStopwatch />}
                        variant="flat"
                        color="primary"
                    >
                        Start Attempt
                    </Button>
                </div>
            </div>
            <ScrollShadow className="flex-grow rounded-3xl h-[80svh] p-4 overflow-auto scrollbar-hide">
                {selectedPaper.metadata?.paper_type === "MCQs" ? (
                    <MCQsPaper
                        started={attemptStarted}
                        questions={selectedPaper.metadata?.total_questions}
                    />
                ) : (
                    <></>
                )}
            </ScrollShadow>
        </div>
    );
};

import { RadioGroup, Radio } from "@heroui/radio";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

export const ANSWER_OBJ_SCHEMA = z.object({
    type: z.enum(["mcq", "theory"]),
    question: z.number(),
    answer: z.string(),
});
export type AnswerObj = z.infer<typeof ANSWER_OBJ_SCHEMA>;

function MCQsPaper(props: { started: boolean; questions: number }) {
    // Initialize state with an array of answer objects
    const [answers, setAnswers] = useState<AnswerObj[]>(
        Array.from({ length: props.questions }, (_, i) => ({
            question: i + 1,
            answer: "",
            type: "mcq",
        })),
    );

    // Update the answer for a specific question
    const handleAnswerChange = (index: number, value: string) => {
        const newAnswers = [...answers];
        newAnswers[index] = { ...newAnswers[index], answer: value };
        setAnswers(newAnswers);
    };

    const handleSubmit = () => {
        if (answers.some((answer) => answer.answer === "")) {
            return toast.error(
                "Please answer all questions before submitting.",
            );
        }
    };

    return (
        <Card isBlurred className="w-full rounded-3xl" shadow="none">
            <CardBody>
                {answers.map((answerObj, i) => (
                    <RadioGroup
                        isDisabled={!props.started}
                        key={i}
                        name={`question-${i}`}
                        className="mb-4"
                        onValueChange={(value) => handleAnswerChange(i, value)}
                        value={answerObj.answer}
                    >
                        <CardHeader>
                            <h3 className="text-xl text-foreground-700">
                                Question {answerObj.question}
                            </h3>
                        </CardHeader>
                        <Radio value="a">Option A</Radio>
                        <Radio value="b">Option B</Radio>
                        <Radio value="c">Option C</Radio>
                        <Radio value="d">Option D</Radio>
                    </RadioGroup>
                ))}
                <Divider />
            </CardBody>
            <CardFooter>
                <Button
                    isDisabled={answers.some((answer) => answer.answer === "")}
                    onPress={handleSubmit}
                    startContent={<IconChecks />}
                    fullWidth
                    variant="flat"
                >
                    Submit
                </Button>
            </CardFooter>
        </Card>
    );
}
