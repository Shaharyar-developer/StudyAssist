import { Button, ButtonGroup, Spinner } from "@heroui/react";
import { trpcReact } from "../libs/trpc";
import { usePaper } from "../providers/paper";
import { Document, Page, pdfjs, DocumentProps } from "react-pdf";
import { base64UrlToBase64 } from "../libs/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
    IconZoomIn,
    IconZoomInAreaFilled,
    IconZoomInFilled,
    IconZoomOutAreaFilled,
    IconZoomOutFilled,
    IconZoomReset,
} from "@tabler/icons-react";

export const MainContent = () => {
    window.electron.getWorkerSrc().then((src) => {
        pdfjs.GlobalWorkerOptions.workerSrc = src;
    });
    const options = useMemo(() => {
        return {
            cMapUrl: "/cmaps/",
            cMapPacked: true,
            verbosity: 0,
        } satisfies DocumentProps["options"];
    }, []);

    const { selectedPaper } = usePaper();
    return (
        <>
            {selectedPaper && selectedPaper.metadata ? (
                <PaperContent
                    pages={selectedPaper.metadata?.pages}
                    options={options}
                    id={selectedPaper.id}
                />
            ) : null}
        </>
    );
};
function PaperContent(props: {
    id: string;
    pages: number;
    options: DocumentProps["options"];
}) {
    const { data, isLoading } = trpcReact.getPaperPdf.useQuery(props.id);
    const [scale, setScale] = useState(1.5);

    if (isLoading) {
        return <Spinner />;
    }
    if (data?.reason || !data?.success || !data.value) {
        toast.error(data?.reason);
        return <div></div>;
    }
    return (
        <div className="grid grid-cols-2  items-center">
            <div className="h-full border-r-2 border-default-200"></div>
            <div className="max-h-[calc(100svh-5rem)] pr-6 scrollbar-hide relative w-full overflow-auto">
                <Document
                    options={props.options}
                    className={"dark:invert"}
                    file={`data:application/pdf;base64,${base64UrlToBase64(data.value)}`}
                >
                    {Array.from({ length: props.pages }).map((_, i) => {
                        return (
                            <Page
                                scale={scale}
                                pageNumber={i + 1}
                                onRenderSuccess={(page) => {
                                    console.log(page.pageNumber);
                                }}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                            />
                        );
                    })}
                </Document>
                <div className="absolute top-4 right-4">
                    <ButtonGroup isIconOnly variant="flat" color="secondary">
                        <Button
                            isDisabled={scale <= 0.5}
                            onPress={() => {
                                if (scale > 0.5) {
                                    setScale(scale - 0.2);
                                }
                            }}
                        >
                            <IconZoomOutFilled />
                        </Button>
                        <Button
                            isDisabled={scale === 1.5}
                            onPress={() => setScale(1.5)}
                        >
                            <IconZoomReset />
                        </Button>
                        <Button
                            isDisabled={scale >= 2.6}
                            onPress={() => {
                                if (scale < 2.6) {
                                    setScale(scale + 0.2);
                                }
                            }}
                        >
                            <IconZoomInFilled />
                        </Button>
                    </ButtonGroup>
                </div>
            </div>
        </div>
    );
}
