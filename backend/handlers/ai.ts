import { GoogleGenerativeAI, ObjectSchema } from "@google/generative-ai";
import { err, ok } from "../../frontend/types/fn";

export class AI {
    private apiKey: string;
    genAi: GoogleGenerativeAI;
    constructor(apiKey: string) {
        this.apiKey = apiKey;
        this.genAi = new GoogleGenerativeAI(this.apiKey);
    }

    async generateStructured(
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
}
