import { app } from "electron";
import { z } from "zod";
import { nanoid } from "nanoid";
import { ok, err, Result } from "../../frontend/types/fn";
import * as fs from "fs/promises";
import * as path from "path";

/**
 * Zod schema for the application configuration.
 * Currently empty, but can be expanded as needed.
 */
export const CONFIG_SCHEMA = z.object({});
export type CONFIG = z.infer<typeof CONFIG_SCHEMA>;

/**
 * Zod schema for the metadata of a paper.
 * Contains details such as name, id, address, status, etc.
 */
export const PAPER_HEAD_SCHEMA = z.object({
    name: z.string().nonempty(),
    id: z.string().nonempty(),
    address: z.string().optional(),
    paperAddress: z.string().optional(),
    filename: z.string().optional(),
    status: z.enum(["pending", "completed", "started"]),
});
export type PaperHead = z.infer<typeof PAPER_HEAD_SCHEMA>;

/**
 * Zod schema for exam metadata.
 * Captures details about the exam such as subject, paper code, exam session, and marking details.
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
    duration: z.literal(60),
    total_marks: z.number(),
    document_code: z.string(),
});
export type ExamMetadata = z.infer<typeof EXAM_METADATA_SCHEMA>;

/**
 * State type definition.
 * `papers` is an array of objects where each object maps a paper id to its PaperHead metadata.
 */
type STATE = {
    papers: Record<string, PaperHead>[];
};

// Define the directory and file names used for storing configuration and document state.
const DOCS_PATH = path.join(app.getPath("home"), ".studyassist");
const CONFIG_FILE = "config.json";
const DOCS_STATE = "docs.json";

/**
 * Class for managing paper storage and metadata.
 * Handles creating directories, reading/writing state, and managing paper files.
 */
export class PaperStore {
    private path = DOCS_PATH;
    private configUrl = path.join(DOCS_PATH, CONFIG_FILE);
    private stateUrl = path.join(DOCS_PATH, DOCS_STATE);

    constructor() {
        // Initialize configuration and state when the store is instantiated.
        this.initiateConfig().catch(console.error);
    }

    /**
     * Creates a directory for a paper using its id.
     * Replaces any spaces in the id with underscores.
     *
     * @param id - Identifier for the paper (typically derived from its name).
     * @returns The full path to the created directory.
     */
    private async createPapersDir(id: string): Promise<string> {
        const address = path.join(this.path, id.replace(/\s/g, "_"));
        try {
            await fs.mkdir(address, { recursive: true });
        } catch (error) {
            console.error("Failed to create directory:", error);
        }
        return address;
    }

    /**
     * Ensures that a file exists at the given file path.
     * If the file does not exist, writes the provided default content to it.
     *
     * @param filePath - The path of the file to check.
     * @param defaultContent - The content to write if the file doesn't exist.
     */
    private async ensureFileExists(filePath: string, defaultContent: string) {
        try {
            await fs.access(filePath);
        } catch {
            await fs.writeFile(filePath, defaultContent);
        }
    }

    /**
     * Initializes the configuration directory and necessary files.
     * Creates the main directory and ensures both the config and state files exist.
     */
    private async initiateConfig() {
        try {
            await fs.mkdir(this.path, { recursive: true });
            await this.ensureFileExists(this.configUrl, "{}");
            await this.ensureFileExists(
                this.stateUrl,
                JSON.stringify({ papers: [] }),
            );
        } catch (error) {
            console.error("Error initializing config:", error);
        }
    }

    /**
     * Reads and returns the current documents state from the state file.
     *
     * @returns A Result object containing the state if successful.
     */
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

    /**
     * Adds a new paper to the documents state.
     *
     * @param paper - The PaperHead metadata for the new paper.
     * @returns A Result indicating success or failure.
     */
    async addPaperToDocsState(paper: PaperHead): Promise<Result> {
        const stateResult = await this.getDocsState();
        if (!stateResult.success || !stateResult.value)
            return err("Failed to get state");

        stateResult.value.papers.push({ [paper.id]: paper });

        try {
            await fs.writeFile(
                this.stateUrl,
                JSON.stringify(stateResult.value, null, 2),
            );
            return ok();
        } catch (error) {
            console.error("Failed to update state file:", error);
            return err("Failed to update state file");
        }
    }

