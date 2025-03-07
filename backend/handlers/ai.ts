import { GoogleGenerativeAI, ObjectSchema } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { Mistral } from "@mistralai/mistralai";
import { err, ok } from "../../frontend/types/fn";
import * as fs from "fs/promises";
import { OCRResponse } from "@mistralai/mistralai/models/components";

export class AI {
    protected GoogleApiKey: string;
    protected MistralApiKey: string;
    genAi: GoogleGenerativeAI;
    fileManager: GoogleAIFileManager;
    mistral: Mistral;
    constructor(props: { GoogleAiKey: string; MistralKey: string }) {
        this.GoogleApiKey = props.GoogleAiKey;
        this.MistralApiKey = props.MistralKey;
        this.genAi = new GoogleGenerativeAI(this.GoogleApiKey);
        this.fileManager = new GoogleAIFileManager(this.GoogleApiKey);
        this.mistral = new Mistral({ apiKey: this.MistralApiKey });
    }

    public async generateStructured(
        prompt: string,
        schema: ObjectSchema,
    ): Promise<Result<String>> {
        const model = this.genAi.getGenerativeModel({
            model: "gemini-2.0-flash-lite",
            systemInstruction: "Extract relevant metadata from given text.",
        });

        const config = {
            responseMimeType: "application/json",
            responseSchema: schema,
        };

        const session = model.startChat({ generationConfig: config });
        const res = await session.sendMessage(prompt);

        return res.response.text()
            ? ok(JSON.parse(res.response.text()))
            : err("Failed to generate structured data.");
    }
    public async ocrDoc(
        path: string,
        id: string,
    ): Promise<Result<OCRResponse>> {
        const doc = await fs.readFile(path);
        const uploadResult = await this.mistral.files.upload({
            file: {
                content: new Blob([doc]),
                fileName: `${id}.pdf`,
            },
            // @ts-ignore - TYPE DEFINITION IS WRONG
            purpose: "ocr",
        });
        const res = await this.mistral.files.retrieve({
            fileId: uploadResult.id,
        });
        const signedUrl = await this.mistral.files.getSignedUrl({
            fileId: res.id,
        });
        const ocr = await this.mistral.ocr.process({
            model: "mistral-ocr-latest",
            document: {
                type: "document_url",
                documentUrl: signedUrl.url,
            },
            includeImageBase64: true,
        });
        return ok(ocr);
    }
}
