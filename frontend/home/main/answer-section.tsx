import { Button, Card, CardBody, CardHeader } from "@heroui/react";
import { usePaper } from "../../providers/paper";
import { IconStopwatch } from "@tabler/icons-react";
import { useTimer } from "../../hooks/usePaperTimer";

export const AnswerSection = () => {
    const { selectedPaper, attemptStarted, setAttemptStarted } = usePaper();
    const { play } = useTimer();
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
            <div className="">
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
            </div>
            <div className="flex-grow h-full">
                {selectedPaper.metadata?.paper_type === "MCQs" ? (
                    <MCQsPaper
                        started={attemptStarted}
                        questions={selectedPaper.metadata?.total_questions}
                    />
                ) : (
                    <></>
                )}
            </div>
        </div>
    );
};

import { RadioGroup, Radio } from "@heroui/radio";
import { useState } from "react";

type AnswerObj = {
    question: number;
    answer: string;
};

function MCQsPaper(props: { started: boolean; questions: number }) {
    // Initialize state with an array of answer objects
    const [answers, setAnswers] = useState<AnswerObj[]>(
        Array.from({ length: props.questions }, (_, i) => ({
            question: i + 1,
            answer: "",
        })),
    );

    // Update the answer for a specific question
    const handleAnswerChange = (index: number, value: string) => {
        const newAnswers = [...answers];
        newAnswers[index] = { ...newAnswers[index], answer: value };
        setAnswers(newAnswers);
    };

    return (
        <Card className="h-full w-full rounded-3xl overflow-auto" shadow="none">
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
            </CardBody>
        </Card>
    );
}
