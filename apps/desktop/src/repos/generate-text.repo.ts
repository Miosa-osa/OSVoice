import { invokeHandler, type CloudModel } from "@repo/functions";
import {
  ChatMessage,
  JsonResponse,
  Nullable,
  OpenRouterProviderRouting,
} from "@repo/types";
import {
  azureOpenAIGenerateChat,
  azureOpenAIGenerateText,
  claudeGenerateChatResponse,
  claudeGenerateTextResponse,
  ClaudeModel,
  deepseekGenerateChatResponse,
  deepseekGenerateTextResponse,
  DeepseekModel,
  geminiGenerateChatResponse,
  geminiGenerateTextResponse,
  GeminiGenerateTextModel,
  GenerateTextModel,
  groqGenerateChatResponse,
  groqGenerateTextResponse,
  openaiGenerateChatResponse,
  OpenAIGenerateTextModel,
  openaiGenerateTextResponse,
  OPENROUTER_DEFAULT_MODEL,
  openrouterGenerateChatResponse,
  openrouterGenerateTextResponse,
} from "@repo/voice-ai";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { PostProcessingMode } from "../types/ai.types";
import { BaseRepo } from "./base.repo";

export type GenerateTextInput = {
  system?: Nullable<string>;
  prompt: string;
  jsonResponse?: JsonResponse;
};

export type GenerateChatInput = {
  system?: Nullable<string>;
  messages: ChatMessage[];
};

export type GenerateTextMetadata = {
  postProcessingMode?: Nullable<PostProcessingMode>;
  inferenceDevice?: Nullable<string>;
};

export type GenerateTextOutput = {
  text: string;
  metadata?: GenerateTextMetadata;
};

export abstract class BaseGenerateTextRepo extends BaseRepo {
  abstract generateText(input: GenerateTextInput): Promise<GenerateTextOutput>;
  abstract generateChat(input: GenerateChatInput): Promise<GenerateTextOutput>;
}

export class CloudGenerateTextRepo extends BaseGenerateTextRepo {
  private model: CloudModel;

  constructor(model: CloudModel = "medium") {
    super();
    this.model = model;
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    const response = await invokeHandler("ai/generateText", {
      system: input.system,
      prompt: input.prompt,
      jsonResponse: input.jsonResponse,
      model: this.model,
    });

    return {
      text: response.text,
      metadata: {
        postProcessingMode: "cloud",
      },
    };
  }

  async generateChat(input: GenerateChatInput): Promise<GenerateTextOutput> {
    const lastMessage = input.messages[input.messages.length - 1];
    const contextMessages = input.messages.slice(0, -1);
    const context = contextMessages
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n");
    const prompt = context
      ? `${context}\n\nUser: ${lastMessage?.content ?? ""}`
      : (lastMessage?.content ?? "");

    return this.generateText({
      system: input.system,
      prompt,
    });
  }
}

export class GroqGenerateTextRepo extends BaseGenerateTextRepo {
  private groqApiKey: string;
  private model: GenerateTextModel;

  constructor(apiKey: string, model: string | null) {
    super();
    this.groqApiKey = apiKey;
    this.model =
      (model as GenerateTextModel) ??
      "meta-llama/llama-4-scout-17b-16e-instruct";
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    const response = await groqGenerateTextResponse({
      apiKey: this.groqApiKey,
      model: this.model,
      prompt: input.prompt,
      system: input.system ?? undefined,
      jsonResponse: input.jsonResponse,
    });

    return {
      text: response.text,
      metadata: {
        postProcessingMode: "api",
        inferenceDevice: "API • Groq",
      },
    };
  }

  async generateChat(input: GenerateChatInput): Promise<GenerateTextOutput> {
    const response = await groqGenerateChatResponse({
      apiKey: this.groqApiKey,
      model: this.model,
      system: input.system ?? undefined,
      messages: input.messages,
    });

    return {
      text: response.text,
      metadata: {
        postProcessingMode: "api",
        inferenceDevice: "API • Groq",
      },
    };
  }
}

export class OpenAIGenerateTextRepo extends BaseGenerateTextRepo {
  private openaiApiKey: string;
  private model: OpenAIGenerateTextModel;

