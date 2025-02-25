import { app } from "electron";
import { z } from "zod";
import { nanoid } from "nanoid";
import { ok, err, Result } from "../../frontend/types/fn";
import * as fs from "fs/promises";
import * as path from "path";

export const CONFIG_SCHEMA = z.object({});
export type CONFIG = z.infer<typeof CONFIG_SCHEMA>;

export const TEST_HEAD_SCHEMA = z.object({
    name: z.string().nonempty(),
    id: z.string().nonempty(),
    address: z.string().optional(),
    paperAddress: z.string().optional(),
    status: z.enum(["pending", "completed", "started"]),
});
export type TestHead = z.infer<typeof TEST_HEAD_SCHEMA>;

type STATE = {
    tests: Record<string, TestHead>[];
};

const DOCS_PATH = path.join(app.getPath("home"), ".studyassist");
const CONFIG_FILE = "config.json";
const DOCS_STATE = "docs.json";

export class TestsStore {
    private path = DOCS_PATH;
    private configUrl = path.join(DOCS_PATH, CONFIG_FILE);
    private stateUrl = path.join(DOCS_PATH, DOCS_STATE);

    constructor() {
        this.initiateConfig().catch(console.error);
    }

    private async createTestDir(id: string): Promise<string> {
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
                JSON.stringify({ tests: [] }),
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

    async addTestToDocsState(test: TestHead): Promise<Result> {
        const stateResult = await this.getDocsState();
        if (!stateResult.success || !stateResult.value)
            return err("Failed to get state");

        stateResult.value.tests.push({ [test.id]: test });

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
    async removeTestFromDocsState(id: string): Promise<Result> {
        const stateResult = await this.getDocsState();
        if (!stateResult.success || !stateResult.value)
            return err("Failed to get state");

        stateResult.value.tests = stateResult.value.tests.filter((t) => !t[id]);

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

    async addTest(fileUrl: string, fileName: string): Promise<Result> {
        const state = await this.getDocsState();
        if (!state.success || !state.value) return err("Failed to get state");

        const id = nanoid();
        const newAddr = await this.createTestDir(fileName);
        const pdfOut = path.join(newAddr, `${fileName}.pdf`);
        const metadata: TestHead = {
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
                JSON.stringify(metadata, null, 2),
            );
            return await this.addTestToDocsState(metadata);
        } catch (error) {
            console.error("Failed to add test:", error);
            return err("Failed to add test");
        }
    }

    async getTests(): Promise<Result<Record<string, TestHead>[]>> {
        const state = await this.getDocsState();
        if (!state.success || !state.value) return err("Failed to get state");

        return ok(state.value.tests);
    }
    async getTestById(id: string): Promise<Result<TestHead>> {
        const state = await this.getDocsState();
        if (!state.success || !state.value) return err("Failed to get state");
        console.log(JSON.stringify(state.value, null, 2));
        const test = state.value.tests.find((t) => t[id]);
        console.log("filtered Test:", test);
        if (!test) return err("Test not found");
        const testPath = test?.[id]?.address;
        console.log(testPath);
        console.log("Test Path:", testPath);
        if (!testPath) return err("Test not found");
        try {
            const metadata = await fs.readFile(
                path.join(testPath, "metadata.json"),
                "utf8",
            );
            try {
                const parsed = TEST_HEAD_SCHEMA.parse(JSON.parse(metadata));
                return ok(parsed);
            } catch {
                return err("Failed to parse metadata");
            }
        } catch (error) {
            console.error("Failed to read test file:", error);
            return err("Failed to retrieve or parse test file");
        }
    }
    async getTestPdf(id: string): Promise<Result<string>> {
        const state = await this.getDocsState();
        if (!state.success || !state.value) return err("Failed to get state");
        const test = state.value.tests.find((t) => t[id]);
        if (!test) return err("Test not found");
        const testPath = test[id].address;
        if (!testPath) return err("Test not found");
        try {
            return ok(
                await fs.readFile(
                    path.join(testPath, `${test[id].name}.pdf`),
                    "base64url",
                ),
            );
        } catch (error) {
            console.error("Failed to read test file:", error);
            return err("Failed to retrieve or parse test file");
        }
    }

    async deleteTest(id: string): Promise<Result> {
        const state = await this.getDocsState();
        if (!state.success || !state.value) return err("Failed to get state");
        const test = state.value.tests.find((t) => t[id]);
        if (!test) return err("Test not found");
        const testPath = test[id].address;
        if (!testPath) return err("Test not found");
        try {
            await fs.rm(testPath, { recursive: true });
            state.value.tests = state.value.tests.filter((t) => !t[id]);
            await fs.writeFile(
                this.stateUrl,
                JSON.stringify(state.value, null, 2),
            );
            const res = await this.removeTestFromDocsState(id);
            if (!res.success) return res;
            return ok();
        } catch (error) {
            console.error("Failed to delete test file:", error);
            return err("Failed to delete test file");
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
