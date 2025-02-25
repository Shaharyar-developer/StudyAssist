import { app } from "electron";
import { z } from "zod";
import { nanoid } from "nanoid";
import { ok, err, Result } from "../../src/types/fn";
import * as fs from "fs/promises";
import * as path from "path";
import { URL } from "url";

export const CONFIG_SCHEMA = z.object({});
export type CONFIG = z.infer<typeof CONFIG_SCHEMA>;

type TestHead = {
    name: string;
    id?: string;
    address?: string;
};

type STATE = {
    tests: Record<string, TestHead>[];
};

const DOCS_PATH = path.join(app.getPath("home"), ".studyassist");
const CONFIG_FILE = "config.json";
const DOCS_STATE = "docs.json";

export class TestsStore {
    private path = DOCS_PATH;
    private configUrl = new URL(`file://${path.join(DOCS_PATH, CONFIG_FILE)}`);
    private stateUrl = new URL(`file://${path.join(DOCS_PATH, DOCS_STATE)}`);

    constructor() {
        this.initiateConfig().catch(console.error);
    }

    private async createTestDir(name: string): Promise<string> {
        const address = path.join(this.path, name.replace(/\s/g, "_"));
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
            await this.ensureFileExists(this.configUrl.pathname, "{}");
            await this.ensureFileExists(
                this.stateUrl.pathname,
                JSON.stringify({ tests: [] }),
            );
        } catch (error) {
            console.error("Error initializing config:", error);
        }
    }

    async getDocsState(): Promise<Result<STATE>> {
        try {
            const content = await fs.readFile(this.stateUrl.pathname, "utf8");
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

        stateResult.value.tests.push({ [test.name]: test });

        try {
            await fs.writeFile(
                this.stateUrl.pathname,
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
                this.stateUrl.pathname,
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
        const metadata: TestHead = { name: fileName, id, address: pdfOut };

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
    async getTestById(id: string): Promise<Result<unknown>> {
        const state = await this.getDocsState();
        if (!state.success || !state.value) return err("Failed to get state");
        const test = state.value.tests.find((t) => t[id]);
        if (!test) return err("Test not found");
        const testPath = test[id].address;
        if (!testPath) return err("Test not found");
        try {
            const content = await fs.readFile(testPath, "base64url");
            return ok(content);
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
                this.stateUrl.pathname,
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
            const content = await fs.readFile(this.configUrl.pathname, "utf8");
            return ok(CONFIG_SCHEMA.parse(JSON.parse(content)));
        } catch (error) {
            console.error("Failed to read config file:", error);
            return err("Failed to retrieve or parse config file");
        }
    }
}
