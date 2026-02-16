import { Nullable } from "@repo/types";

export type ChatState = {
  activeConversationId: Nullable<string>;
  conversationIds: string[];
  messageIds: string[];
  isStreaming: boolean;
  streamingContent: string;
  pendingQuickBarQuery: Nullable<string>;
};

export const INITIAL_CHAT_STATE: ChatState = {
  activeConversationId: null,
  conversationIds: [],
  messageIds: [],
  isStreaming: false,
  streamingContent: "",
  pendingQuickBarQuery: null,
};
