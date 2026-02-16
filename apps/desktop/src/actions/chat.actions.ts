import type { ChatMessage, Conversation, Message } from "@repo/types";
import dayjs from "dayjs";
import { getAppState, produceAppState } from "../store";
import { createId } from "../utils/id.utils";
import { getConversationRepo, getGenerateTextRepo } from "../repos";
import { showErrorSnackbar } from "./app.actions";

const MAX_MESSAGE_LENGTH = 10000;
const MAX_TITLE_LENGTH = 60;
const CONTEXT_WINDOW_SIZE = 20;

export const createNewConversation = async (): Promise<string | null> => {
  const now = dayjs().toISOString();
  const conversation: Conversation = {
    id: createId(),
    title: "",
    createdAt: now,
    updatedAt: now,
  };

  produceAppState((draft) => {
    draft.conversationById[conversation.id] = conversation;
    draft.chat.conversationIds = [
      conversation.id,
      ...draft.chat.conversationIds,
    ];
    draft.chat.activeConversationId = conversation.id;
    draft.chat.messageIds = [];
  });

  try {
    await getConversationRepo().createConversation(conversation);
    return conversation.id;
  } catch (error) {
    produceAppState((draft) => {
      delete draft.conversationById[conversation.id];
      draft.chat.conversationIds = draft.chat.conversationIds.filter(
        (id) => id !== conversation.id,
      );
      draft.chat.activeConversationId = null;
    });
    showErrorSnackbar(error);
    return null;
  }
};

export const loadConversations = async (): Promise<void> => {
  try {
    const conversations = await getConversationRepo().listConversations({
      limit: 50,
    });
    produceAppState((draft) => {
      draft.chat.conversationIds = conversations.map((c) => c.id);
      for (const c of conversations) {
        draft.conversationById[c.id] = c;
      }
    });
  } catch (error) {
    showErrorSnackbar(error);
  }
};

export const loadConversationMessages = async (
  conversationId: string,
): Promise<void> => {
  try {
    const messages = await getConversationRepo().listMessages(conversationId);
    produceAppState((draft) => {
      draft.chat.messageIds = messages.map((m) => m.id);
      for (const m of messages) {
        draft.messageById[m.id] = m;
      }
    });
  } catch (error) {
    showErrorSnackbar(error);
  }
};

export const setActiveConversation = async (
  conversationId: string | null,
): Promise<void> => {
  produceAppState((draft) => {
    for (const mId of draft.chat.messageIds) {
      delete draft.messageById[mId];
    }
    draft.chat.activeConversationId = conversationId;
    draft.chat.messageIds = [];
  });
  if (conversationId) {
    await loadConversationMessages(conversationId);
  }
};

export const sendChatMessage = async (
  conversationId: string,
  content: string,
): Promise<void> => {
  if (getAppState().chat.isLoading) return;

  const trimmed = content.slice(0, MAX_MESSAGE_LENGTH);

  const userMessage: Message = {
    id: createId(),
    conversationId,
    role: "user",
    content: trimmed,
    createdAt: dayjs().toISOString(),
  };

  produceAppState((draft) => {
    draft.messageById[userMessage.id] = userMessage;
    draft.chat.messageIds = [...draft.chat.messageIds, userMessage.id];
    draft.chat.isLoading = true;
  });

  try {
    await getConversationRepo().createMessage(userMessage);

    const { repo, warnings } = getGenerateTextRepo();
    if (!repo) {
      throw new Error(
        warnings.length > 0
          ? warnings.join("; ")
          : "No AI provider configured. Add an API key in Settings.",
      );
    }

    const state = getAppState();
    const chatMessages: ChatMessage[] = state.chat.messageIds
      .slice(-CONTEXT_WINDOW_SIZE)
      .map((id) => state.messageById[id])
      .filter(
        (m): m is Message =>
          !!m && (m.role === "user" || m.role === "assistant"),
      )
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    const systemPrompt =
      "You are OSVoice, a helpful AI assistant. Be concise and clear.";

    const result = await repo.generateChat({
      system: systemPrompt,
      messages: chatMessages,
    });

    const assistantMessage: Message = {
      id: createId(),
      conversationId,
      role: "assistant",
      content: result.text,
      model: result.metadata?.inferenceDevice ?? undefined,
      createdAt: dayjs().toISOString(),
    };

    produceAppState((draft) => {
      draft.messageById[assistantMessage.id] = assistantMessage;
      draft.chat.messageIds = [...draft.chat.messageIds, assistantMessage.id];
      draft.chat.isLoading = false;
    });

    await getConversationRepo().createMessage(assistantMessage);

    const conversation = getAppState().conversationById[conversationId];
    if (conversation && !conversation.title) {
      const title =
        trimmed.length > MAX_TITLE_LENGTH
          ? `${trimmed.slice(0, MAX_TITLE_LENGTH - 3)}...`
          : trimmed;
      const updated: Conversation = {
        ...conversation,
        title,
        updatedAt: dayjs().toISOString(),
      };
      produceAppState((draft) => {
        draft.conversationById[conversationId] = updated;
      });
      await getConversationRepo().updateConversation(updated);
    }
  } catch (error) {
    produceAppState((draft) => {
      draft.chat.isLoading = false;
    });
    showErrorSnackbar(error);
  }
};

export const deleteConversation = async (id: string): Promise<void> => {
  const state = getAppState();
  const wasActive = state.chat.activeConversationId === id;
  const prevConversation = state.conversationById[id];
  const prevConversationIds = state.chat.conversationIds;
  const prevMessageIds = wasActive ? state.chat.messageIds : [];
  const prevMessages = wasActive
    ? Object.fromEntries(
        prevMessageIds
          .map((mId) => [mId, state.messageById[mId]] as const)
          .filter(([, m]) => !!m),
      )
    : {};

  produceAppState((draft) => {
    if (wasActive) {
      for (const mId of draft.chat.messageIds) {
        delete draft.messageById[mId];
      }
      draft.chat.activeConversationId = null;
      draft.chat.messageIds = [];
    }
    delete draft.conversationById[id];
    draft.chat.conversationIds = draft.chat.conversationIds.filter(
      (cId) => cId !== id,
    );
  });

  try {
    await getConversationRepo().deleteConversation(id);
  } catch (error) {
    produceAppState((draft) => {
      if (prevConversation) {
        draft.conversationById[id] = prevConversation;
      }
      draft.chat.conversationIds = prevConversationIds;
      if (wasActive) {
        draft.chat.activeConversationId = id;
        draft.chat.messageIds = prevMessageIds;
        for (const [mId, msg] of Object.entries(prevMessages)) {
          if (msg) draft.messageById[mId] = msg;
        }
      }
    });
    showErrorSnackbar(error);
  }
};
