import { app } from "electron";
import { z } from "zod";
import { nanoid } from "nanoid";
import { ok, err, Result } from "../../frontend/types/fn";
import * as fs from "fs/promises";
import * as path from "path";

export const CONFIG_SCHEMA = z.object({});
export type CONFIG = z.infer<typeof CONFIG_SCHEMA>;

export const PAPER_HEAD_SCHEMA = z.object({
    name: z.string().nonempty(),
    id: z.string().nonempty(),
    address: z.string().optional(),
    paperAddress: z.string().optional(),
    status: z.enum(["pending", "completed", "started"]),
});
export type PaperHead = z.infer<typeof PAPER_HEAD_SCHEMA>;

type STATE = {
    papers: Record<string, PaperHead>[];
};

const DOCS_PATH = path.join(app.getPath("home"), ".studyassist");
const CONFIG_FILE = "config.json";
const DOCS_STATE = "docs.json";

export class PaperStore {
    private path = DOCS_PATH;
    private configUrl = path.join(DOCS_PATH, CONFIG_FILE);
    private stateUrl = path.join(DOCS_PATH, DOCS_STATE);

    constructor() {
        this.initiateConfig().catch(console.error);
    }

    private async createPapersDir(id: string): Promise<string> {
        const address = path.join(this.path, id.replace(/\s/g, "_"));
        try {
            await fs.mkdir(address, { recursive: true });
        } catch (error) {
            console.error("Failed to create directory:", error);
        }
        return address;
    }

    private async ensureFileExists(filePath: string, defaultContent: string) {
        try {
            await fs.access(filePath);
        } catch {
            await fs.writeFile(filePath, defaultContent);
        }
    }

    private async initiateConfig() {
        try {
            await fs.mkdir(this.path, { recursive: true });
            await this.ensureFileExists(this.configUrl, "{}");
            await this.ensureFileExists(
                this.stateUrl,
                JSON.stringify({ papers: [] })
            );
        } catch (error) {
            console.error("Error initializing config:", error);
        }
    }

    async getDocsState(): Promise<Result<STATE>> {
        await this.initiateConfig().catch(console.error);
        try {
            const content = await fs.readFile(this.stateUrl, "utf8");
            return ok(JSON.parse(content));
        } catch (error) {
            console.error("Failed to read state file:", error);
            return err("Failed to retrieve or parse state file");
        }
    }

    async addPaperToDocsState(paper: PaperHead): Promise<Result> {
        const stateResult = await this.getDocsState();
        if (!stateResult.success || !stateResult.value)
            return err("Failed to get state");

        stateResult.value.papers.push({ [paper.id]: paper });

        try {
            await fs.writeFile(
                this.stateUrl,
                JSON.stringify(stateResult.value, null, 2)
            );
            return ok();
        } catch (error) {
            console.error("Failed to update state file:", error);
            return err("Failed to update state file");
        }
    }
    async removePaperFromDocsState(id: string): Promise<Result> {
        const stateResult = await this.getDocsState();
        if (!stateResult.success || !stateResult.value)
            return err("Failed to get state");

        stateResult.value.papers = stateResult.value.papers.filter(
            (t) => !t[id]
        );

        try {
            await fs.writeFile(
                this.stateUrl,
                JSON.stringify(stateResult.value, null, 2)
            );
            return ok();
        } catch (error) {
            console.error("Failed to update state file:", error);
            return err("Failed to update state file");
        }
    }

    async addPaper(fileUrl: string, fileName: string): Promise<Result> {
        const state = await this.getDocsState();
        if (!state.success || !state.value) return err("Failed to get state");

        const id = nanoid();
        const newAddr = await this.createPapersDir(fileName);
        const pdfOut = path.join(newAddr, `${fileName}.pdf`);
        const metadata: PaperHead = {
            name: fileName,
            id,
            address: newAddr,
            paperAddress: pdfOut,
            status: "pending",
        };

        try {
            await fs.copyFile(fileUrl, pdfOut);
            await fs.writeFile(
                path.join(newAddr, "metadata.json"),
                JSON.stringify(metadata, null, 2)
            );
            return await this.addPaperToDocsState(metadata);
        } catch (error) {
            console.error("Failed to add paper:", error);
            return err("Failed to add paper");
        }
    }

    async getPapers(): Promise<Result<Record<string, PaperHead>[]>> {
        const state = await this.getDocsState();
        if (!state.success || !state.value) return err("Failed to get state");

        return ok(state.value.papers);
    }
    async getPaperById(id: string): Promise<Result<PaperHead>> {
        const state = await this.getDocsState();
        if (!state.success || !state.value) return err("Failed to get state");
        console.log(JSON.stringify(state.value, null, 2));
        const paper = state.value.papers.find((t) => t[id]);
        console.log("filtered Paper:", paper);
        if (!paper) return err("Paper not found");
        const paperPath = paper?.[id]?.address;
        console.log(paperPath);
        console.log("paper Path:", paperPath);
        if (!paperPath) return err("paper not found");
        try {
            const metadata = await fs.readFile(
                path.join(paperPath, "metadata.json"),
                "utf8"
            );
            try {
                const parsed = PAPER_HEAD_SCHEMA.parse(JSON.parse(metadata));
                return ok(parsed);
            } catch {
                return err("Failed to parse metadata");
            }
        } catch (error) {
            console.error("Failed to read paper file:", error);
            return err("Failed to retrieve or parse paper file");
        }
    }
    async getPaperPdf(id: string): Promise<Result<string>> {
        const state = await this.getDocsState();
        if (!state.success || !state.value) return err("Failed to get state");
        const paper = state.value.papers.find((t) => t[id]);
        if (!paper) return err("paper not found");
        const paperPath = paper[id].address;
        if (!paperPath) return err("Paper not found");
        try {
            return ok(
                await fs.readFile(
                    path.join(paperPath, `${paper[id].name}.pdf`),
                    "base64url"
                )
            );
        } catch (error) {
            console.error("Failed to read paper file:", error);
            return err("Failed to retrieve or parse paper file");
        }
    }

    async deletePaper(id: string): Promise<Result> {
        const state = await this.getDocsState();
        if (!state.success || !state.value) return err("Failed to get state");
        const paper = state.value.papers.find((t) => t[id]);
        if (!paper) return err("Paper not found");
        const paperPath = paper[id].address;
        if (!paperPath) return err("Paper not found");
        try {
            await fs.rm(paperPath, { recursive: true });
            state.value.papers = state.value.papers.filter((t) => !t[id]);
            await fs.writeFile(
                this.stateUrl,
                JSON.stringify(state.value, null, 2)
            );
            const res = await this.removePaperFromDocsState(id);
            if (!res.success) return res;
            return ok();
        } catch (error) {
            console.error("Failed to delete paper file:", error);
            return err("Failed to delete paper file");
        }
    }

    async getConfig(): Promise<Result<CONFIG>> {
        try {
            const content = await fs.readFile(this.configUrl, "utf8");
            return ok(CONFIG_SCHEMA.parse(JSON.parse(content)));
        } catch (error) {
            console.error("Failed to read config file:", error);
            return err("Failed to retrieve or parse config file");
        }
    }
}
