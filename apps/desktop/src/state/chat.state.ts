import { Nullable } from "@repo/types";

export type ChatState = {
  activeConversationId: Nullable<string>;
  conversationIds: string[];
  messageIds: string[];
  isLoading: boolean;
  pendingQuickBarQuery: Nullable<string>;
};

export const INITIAL_CHAT_STATE: ChatState = {
  activeConversationId: null,
  conversationIds: [],
  messageIds: [],
  isLoading: false,
  pendingQuickBarQuery: null,
};
