import { Button, ButtonGroup, Spinner } from "@heroui/react";
import { trpcReact } from "../../libs/trpc";
import { Document, Page, DocumentProps } from "react-pdf";
import { base64UrlToBase64 } from "../../libs/utils";
import { useState } from "react";
import { toast } from "sonner";
import {
    IconZoomInFilled,
    IconZoomOutFilled,
    IconZoomReset,
} from "@tabler/icons-react";
import { AnswerSection } from "./answer-section";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "../../components/ui/resizable";
import { ScrollShadow } from "@heroui/scroll-shadow";

export function PaperContent(props: {
    id: string;
    pages: number;
    options: DocumentProps["options"];
}) {
    const { data, isLoading } = trpcReact.getPaperPdf.useQuery(props.id);

    if (isLoading) {
        return <Spinner />;
    }
    if (data?.reason || !data?.success || !data.value) {
        toast.error(data?.reason);
        return <div></div>;
    }
    return (
        <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={50}>
                <div className="max-h-[calc(100svh-5rem)] overflow-auto scrollbar-hide">
                    <AnswerSection />
                </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50}>
                <div className="pr-6 relative ">
                    <ScrollShadow
                        className="max-h-[calc(100svh-5rem)] w-full overflow-auto scrollbar-hide"
                        size={100}
                    >
                        <PdfDocument
                            value={data.value}
                            pages={props.pages}
                            options={props.options}
                        />
                    </ScrollShadow>
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}
interface PdfDocumentProps {
    value: string;
    pages: number;
    options: DocumentProps["options"];
}

export function PdfDocument({ value, pages, options }: PdfDocumentProps) {
    const [scale, setScale] = useState(1.5);

    return (
        <div className="relative">
            <Document
                options={options}
                className="dark:invert"
                file={`data:application/pdf;base64,${base64UrlToBase64(value)}`}
            >
                {Array.from({ length: pages }).map((_, i) => (
                    <Page
                        key={i}
                        scale={scale}
                        pageNumber={i + 1}
                        onRenderSuccess={(page) => console.log(page.pageNumber)}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                    />
                ))}
            </Document>
            <div className="absolute top-4 right-4">
                <ButtonGroup isIconOnly variant="flat" color="secondary">
                    <Button
                        isDisabled={scale <= 0.5}
                        onPress={() => scale > 0.5 && setScale(scale - 0.2)}
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
                        onPress={() => scale < 2.6 && setScale(scale + 0.2)}
                    >
                        <IconZoomInFilled />
                    </Button>
                </ButtonGroup>
            </div>
        </div>
    );
}
