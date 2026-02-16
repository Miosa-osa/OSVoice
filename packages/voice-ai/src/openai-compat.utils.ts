type ContentPart = { type: string; text?: string | null };

export const contentToString = (
  content: string | ContentPart[] | null | undefined,
): string => {
  if (!content) {
    return "";
  }

  if (typeof content === "string") {
    return content;
  }

  return content
    .map((part) => {
      if (part.type === "text") {
        return part.text ?? "";
      }
      return "";
    })
    .join("")
    .trim();
};

type ChatMessage =
  | { role: "system"; content: string }
  | {
      role: "user";
      content:
        | string
        | Array<
            | { type: "image_url"; image_url: { url: string } }
            | { type: "text"; text: string }
          >;
    }
  | { role: "assistant"; content: string };

export const buildTextMessages = ({
  system,
  prompt,
  imageUrls = [],
}: {
  system?: string;
  prompt: string;
  imageUrls?: string[];
}): ChatMessage[] => {
  const messages: ChatMessage[] = [];
  if (system) {
    messages.push({ role: "system", content: system });
  }

  const userParts: Array<
    | { type: "image_url"; image_url: { url: string } }
    | { type: "text"; text: string }
  > = [];
  for (const url of imageUrls) {
    userParts.push({ type: "image_url", image_url: { url } });
  }
  userParts.push({ type: "text", text: prompt });
  messages.push({ role: "user", content: userParts });

  return messages;
};

export const buildChatMessages = ({
  system,
  messages,
}: {
  system?: string;
  messages: { role: "user" | "assistant"; content: string }[];
}): ChatMessage[] => {
  const chatMessages: ChatMessage[] = [];
  if (system) {
    chatMessages.push({ role: "system", content: system });
  }
  for (const msg of messages) {
    chatMessages.push({ role: msg.role, content: msg.content });
  }
  return chatMessages;
};

type StreamChunk = {
  choices?: Array<{ delta?: { content?: string | null } }>;
  usage?: { total_tokens?: number } | null;
};

export const accumulateStream = async ({
  stream,
  onChunk,
}: {
  stream: AsyncIterable<StreamChunk>;
  onChunk: (delta: string) => void;
}): Promise<{ fullContent: string; tokensUsed: number }> => {
  let fullContent = "";
  let tokensUsed = 0;

  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta?.content;
    if (delta) {
      fullContent += delta;
      onChunk(delta);
    }
    if (chunk.usage?.total_tokens) {
      tokensUsed = chunk.usage.total_tokens;
    }
  }

  return { fullContent, tokensUsed };
};
