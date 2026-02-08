import { Conversation, Message } from "@repo/types";
import dayjs from "dayjs";
import { getAppState, produceAppState } from "../store";
import { createId } from "../utils/id.utils";
import { getConversationRepo, getGenerateTextRepo } from "../repos";
import { showErrorSnackbar } from "./app.actions";

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
  const userMessage: Message = {
    id: createId(),
    conversationId,
    role: "user",
    content,
    createdAt: dayjs().toISOString(),
  };

  produceAppState((draft) => {
    draft.messageById[userMessage.id] = userMessage;
    draft.chat.messageIds = [...draft.chat.messageIds, userMessage.id];
    draft.chat.isStreaming = true;
    draft.chat.streamingContent = "";
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
    const conversationMessages = state.chat.messageIds
      .map((id) => state.messageById[id])
      .filter(Boolean);

    const systemPrompt =
      "You are OSVoice, a helpful AI assistant. Be concise and clear.";

    const contextMessages = conversationMessages
      .slice(-20)
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n");

    const prompt = contextMessages;

    const result = await repo.generateText({
      system: systemPrompt,
      prompt,
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
      draft.chat.isStreaming = false;
      draft.chat.streamingContent = "";
    });

    await getConversationRepo().createMessage(assistantMessage);

    const conversation = getAppState().conversationById[conversationId];
    if (conversation && !conversation.title) {
      const title =
        content.length > 60 ? `${content.slice(0, 57)}...` : content;
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
      draft.chat.isStreaming = false;
      draft.chat.streamingContent = "";
    });
    showErrorSnackbar(error);
  }
};

export const deleteConversation = async (id: string): Promise<void> => {
  const state = getAppState();
  const wasActive = state.chat.activeConversationId === id;

  produceAppState((draft) => {
    delete draft.conversationById[id];
    draft.chat.conversationIds = draft.chat.conversationIds.filter(
      (cId) => cId !== id,
    );
    if (wasActive) {
      draft.chat.activeConversationId = null;
      draft.chat.messageIds = [];
    }
  });

  try {
    await getConversationRepo().deleteConversation(id);
  } catch (error) {
    showErrorSnackbar(error);
  }
};
