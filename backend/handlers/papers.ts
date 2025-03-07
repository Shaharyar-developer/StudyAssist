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
import { OCRResponse } from "@mistralai/mistralai/models/components";
import { AnswerObj } from "../../frontend/home/main/answer-section";
export type { OCRResponse } from "@mistralai/mistralai/models/components";

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
    address: z.string(),
    paperAddress: z.string(),
    hasMarkingScheme: z.boolean().default(false),
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
 * This class handles creating directories, reading/writing configuration and state files,
 * managing individual paper directories, and extracting exam metadata from PDF files.
 */
export class PaperStore {
    // Base directory for storing documents.
    private basePath = DOCS_PATH;
    // Path to the configuration file.
    private configPath = path.join(DOCS_PATH, CONFIG_FILE);
    // Path to the state file which tracks paper metadata.
    private statePath = path.join(DOCS_PATH, DOCS_STATE);
    // Environment configuration containing necessary keys (e.g., GENAI_KEY) wrapped in a Result.
    private envConfig: Result<Env> = {
        success: false,
        reason: "ENV not loaded",
    } satisfies Result;
    // Instance of an AI helper if available; used for metadata extraction.
    private AI: AI | null = null;
    // Lock flag to prevent simultaneous operations that could corrupt state.
    private isLocked = false;

    constructor() {
        // On instantiation, initialize required directories, files, and configuration.
        this.initialize().catch(console.error);
    }

    /**
     * Initializes the store by ensuring that the base directory, configuration file,
     * and state file exist, and by loading the environment configuration.
     */
    private async initialize(): Promise<void> {
        await this.ensureDir(this.basePath);
        await this.ensureFileExists(this.configPath, "{}");
        await this.ensureFileExists(
            this.statePath,
            JSON.stringify({ papers: {} }, null, 2),
        );
        // Load environment configuration, which might include keys for AI services.
        this.envConfig = getConfig();
        if (
            this.envConfig.success &&
            this.envConfig.value?.GENAI_KEY &&
            this.envConfig.value.MISTRAL_KEY
        ) {
            // Initialize the AI instance if the GENAI_KEY is available.
            this.AI = new AI({
                GoogleAiKey: this.envConfig.value.GENAI_KEY,
                MistralKey: this.envConfig.value.MISTRAL_KEY,
            });
        }
    }

    /**
     * Ensures that a directory exists by creating it recursively if necessary.
     * @param dirPath - The directory path to verify/create.
     */
    private async ensureDir(dirPath: string): Promise<void> {
        try {
            await fs.mkdir(dirPath, { recursive: true });
        } catch (error) {
            console.error("Failed to create directory:", error);
        }
    }

    /**
     * Checks if a file exists, and if not, creates it with the provided default content.
     * @param filePath - The path to the file.
     * @param defaultContent - Content to write to the file if it doesn't exist.
     */
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

    /**
     * Reads and parses the state file which holds metadata for all papers.
     * @returns A Result object wrapping the state.
     */
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

