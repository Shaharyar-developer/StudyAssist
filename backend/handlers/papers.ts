import { app } from "electron";
import { z } from "zod";
import { createSchema, extendZodWithOpenApi } from "zod-openapi";
import { nanoid } from "nanoid";
import { ok, err, Result } from "../../frontend/types/fn";
import * as fs from "fs/promises";
import * as path from "path";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { getConfig } from "../trpc";
import { Env } from "../trpc";
import { AI } from "./ai";
import { ObjectSchema } from "@google/generative-ai";

extendZodWithOpenApi(z);

/**
 * Application configuration schema.
 */
export const CONFIG_SCHEMA = z.object({});
export type CONFIG = z.infer<typeof CONFIG_SCHEMA>;

/**
 * Exam metadata schema.
 */
export const EXAM_METADATA_SCHEMA = z.object({
    subject: z.string(),
    paper_code: z.string(),
    paper_type: z.enum(["MCQs", "Theory"]),
    assumptions: z.array(
        z.object({
            for: z.string(),
            value: z.string(),
        }),
    ),
    exam_session: z.object({
        month: z.string(),
        year: z.number(),
    }),
    duration: z.number().describe("Exam Duration in Minutes"),
    total_marks: z.number(),
    total_questions: z.number().describe("Number of Questions"),
    document_code: z.string(),
    pages: z.number(),
});
const spec = EXAM_METADATA_SCHEMA.openapi({});
export const ExamMetadataOpenApiSpec = createSchema(spec);
export type ExamMetadata = z.infer<typeof EXAM_METADATA_SCHEMA>;

/**
 * Paper metadata (header) schema.
 */
export const PAPER_HEAD_SCHEMA = z.object({
    id: z.string().nonempty(),
    address: z.string().optional(),
    paperAddress: z.string().optional(),
    filename: z.string().optional(),
    status: z.enum(["pending", "completed", "started"]),
    metadata: EXAM_METADATA_SCHEMA.optional(),
});
export type PaperHead = z.infer<typeof PAPER_HEAD_SCHEMA> & {
    metadata?: ExamMetadata;
};

/**
 * Updated state: papers are stored in a dictionary keyed by paper id.
 */
type STATE = {
    papers: Record<string, PaperHead>;
};

const DOCS_PATH = path.join(app.getPath("home"), ".studyassist");
const CONFIG_FILE = "config.json";
const DOCS_STATE = "docs.json";

/**
 * Class for managing paper storage and metadata.
 */
export class PaperStore {
    private basePath = DOCS_PATH;
    private configPath = path.join(DOCS_PATH, CONFIG_FILE);
    private statePath = path.join(DOCS_PATH, DOCS_STATE);
    private envConfig: Result<Env> = {
        success: false,
        reason: "ENV not loaded",
    };
    private AI: AI | null = null;
    private isLocked = false;

    constructor() {
        // Initialize directories, config and state.
        this.initialize().catch(console.error);
    }

    /**
     * Initializes the store: creates required directories/files and loads configuration.
     */
    private async initialize(): Promise<void> {
        await this.ensureDir(this.basePath);
        await this.ensureFileExists(this.configPath, "{}");
        await this.ensureFileExists(
            this.statePath,
            JSON.stringify({ papers: {} }, null, 2),
        );
        this.envConfig = await getConfig();
        if (this.envConfig.success && this.envConfig.value?.GENAI_KEY) {
            this.AI = new AI(this.envConfig.value.GENAI_KEY);
        }
    }

    private async ensureDir(dirPath: string): Promise<void> {
        try {
            await fs.mkdir(dirPath, { recursive: true });
        } catch (error) {
            console.error("Failed to create directory:", error);
        }
    }

    private async ensureFileExists(
        filePath: string,
        defaultContent: string,
    ): Promise<void> {
        try {
            await fs.access(filePath);
        } catch {
            await fs.writeFile(filePath, defaultContent);
        }
    }

    private async readState(): Promise<Result<STATE>> {
        try {
            const content = await fs.readFile(this.statePath, "utf8");
            const state = JSON.parse(content);
            return ok(state as STATE);
        } catch (error) {
            console.error("Failed to read state file:", error);
            return err("Failed to retrieve or parse state file");
        }
    }

    private async writeState(state: STATE): Promise<Result> {
        try {
            await fs.writeFile(this.statePath, JSON.stringify(state, null, 2));
            return ok();
        } catch (error) {
            console.error("Failed to update state file:", error);
            return err("Failed to update state file");
        }
    }

    private async createPaperDir(id: string): Promise<string> {
        const sanitizedId = id.replace(/\s/g, "_");
        const dirPath = path.join(this.basePath, sanitizedId);
        await this.ensureDir(dirPath);
        return dirPath;
    }

    async getDocsState(): Promise<Result<STATE>> {
        return await this.readState();
    }

    async addPaperToDocsState(paper: PaperHead): Promise<Result> {
        const stateResult = await this.readState();
        if (!stateResult.success || !stateResult.value)
            return err("Failed to get state");

        stateResult.value.papers[paper.id] = paper;
        return await this.writeState(stateResult.value);
    }

    async removePaperFromDocsState(id: string): Promise<Result> {
        const stateResult = await this.readState();
        if (!stateResult.success || !stateResult.value)
            return err("Failed to get state");

        delete stateResult.value.papers[id];
        return await this.writeState(stateResult.value);
    }

