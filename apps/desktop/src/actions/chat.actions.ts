import type { ChatMessage, Conversation, Message } from "@repo/types";
import dayjs from "dayjs";
import { getAppState, produceAppState } from "../store";
import { createId } from "../utils/id.utils";
import { getConversationRepo, getGenerateTextRepo } from "../repos";
import { showErrorSnackbar } from "./app.actions";

const MAX_MESSAGE_LENGTH = 10000;
const MAX_TITLE_LENGTH = 60;
const CONTEXT_WINDOW_SIZE = 20;

let activeStreamAbortController: AbortController | null = null;

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

export const stopChatStream = (): void => {
  if (activeStreamAbortController) {
    activeStreamAbortController.abort();
    activeStreamAbortController = null;
  }
};

export const sendChatMessage = async (
  conversationId: string,
  content: string,
): Promise<void> => {
  const { chat } = getAppState();
  if (chat.isLoading || chat.isStreaming) return;

  const trimmed = content.slice(0, MAX_MESSAGE_LENGTH);

  const attachments = [...chat.pendingAttachments];

  const userMessage: Message = {
    id: createId(),
    conversationId,
    role: "user",
    content: trimmed,
    contextJson:
      attachments.length > 0 ? JSON.stringify(attachments) : undefined,
    createdAt: dayjs().toISOString(),
  };

  const assistantMessageId = createId();
  const assistantMessage: Message = {
    id: assistantMessageId,
    conversationId,
    role: "assistant",
    content: "",
    createdAt: dayjs().toISOString(),
  };

  let rafHandle: number | null = null;

  produceAppState((draft) => {
    draft.messageById[userMessage.id] = userMessage;
    draft.messageById[assistantMessageId] = assistantMessage;
    draft.chat.messageIds = [
      ...draft.chat.messageIds,
      userMessage.id,
      assistantMessageId,
    ];
    draft.chat.isLoading = true;
    draft.chat.streamingMessageId = assistantMessageId;
    draft.chat.pendingAttachments = [];
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
      .slice(0, -1)
      .slice(-CONTEXT_WINDOW_SIZE)
      .map((id) => state.messageById[id])
      .filter(
        (m): m is Message =>
          !!m &&
          (m.role === "user" || m.role === "assistant") &&
          m.content !== "",
      )
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    let systemPrompt =
      "You are OSVoice, a helpful AI assistant. Be concise and clear.";

    if (attachments.length > 0) {
      const contextParts = attachments.map(
        (a) => `[${a.type}: ${a.label}]\n${a.content}`,
      );
      systemPrompt += `\n\nThe user has attached the following context:\n\n${contextParts.join("\n\n")}`;
    }

    activeStreamAbortController = new AbortController();
    const { signal } = activeStreamAbortController;

    let accumulated = "";
    let firstChunk = true;

    const flushToState = () => {
      rafHandle = null;
      const snapshot = accumulated;
      produceAppState((draft) => {
        const msg = draft.messageById[assistantMessageId];
        if (msg) {
          msg.content = snapshot;
        }
      });
    };

    const result = await repo.generateChatStream({
      system: systemPrompt,
      messages: chatMessages,
      onChunk: (delta: string) => {
        if (signal.aborted) {
          throw new DOMException("Aborted", "AbortError");
        }
        if (firstChunk) {
          firstChunk = false;
          produceAppState((draft) => {
            draft.chat.isLoading = false;
            draft.chat.isStreaming = true;
          });
        }
        accumulated += delta;
        if (rafHandle === null) {
          rafHandle = requestAnimationFrame(flushToState);
        }
      },
    });

    activeStreamAbortController = null;

    if (rafHandle !== null) {
      cancelAnimationFrame(rafHandle);
      rafHandle = null;
    }

    produceAppState((draft) => {
      const msg = draft.messageById[assistantMessageId];
      if (msg) {
        msg.content = result.text;
        msg.model = result.metadata?.inferenceDevice ?? undefined;
      }
      draft.chat.isLoading = false;
      draft.chat.isStreaming = false;
      draft.chat.streamingMessageId = null;
    });

    await getConversationRepo().createMessage({
      ...assistantMessage,
      content: result.text,
      model: result.metadata?.inferenceDevice ?? undefined,
    });

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
    activeStreamAbortController = null;
    if (rafHandle !== null) {
      cancelAnimationFrame(rafHandle);
      rafHandle = null;
    }
    const isAbort =
      error instanceof DOMException && error.name === "AbortError";

    produceAppState((draft) => {
      draft.chat.isLoading = false;
      draft.chat.isStreaming = false;
      draft.chat.streamingMessageId = null;
      if (!isAbort) {
        const msg = draft.messageById[assistantMessageId];
        if (msg && !msg.content) {
          delete draft.messageById[assistantMessageId];
          draft.chat.messageIds = draft.chat.messageIds.filter(
            (id) => id !== assistantMessageId,
          );
        }
      }
    });

    if (!isAbort) {
      showErrorSnackbar(error);
    }
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
