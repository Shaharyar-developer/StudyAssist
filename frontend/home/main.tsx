import { usePaper } from "../providers/paper";
import { pdfjs, DocumentProps } from "react-pdf";
import { useMemo } from "react";
import { PaperContent } from "./main/paper-content";

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