    async extractExamMetadata(fileUrl: string): Promise<Result<ExamMetadata>> {
        if (!this.envConfig.success)
            return err(this.envConfig.reason || "ENV not loaded");

        const parsedPath = path.parse(fileUrl);
        if (parsedPath.ext !== ".pdf") return err("Invalid file format");

        const fileBuffer = await fs.readFile(fileUrl);
        const blob = new Blob([fileBuffer]);
        const loader = new PDFLoader(blob);
        const docs = await loader.load();

        if (docs[0].pageContent.length < 50)
            return err("Failed to extract text");

        const contentLower = docs[0].pageContent.toLowerCase();
        if (
            !contentLower.includes("cambridge") ||
            !contentLower.includes("paper")
        ) {
            return err("Not a valid exam paper");
        }

        const res = await this.AI?.generateStructured(
            docs[0].pageContent,
            ExamMetadataOpenApiSpec.schema as ObjectSchema,
        );
        if (!res?.success)
            return err(res?.reason || "Failed to extract metadata");
        try {
            const parsed = EXAM_METADATA_SCHEMA.parse(res.value);
            return ok(parsed);
        } catch {
            return err("Failed to parse metadata");
        }
    }

    async addPaper(fileUrl: string): Promise<Result<string>> {
        if (this.isLocked) return err("Store is locked");

        const stateResult = await this.readState();
        if (!stateResult.success || !stateResult.value)
            return err("Failed to get state");
        this.isLocked = true;

        const id = nanoid();
        const paperDir = await this.createPaperDir(id);
        const pdfOut = path.join(paperDir, `${id}.pdf`);
        const metadataPath = path.join(paperDir, "metadata.json");

        const paperMetadata: PaperHead = {
            id,
            address: paperDir,
            paperAddress: pdfOut,
            filename: `${id}.pdf`,
            status: "pending",
        };

        try {
            await fs.copyFile(fileUrl, pdfOut);
            const addResult = await this.addPaperToDocsState(paperMetadata);
            if (!addResult.success) {
                this.isLocked = false;
                return err("Failed to add paper");
            }

            const examMetadata = await this.extractExamMetadata(pdfOut);
            if (examMetadata.success && examMetadata.value) {
                paperMetadata.metadata = examMetadata.value;
                await fs.writeFile(
                    metadataPath,
                    JSON.stringify(paperMetadata, null, 2),
                );
                this.isLocked = false;
                return ok("Successfully extracted exam metadata");
            } else {
                this.isLocked = false;
                return err("Exam metadata extraction was unsuccessful");
            }
        } catch (error) {
            console.error("Failed to add paper:", error);
            this.isLocked = false;
            return err("Failed to add paper");
        }
    }

    async getPapers(): Promise<Result<PaperHead[]>> {
        if (this.isLocked) return err("Store is locked");

        const stateResult = await this.readState();
        if (!stateResult.success || !stateResult.value)
            return err("Failed to get state");

        const paperHeads = await Promise.all(
            Object.values(stateResult.value.papers).map(async (paper) => {
                if (!paper.address) return null;
                try {
                    const metadataContent = await fs.readFile(
                        path.join(paper.address, "metadata.json"),
                        "utf8",
                    );
                    return PAPER_HEAD_SCHEMA.parse(JSON.parse(metadataContent));
                } catch (error) {
                    console.error("Failed to read paper metadata:", error);
                    return null;
                }
            }),
        );
        const validPapers = paperHeads.filter(
            (p): p is PaperHead => p !== null,
        );
        return ok(validPapers);
    }

    async getPaperById(id: string): Promise<Result<PaperHead>> {
        const stateResult = await this.readState();
        if (!stateResult.success || !stateResult.value)
            return err("Failed to get state");

        const paper = stateResult.value.papers[id];
        if (!paper || !paper.address) return err("Paper not found");
        try {
            const metadataContent = await fs.readFile(
                path.join(paper.address, "metadata.json"),
                "utf8",
            );
            const parsed = PAPER_HEAD_SCHEMA.parse(JSON.parse(metadataContent));
            return ok(parsed);
        } catch (error) {
            console.error("Failed to read paper metadata:", error);
            return err("Failed to retrieve or parse paper metadata");
        }
    }

    async getPaperPdf(id: string): Promise<Result<string>> {
        const stateResult = await this.readState();
        if (!stateResult.success || !stateResult.value)
            return err("Failed to get state");

        const paper = stateResult.value.papers[id];
        if (!paper || !paper.paperAddress) return err("Paper not found");
        try {
            const pdfData = await fs.readFile(paper.paperAddress, "base64url");
            return ok(pdfData);
        } catch (error) {
            console.error("Failed to read paper PDF:", error);
            return err("Failed to retrieve paper PDF");
        }
    }

    async deletePaper(id: string): Promise<Result> {
        const stateResult = await this.readState();
        if (!stateResult.success || !stateResult.value)
            return err("Failed to get state");

        const paper = stateResult.value.papers[id];
        if (!paper || !paper.address) return err("Paper not found");
        try {
            await fs.rm(paper.address, { recursive: true, force: true });
            delete stateResult.value.papers[id];
            return await this.writeState(stateResult.value);
        } catch (error) {
            console.error("Failed to delete paper:", error);
            return err("Failed to delete paper");
        }
    }

    async getConfig(): Promise<Result<CONFIG>> {
        try {
            const content = await fs.readFile(this.configPath, "utf8");
            return ok(CONFIG_SCHEMA.parse(JSON.parse(content)));
        } catch (error) {
            console.error("Failed to read config file:", error);
            return err("Failed to retrieve or parse config file");
        }
    }
}