  constructor(apiKey: string, model: string | null) {
    super();
    this.openaiApiKey = apiKey;
    this.model = (model as OpenAIGenerateTextModel) ?? "gpt-4o-mini";
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    const response = await openaiGenerateTextResponse({
      apiKey: this.openaiApiKey,
      model: this.model,
      prompt: input.prompt,
      system: input.system ?? undefined,
      jsonResponse: input.jsonResponse,
    });

    return {
      text: response.text,
      metadata: {
        postProcessingMode: "api",
        inferenceDevice: "API • OpenAI",
      },
    };
  }

  async generateChat(input: GenerateChatInput): Promise<GenerateTextOutput> {
    const response = await openaiGenerateChatResponse({
      apiKey: this.openaiApiKey,
      model: this.model,
      system: input.system ?? undefined,
      messages: input.messages,
    });

    return {
      text: response.text,
      metadata: {
        postProcessingMode: "api",
        inferenceDevice: "API • OpenAI",
      },
    };
  }
}

export class OllamaGenerateTextRepo extends BaseGenerateTextRepo {
  private ollamaUrl: string;
  private model: string;
  private apiKey: string;

  constructor(url: string, model: string, apiKey?: string) {
    super();
    this.ollamaUrl = url;
    this.model = model;
    this.apiKey = apiKey || "ollama";
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    const response = await openaiGenerateTextResponse({
      baseUrl: this.ollamaUrl,
      apiKey: this.apiKey,
      model: this.model,
      prompt: input.prompt,
      system: input.system ?? undefined,
      jsonResponse: input.jsonResponse,
      customFetch: tauriFetch,
    });

    return {
      text: response.text,
      metadata: {
        postProcessingMode: "api",
        inferenceDevice: "API • Ollama",
      },
    };
  }

  async generateChat(input: GenerateChatInput): Promise<GenerateTextOutput> {
    const response = await openaiGenerateChatResponse({
      baseUrl: this.ollamaUrl,
      apiKey: this.apiKey,
      model: this.model,
      system: input.system ?? undefined,
      messages: input.messages,
      customFetch: tauriFetch,
    });

    return {
      text: response.text,
      metadata: {
        postProcessingMode: "api",
        inferenceDevice: "API • Ollama",
      },
    };
  }
}

export class OpenRouterGenerateTextRepo extends BaseGenerateTextRepo {
  private apiKey: string;
  private model: string;
  private providerRouting?: OpenRouterProviderRouting;

  constructor(
    apiKey: string,
    model: string | null,
    providerRouting?: OpenRouterProviderRouting,
  ) {
    super();
    this.apiKey = apiKey;
    this.model = model ?? OPENROUTER_DEFAULT_MODEL;
    this.providerRouting = providerRouting;
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    const response = await openrouterGenerateTextResponse({
      apiKey: this.apiKey,
      model: this.model,
      prompt: input.prompt,
      system: input.system ?? undefined,
      jsonResponse: input.jsonResponse,
      providerRouting: this.providerRouting,
    });

    return {
      text: response.text,
      metadata: {
        postProcessingMode: "api",
        inferenceDevice: "API • OpenRouter",
      },
    };
  }

  async generateChat(input: GenerateChatInput): Promise<GenerateTextOutput> {
    const response = await openrouterGenerateChatResponse({
      apiKey: this.apiKey,
      model: this.model,
      system: input.system ?? undefined,
      messages: input.messages,
      providerRouting: this.providerRouting,
    });

    return {
      text: response.text,
      metadata: {
        postProcessingMode: "api",
        inferenceDevice: "API • OpenRouter",
      },
    };
  }
}

export class AzureOpenAIGenerateTextRepo extends BaseGenerateTextRepo {
  private apiKey: string;
  private endpoint: string;
  private deploymentName: string;