    /**
     * Removes a paper from the documents state by its id.
     *
     * @param id - The id of the paper to remove.
     * @returns A Result indicating success or failure.
     */
    async removePaperFromDocsState(id: string): Promise<Result> {
        const stateResult = await this.getDocsState();
        if (!stateResult.success || !stateResult.value)
            return err("Failed to get state");

        stateResult.value.papers = stateResult.value.papers.filter(
            (t) => !t[id],
        );

        try {
            await fs.writeFile(
                this.stateUrl,
                JSON.stringify(stateResult.value, null, 2),
            );
            return ok();
        } catch (error) {
            console.error("Failed to update state file:", error);
            return err("Failed to update state file");
        }
    }

    /**
     * Adds a paper to the store by copying its file to a dedicated directory
     * and saving its metadata.
     *
     * @param fileUrl - The source path of the paper file.
     * @param fileName - The name of the paper.
     * @returns A Result indicating success or failure.
     */
    async addPaper(fileUrl: string, fileName: string): Promise<Result> {
        const state = await this.getDocsState();
        if (!state.success || !state.value) return err("Failed to get state");

        // Generate a unique id for the paper.
        const id = nanoid();
        // Create a directory for the paper.
        const newAddr = await this.createPapersDir(fileName);
        // Define the output PDF path.
        const pdfOut = path.join(newAddr, `${fileName}.pdf`);
        // Create metadata for the new paper.
        const metadata: PaperHead = {
            name: fileName,
            id,
            address: newAddr,
            paperAddress: pdfOut,
            filename: `${fileName}.pdf`,
            status: "pending",
        };

        try {
            // Copy the paper file to the new directory.
            await fs.copyFile(fileUrl, pdfOut);
            // Write the metadata to a metadata.json file.
            await fs.writeFile(
                path.join(newAddr, "metadata.json"),
                JSON.stringify(metadata, null, 2),
            );
            // Add the paper metadata to the documents state.
            return await this.addPaperToDocsState(metadata);
        } catch (error) {
            console.error("Failed to add paper:", error);
            return err("Failed to add paper");
        }
    }

    /**
     * Retrieves all papers stored in the documents state.
     *
     * @returns A Result containing an array of paper records.
     */
    async getPapers(): Promise<Result<Record<string, PaperHead>[]>> {
        const state = await this.getDocsState();
        if (!state.success || !state.value) return err("Failed to get state");

        return ok(state.value.papers);
    }

    /**
     * Retrieves metadata for a specific paper by its id.
     *
     * @param id - The unique identifier of the paper.
     * @returns A Result containing the PaperHead metadata if found.
     */
    async getPaperById(id: string): Promise<Result<PaperHead>> {
        const state = await this.getDocsState();
        if (!state.success || !state.value) return err("Failed to get state");
        const paper = state.value.papers.find((t) => t[id]);
        if (!paper) return err("Paper not found");
        const paperPath = paper?.[id]?.address;
        if (!paperPath) return err("paper not found");
        try {
            const metadata = await fs.readFile(
                path.join(paperPath, "metadata.json"),
                "utf8",
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

    /**
     * Retrieves the PDF file of a paper by its id in base64url encoding.
     *
     * @param id - The unique identifier of the paper.
     * @returns A Result containing the base64url encoded PDF file.
     */
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
                    "base64url",
                ),
            );
        } catch (error) {
            console.error("Failed to read paper file:", error);
            return err("Failed to retrieve or parse paper file");
        }
    }

    /**
     * Deletes a paper from the store by its id.
     * Removes the paper directory and updates the state accordingly.
     *
     * @param id - The unique identifier of the paper.
     * @returns A Result indicating success or failure.
     */
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
                JSON.stringify(state.value, null, 2),
            );
            const res = await this.removePaperFromDocsState(id);
            if (!res.success) return res;
            return ok();
        } catch (error) {
            console.error("Failed to delete paper file:", error);
            return err("Failed to delete paper file");
        }
    }

    /**
     * Retrieves the application configuration.
     *
     * @returns A Result containing the parsed configuration.
     */
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
