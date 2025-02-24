import { app } from "electron";
import { z } from "zod";
import { nanoid } from "nanoid";
import { ok } from "../../src/types/fn";
import * as fs from "fs";
import * as path from "path";
import { URL } from "url";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

export const CONFIG_SCHEMA = z.object({});
export type CONFIG = z.infer<typeof CONFIG_SCHEMA>;

const DOCS_PATH = path.join(app.getPath("home"), "/.studyassist");
const CONFIG_FILE = "config.json";
const DOCS_STATE = "docs.json";

type TestConstructor = {
    name: string;
    id?: string;
};

export abstract class AbstractTest {
    protected name: string;
    protected id?: string;

    constructor({ name }: TestConstructor) {
        this.name = name;
    }
}

export class NewTest extends AbstractTest {
    private fileUrl: string;

    public getText = async () => {
        const buff = fs.readFileSync(this.fileUrl);
        const blob = new Blob([buff], { type: "application/pdf" });

        const loader = new PDFLoader(blob, {
            splitPages: false,
        });
        const docs = await loader.load();
        const res = docs.map((d) => d.pageContent).join("\n");
        ok(res);
    };

    constructor({ name, fileUrl }: TestConstructor & { fileUrl: string }) {
        super({ name });
        this.id = nanoid();
        this.fileUrl = fileUrl;
    }
}

export class Test extends AbstractTest {
    constructor({ name }: TestConstructor) {
        super({ name });
    }
}

export class TestsStore {
    private path = DOCS_PATH;
    private config = CONFIG_FILE;
    private state = DOCS_STATE;
    private configUrl = new URL(`file://${path.join(this.path, this.config)}`); // Use path.join and URL

    private initiateConfig = async () => {
        if (!fs.existsSync(this.configUrl.pathname)) {
            // Check if the file exists
            fs.writeFileSync(this.configUrl.pathname, JSON.stringify({})); // Create config file
        }
    };

    getConfig = async (): Promise<Result<CONFIG>> => {
        await this.initiateConfig();
        if (!fs.existsSync(this.configUrl.pathname))
            return err("Config file not found");
        try {
            const parsed = CONFIG_SCHEMA.parse(
                JSON.parse(fs.readFileSync(this.configUrl.pathname, "utf8")),
            ); // Read file content
            return ok(parsed);
        } catch {
            return err("Failed to parse config file");
        }
    };
}
