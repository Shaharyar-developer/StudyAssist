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
        <div className="grid grid-cols-2  items-center">
            <div className="h-full border-r-2 border-default-200"></div>
            <div className="max-h-[calc(100svh-5rem)] pr-6 scrollbar-hide relative w-full overflow-auto">
                <PdfDocument
                    value={data.value}
                    pages={props.pages}
                    options={props.options}
                />
            </div>
        </div>
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
