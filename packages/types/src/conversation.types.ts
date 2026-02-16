export type MessageRole = "user" | "assistant" | "system";

export type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  model?: string | null;
  tokensUsed?: number | null;
  contextJson?: string | null;
  createdAt: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};
