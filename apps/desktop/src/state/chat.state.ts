import { Nullable } from "@repo/types";

export type MessageAttachment = {
  type: "transcription" | "text";
  id: string;
  label: string;
  content: string;
};

export type ChatState = {
  activeConversationId: Nullable<string>;
  conversationIds: string[];
  messageIds: string[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingMessageId: Nullable<string>;
  pendingAttachments: MessageAttachment[];
  pendingQuickBarQuery: Nullable<string>;
};

export const INITIAL_CHAT_STATE: ChatState = {
  activeConversationId: null,
  conversationIds: [],
  messageIds: [],
  isLoading: false,
  isStreaming: false,
  streamingMessageId: null,
  pendingAttachments: [],
  pendingQuickBarQuery: null,
};