  constructor(apiKey: string, endpoint: string, deploymentName: string | null) {
    super();
    this.apiKey = apiKey;
    this.endpoint = endpoint;
    this.deploymentName = deploymentName ?? "gpt-4o-mini";
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    const response = await azureOpenAIGenerateText({
      apiKey: this.apiKey,
      endpoint: this.endpoint,
      deploymentName: this.deploymentName,
      system: input.system ?? undefined,
      prompt: input.prompt,
      jsonResponse: input.jsonResponse,
    });

    return {
      text: response.text,
      metadata: {
        postProcessingMode: "api",
        inferenceDevice: "API • Azure OpenAI",
      },
    };
  }

  async generateChat(input: GenerateChatInput): Promise<GenerateTextOutput> {
    const response = await azureOpenAIGenerateChat({
      apiKey: this.apiKey,
      endpoint: this.endpoint,
      deploymentName: this.deploymentName,
      system: input.system ?? undefined,
      messages: input.messages,
    });

    return {
      text: response.text,
      metadata: {
        postProcessingMode: "api",
        inferenceDevice: "API • Azure OpenAI",
      },
    };
  }
}

export class DeepseekGenerateTextRepo extends BaseGenerateTextRepo {
  private apiKey: string;
  private model: DeepseekModel;

  constructor(apiKey: string, model: string | null) {
    super();
    this.apiKey = apiKey;
    this.model = (model as DeepseekModel) ?? "deepseek-chat";
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    const response = await deepseekGenerateTextResponse({
      apiKey: this.apiKey,
      model: this.model,
      prompt: input.prompt,
      system: input.system ?? undefined,
      jsonResponse: input.jsonResponse,
    });

    return {
      text: response.text,
      metadata: {
        postProcessingMode: "api",
        inferenceDevice: "API • DeepSeek",
      },
    };
  }

  async generateChat(input: GenerateChatInput): Promise<GenerateTextOutput> {
    const response = await deepseekGenerateChatResponse({
      apiKey: this.apiKey,
      model: this.model,
      system: input.system ?? undefined,
      messages: input.messages,
    });

    return {
      text: response.text,
      metadata: {
        postProcessingMode: "api",
        inferenceDevice: "API • DeepSeek",
      },
    };
  }
}

export class GeminiGenerateTextRepo extends BaseGenerateTextRepo {
  private apiKey: string;
  private model: GeminiGenerateTextModel;

  constructor(apiKey: string, model: string | null) {
    super();
    this.apiKey = apiKey;
    this.model = (model as GeminiGenerateTextModel) ?? "gemini-2.5-flash";
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    const response = await geminiGenerateTextResponse({
      apiKey: this.apiKey,
      model: this.model,
      prompt: input.prompt,
      system: input.system ?? undefined,
      jsonResponse: input.jsonResponse,
    });

    return {
      text: response.text,
      metadata: {
        postProcessingMode: "api",
        inferenceDevice: "API • Gemini",
      },
    };
  }

  async generateChat(input: GenerateChatInput): Promise<GenerateTextOutput> {
    const response = await geminiGenerateChatResponse({
      apiKey: this.apiKey,
      model: this.model,
      system: input.system ?? undefined,
      messages: input.messages,
    });

    return {
      text: response.text,
      metadata: {
        postProcessingMode: "api",
        inferenceDevice: "API • Gemini",
      },
    };
  }
}

export class ClaudeGenerateTextRepo extends BaseGenerateTextRepo {
  private apiKey: string;
  private model: ClaudeModel;

  constructor(apiKey: string, model: string | null) {
    super();
    this.apiKey = apiKey;
    this.model = (model as ClaudeModel) ?? "claude-sonnet-4-20250514";
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    const response = await claudeGenerateTextResponse({
      apiKey: this.apiKey,
      model: this.model,
      prompt: input.prompt,
      system: input.system ?? undefined,
      jsonResponse: input.jsonResponse,
    });

    return {
      text: response.text,
      metadata: {
        postProcessingMode: "api",
        inferenceDevice: "API • Claude",
      },
    };
  }

  async generateChat(input: GenerateChatInput): Promise<GenerateTextOutput> {
    const response = await claudeGenerateChatResponse({
      apiKey: this.apiKey,
      model: this.model,
      system: input.system ?? undefined,
      messages: input.messages,
    });

    return {
      text: response.text,
      metadata: {
        postProcessingMode: "api",
        inferenceDevice: "API • Claude",
      },
    };
  }
}