    private async readMetadata(id: string): Promise<Result<PaperHead>> {
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

    /**
     * Updates the status of a paper in the state file.
     * @param id - The unique identifier of the paper.
     * @param status - The new status to set for the paper.
     */
    private async updatePaperStatus(id: string, status: PaperHead["status"]) {
        const metadata = await this.readMetadata(id);
        if (!metadata.success || !metadata.value)
            return err("Failed to get metadata");
        metadata.value.status = status;
        const stateResult = await this.readState();
        if (!stateResult.success || !stateResult.value)
            return err("Failed to get state");
        stateResult.value.papers[id].status = status;
        await this.writeMetadata(id, metadata.value);
    }

    /**
     * Writes the provided state object to the state file.
     * @param state - The state object to be saved.
     * @returns A Result indicating whether the write was successful.
     */
    private async writeState(state: STATE): Promise<Result> {
        try {
            await fs.writeFile(this.statePath, JSON.stringify(state, null, 2));
            return ok();
        } catch (error) {
            console.error("Failed to update state file:", error);
            return err("Failed to update state file");
        }
    }

    /**
     *  Writes the provided metadata object to the metadata file.
     *  @param id - The unique identifier of the paper.
     *  @param metadata - The metadata object to be saved.
     */
    private async writeMetadata(id: string, metadata: PaperHead) {
        const stateResult = await this.readState();
        if (!stateResult.success || !stateResult.value)
            return err("Failed to get state");
        const metadataPath = path.join(
            stateResult.value.papers[id].address,
            "metadata.json",
        );
        try {
            await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
            delete metadata.metadata;
            stateResult.value.papers[id] = metadata;
            return await this.writeState(stateResult.value);
        } catch (error) {
            console.error("Failed to write metadata:", error);
            return err("Failed to write metadata");
        }
    }

    /**
     * Creates a new directory for a paper based on its ID after sanitizing the ID.
     * @param id - The unique paper identifier.
     * @returns The path to the newly created paper directory.
     */
    private async createPaperDir(id: string): Promise<string> {
        // Replace spaces with underscores to avoid issues in directory names.
        const sanitizedId = id.replace(/\s/g, "_");
        const dirPath = path.join(this.basePath, sanitizedId);
        await this.ensureDir(dirPath);
        return dirPath;
    }

    private async ocrPaper(path: string, name: string) {
        const res = await this.AI?.ocrDoc(path, name);
        return res;
    }

    /**
     * Retrieves the current state of documents including all paper metadata.
     * @returns A Result wrapping the state object.
     */
    async getDocsState(): Promise<Result<STATE>> {
        return await this.readState();
    }

    /**
     * Adds a new paper's metadata to the document state.
     * @param paper - The metadata of the paper to add.
     * @returns A Result indicating success or failure.
     */
    async addPaperToDocsState(paper: PaperHead): Promise<Result> {
        const stateResult = await this.readState();
        if (!stateResult.success || !stateResult.value)
            return err("Failed to get state");

        stateResult.value.papers[paper.id] = paper;
        return await this.writeState(stateResult.value);
    }

    /**
     * Removes a paper's metadata from the document state using its ID.
     * @param id - The unique identifier of the paper to remove.
     * @returns A Result indicating success or failure.
     */
    async removePaperFromDocsState(id: string): Promise<Result> {
        const stateResult = await this.readState();
        if (!stateResult.success || !stateResult.value)
            return err("Failed to get state");

        delete stateResult.value.papers[id];
        return await this.writeState(stateResult.value);
    }

    /**
     * Extracts exam metadata from a PDF file.
     * Verifies the file format, ensures sufficient text exists, checks for exam-related keywords,
     * and then uses an AI service to generate structured metadata.
     * @param fileUrl - The path or URL to the PDF file.
     * @returns A Result wrapping the extracted exam metadata.
     */
    async extractExamMetadata(fileUrl: string): Promise<Result<ExamMetadata>> {
        if (!this.envConfig.success)
            return err(this.envConfig.reason || "ENV not loaded");

        const parsedPath = path.parse(fileUrl);
        // Only PDF files are supported.
        if (parsedPath.ext !== ".pdf") return err("Invalid file format");

        const fileBuffer = await fs.readFile(fileUrl);
        const blob = new Blob([fileBuffer]);
        const loader = new PDFLoader(blob);
        const docs = await loader.load();

        // Ensure the extracted text is of adequate length.
        if (docs[0].pageContent.length < 50)
            return err("Failed to extract text");

        // Validate that the content contains keywords indicating a valid exam paper.
        const contentLower = docs[0].pageContent.toLowerCase();
        if (
            !contentLower.includes("cambridge") ||
            !contentLower.includes("paper")
        ) {
            return err("Not a valid exam paper");
        }

        // Use the AI instance to generate structured metadata based on the extracted text.
        const res = await this.AI?.generateStructured(
            docs[0].pageContent,
            ExamMetadataOpenApiSpec.schema as ObjectSchema,
        );
        if (!res?.success)
            return err(res?.reason || "Failed to extract metadata");
        try {
            // Validate the metadata using the defined schema.
            const parsed = EXAM_METADATA_SCHEMA.parse(res.value);
            return ok(parsed);
        } catch {
            return err("Failed to parse metadata");
        }
    }

    /**
     * Adds a paper to the store.
     * Copies the PDF file into a new paper directory, adds its metadata to the state,
     * extracts exam metadata, and updates the paper's metadata file.
     * @param fileUrl - The path or URL to the source PDF file.
     * @returns A Result with a success message or error.
     */
    async addPaper(fileUrl: string): Promise<Result<string>> {
        if (this.isLocked) return err("Store is locked");

        const stateResult = await this.readState();
        if (!stateResult.success || !stateResult.value)
            return err("Failed to get state");
        this.isLocked = true;

        const id = nanoid(); // Generate a unique ID for the new paper.
        const paperDir = await this.createPaperDir(id);
        const pdfOut = path.join(paperDir, `${id}.pdf`);
        const metadataPath = path.join(paperDir, "metadata.json");
        const ocrPath = path.join(paperDir, "ocr.json");

        const paperMetadata: PaperHead = {
            id,
            address: paperDir,
            paperAddress: pdfOut,
            filename: `${id}.pdf`,
            status: "pending",
            hasMarkingScheme: false,
        };

        try {
            // Copy the original PDF to the new location.
            await fs.copyFile(fileUrl, pdfOut);
            // Update the state with the new paper's metadata.
            const addResult = await this.addPaperToDocsState(paperMetadata);
            if (!addResult.success) {
                this.isLocked = false;
                return err("Failed to add paper");
            }

            // Extract exam metadata from the copied PDF AND perform OCR.
            const ocr = await this.ocrPaper(pdfOut, id);
            const examMetadata = await this.extractExamMetadata(pdfOut);
            if (examMetadata.success && examMetadata.value && ocr?.value) {
                paperMetadata.metadata = examMetadata.value;
                // Write updated metadata (including exam data) to a JSON file.
                await fs.writeFile(
                    metadataPath,
                    JSON.stringify(paperMetadata, null, 2),
                );
                // Write OCR data to a JSON file.
                await fs.writeFile(ocrPath, JSON.stringify(ocr.value, null, 2));

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

    /**
     * Retrieves a list of all papers by reading their metadata files.
     * Filters out any papers that could not be properly loaded.
     * @returns A Result wrapping an array of PaperHead objects.
     */
    async getPapers(): Promise<Result<PaperHead[]>> {
        if (this.isLocked) return err("Store is locked");

        const stateResult = await this.readState();
        if (!stateResult.success || !stateResult.value)
            return err("Failed to get state");

        // Load metadata for each paper asynchronously.
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
        // Remove any null entries where metadata failed to load.
        const validPapers = paperHeads.filter(
            (p): p is PaperHead => p !== null,
        );
        return ok(validPapers);
    }

    /**
     * Retrieves the metadata for a specific paper by its ID.
     * @param id - The unique identifier of the paper.
     * @returns A Result wrapping the PaperHead object if found.
     */
    async getPaperById(id: string): Promise<Result<PaperHead & OCRResponse>> {
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
            const ocrContent = await fs.readFile(
                path.join(paper.address, "ocr.json"),
                "utf8",
            );
            const parsed = PAPER_HEAD_SCHEMA.parse(JSON.parse(metadataContent));
            const newParsed = {
                ...parsed,
                ...JSON.parse(ocrContent),
            } satisfies PaperHead & OCRResponse;
            return ok(newParsed);
        } catch (error) {
            console.error("Failed to read paper metadata:", error);
            return err("Failed to retrieve or parse paper metadata");
        }
    }

    /**
     * Retrieves the PDF file of a specific paper in base64url encoding.
     * @param id - The unique identifier of the paper.
     * @returns A Result wrapping the encoded PDF string.
     */
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

    /**
     * Uploads a marking scheme to a paper by copying the file to the paper's directory.
     * @param id - The unique identifier of the paper.
     * @param filepath - The path to the marking scheme PDF file.
     * @returns A Result indicating success or failure.
     */
    async addMarkingSchemeToPaper(
        id: string,
        filepath: string,
    ): Promise<Result> {
        const stateResult = await this.readState();
        if (!stateResult.success || !stateResult.value)
            return err("Failed to get state");
        const paper = stateResult.value.papers[id];
        if (!paper || !paper.address) return err("Paper not found");
        if (paper.hasMarkingScheme)
            return err("Paper already has a marking scheme");

        try {
            const destPath = path.join(paper.address, "marking_scheme.pdf");
            await fs.copyFile(filepath, destPath);
            paper.hasMarkingScheme = true;
            return await this.writeState(stateResult.value);
        } catch (e) {
            console.error("Failed to add marking scheme:", e);
            return err("Failed to add marking scheme");
        }
    }

    /**
     * Deletes a paper by removing its directory and updating the state.
     * @param id - The unique identifier of the paper to delete.
     * @returns A Result indicating whether the deletion was successful.
     */
    async deletePaper(id: string): Promise<Result> {
        const stateResult = await this.readState();
        if (!stateResult.success || !stateResult.value)
            return err("Failed to get state");

        const paper = stateResult.value.papers[id];
        if (!paper || !paper.address) return err("Paper not found");
        try {
            // Remove the entire directory for the paper.
            await fs.rm(paper.address, { recursive: true, force: true });
            // Remove the paper entry from the state.
            delete stateResult.value.papers[id];
            return await this.writeState(stateResult.value);
        } catch (error) {
            console.error("Failed to delete paper:", error);
            return err("Failed to delete paper");
        }
    }

    /**
     * Adds a paper submission by saving the given answers and assocoated id in a json file
     * @param paperId - The unique identifier of the paper.
     * @param answers - The answers submitted by the user.
     */
    async createSubmission(
        paperId: string,
        answers: AnswerObj,
    ): Promise<Result> {
        const stateResult = await this.readState();
        if (!stateResult.success || !stateResult.value)
            return err("Failed to get state");
        const paper = stateResult.value.papers[paperId];
        if (!paper || !paper.address) return err("Paper not found");
        try {
            const destPath = path.join(paper.address, "submission.json");
            await fs.writeFile(destPath, JSON.stringify(answers, null, 2));
            await this.updatePaperStatus(paperId, "pending");
            return ok();
        } catch (e) {
            console.error(e);
            return err("Failed to add submission");
        }
    }

    /**
     * Retrieves and parses the configuration settings from the configuration file.
     * @returns A Result wrapping the configuration object.
     */
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
