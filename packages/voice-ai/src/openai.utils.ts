import OpenAI, { toFile } from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { retry } from "@repo/utilities/src/async";
import { countWords } from "@repo/utilities/src/string";
import type { JsonResponse } from "@repo/types";
import {
  contentToString,
  buildTextMessages,
  buildChatMessages,
  accumulateStream,
} from "./openai-compat.utils";

export const OPENAI_GENERATE_TEXT_MODELS = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4-turbo",
  "gpt-3.5-turbo",
] as const;
export type OpenAIGenerateTextModel =
  (typeof OPENAI_GENERATE_TEXT_MODELS)[number];

export const OPENAI_TRANSCRIPTION_MODELS = ["whisper-1"] as const;
export type OpenAITranscriptionModel =
  (typeof OPENAI_TRANSCRIPTION_MODELS)[number];

const createClient = (
  apiKey: string,
  baseUrl?: string,
  customFetch?: typeof globalThis.fetch,
) => {
  // `dangerouslyAllowBrowser` is needed because this runs on a desktop tauri app.
  // The Tauri app doesn't run in a web browser and encrypts API keys locally, so this
  // is safe.
  return new OpenAI({
    apiKey: apiKey.trim(),
    baseURL: baseUrl,
    dangerouslyAllowBrowser: true,
    fetch: customFetch,
  });
};

export type OpenAITranscriptionArgs = {
  apiKey: string;
  model?: OpenAITranscriptionModel;
  blob: ArrayBuffer | Buffer;
  ext: string;
  prompt?: string;
  language?: string;
};

export type OpenAITranscribeAudioOutput = {
  text: string;
  wordsUsed: number;
};

export const openaiTranscribeAudio = async ({
  apiKey,
  model = "whisper-1",
  blob,
  ext,
  prompt,
  language,
}: OpenAITranscriptionArgs): Promise<OpenAITranscribeAudioOutput> => {
  return retry({
    retries: 3,
    fn: async () => {
      const client = createClient(apiKey);

      const file = await toFile(blob, `audio.${ext}`);
      const response = await client.audio.transcriptions.create({
        file,
        model,
        prompt,
        language: language ?? "en",
      });

      if (!response.text) {
        throw new Error("Transcription failed");
      }

      return { text: response.text, wordsUsed: countWords(response.text) };
    },
  });
};

export type OpenAIGenerateTextArgs = {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  system?: string;
  prompt: string;
  imageUrls?: string[];
  jsonResponse?: JsonResponse;
  customFetch?: typeof globalThis.fetch;
};

export type OpenAIGenerateResponseOutput = {
  text: string;
  tokensUsed: number;
};

export const openaiGenerateTextResponse = async ({
  apiKey,
  baseUrl,
  model = "gpt-4o-mini",
  system,
  prompt,
  imageUrls = [],
  jsonResponse,
  customFetch,
}: OpenAIGenerateTextArgs): Promise<OpenAIGenerateResponseOutput> => {
  return retry({
    retries: 3,
    fn: async () => {
      const client = createClient(apiKey, baseUrl, customFetch);

      const messages = buildTextMessages({ system, prompt, imageUrls });

      const response = await client.chat.completions.create({
        messages,
        model,
        temperature: 1,
        max_completion_tokens: 1024,
        top_p: 1,
        response_format: jsonResponse
          ? {
              type: "json_schema",
              json_schema: {
                name: jsonResponse.name,
                description: jsonResponse.description,
                schema: jsonResponse.schema,
                strict: true,
              },
            }
          : undefined,
      });

      console.log("openai llm usage:", response.usage);
      if (!response.choices || response.choices.length === 0) {
        throw new Error("No response from OpenAI");
      }

      const result = response.choices[0].message.content;
      if (!result) {
        throw new Error("Content is empty");
      }

      const content = contentToString(result);
      return {
        text: content,
        tokensUsed: response.usage?.total_tokens ?? countWords(content),
      };
    },
  });
};

export type OpenAIGenerateChatArgs = {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  system?: string;
  messages: { role: "user" | "assistant"; content: string }[];
  customFetch?: typeof globalThis.fetch;
};

export const openaiGenerateChatResponse = async ({
  apiKey,
  baseUrl,
  model = "gpt-4o-mini",
  system,
  messages,
  customFetch,
}: OpenAIGenerateChatArgs): Promise<OpenAIGenerateResponseOutput> => {
  return retry({
    retries: 3,
    fn: async () => {
      const client = createClient(apiKey, baseUrl, customFetch);

      const chatMessages = buildChatMessages({ system, messages });

      const response = await client.chat.completions.create({
        messages: chatMessages,
        model,
        temperature: 1,
        max_completion_tokens: 1024,
        top_p: 1,
      });

      console.log("openai chat usage:", response.usage);
      if (!response.choices || response.choices.length === 0) {
        throw new Error("No response from OpenAI");
      }

      const result = response.choices[0].message.content;
      if (!result) {
        throw new Error("Content is empty");
      }

      const content = contentToString(result);
      return {
        text: content,
        tokensUsed: response.usage?.total_tokens ?? countWords(content),
      };
    },
  });
};

export type OpenAIStreamChatArgs = {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  system?: string;
  messages: { role: "user" | "assistant"; content: string }[];
  onChunk: (delta: string) => void;
  customFetch?: typeof globalThis.fetch;
};

export const openaiStreamChatResponse = async ({
  apiKey,
  baseUrl,
  model = "gpt-4o-mini",
  system,
  messages,
  onChunk,
  customFetch,
}: OpenAIStreamChatArgs): Promise<OpenAIGenerateResponseOutput> => {
  const client = createClient(apiKey, baseUrl, customFetch);

  const chatMessages = buildChatMessages({ system, messages });

  const stream = await client.chat.completions.create({
    messages: chatMessages,
    model,
    temperature: 1,
    max_completion_tokens: 1024,
    top_p: 1,
    stream: true,
    stream_options: { include_usage: true },
  });

  const { fullContent, tokensUsed } = await accumulateStream({
    stream,
    onChunk,
  });

  if (!fullContent) {
    throw new Error("No response from OpenAI");
  }

  return {
    text: fullContent,
    tokensUsed: tokensUsed || countWords(fullContent),
  };
};

export type OpenAITestIntegrationArgs = {
  apiKey: string;
};

export const openaiTestIntegration = async ({
  apiKey,
}: OpenAITestIntegrationArgs): Promise<boolean> => {
  const client = createClient(apiKey);

  const response = await client.chat.completions.create({
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Reply with the single word "Hello."`,
          },
        ],
      },
    ],
    model: "gpt-4o-mini",
    temperature: 0,
    max_completion_tokens: 32,
    top_p: 1,
  });

  if (!response.choices || response.choices.length === 0) {
    throw new Error("No response from OpenAI");
  }

  const first = response.choices[0];
  const content = contentToString(first?.message?.content);
  if (!content) {
    throw new Error("Response content is empty");
  }

  return content.toLowerCase().includes("hello");
};
