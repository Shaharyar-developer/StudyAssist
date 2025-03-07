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
import { motion } from "framer-motion";

export const AnswerSection = () => {
    const { selectedPaper, attemptStarted, setAttemptStarted } = usePaper();
    const { play, isRunning } = useTimer();
    if (!selectedPaper) return <></>;
    return (
        <div className="flex flex-col gap-6 h-full p-5">
            <div className="">
                <div className="flex gap-3 flex-row text-lg text-foreground-700">
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
                    </p>
                    <span>{selectedPaper.metadata?.total_questions}</span>
                    <span>
                        {selectedPaper.metadata?.paper_type === "MCQs"
                            ? "MCQs"
                            : "Theory Questions"}
                    </span>
                </div>
            </div>
            <motion.div
                className="relative"
                animate={{
                    opacity: isRunning ? 0 : 1,
                    y: isRunning ? -50 : 0,
                }}
            >
                <Button
                    onPress={() => {
                        setAttemptStarted(true);
                        play();
                    }}
                    fullWidth
                    size="lg"
                    startContent={<IconStopwatch />}
                    variant="flat"
                    color="primary"
                >
                    Start Attempt
                </Button>
            </motion.div>
            <ScrollShadow className="flex-grow rounded-3xl h-[75svh] overflow-auto scrollbar-hide">
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

type AnswerObj = {
    type: "mcq" | "theory";
    question: number;
    answer: string;
};

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
