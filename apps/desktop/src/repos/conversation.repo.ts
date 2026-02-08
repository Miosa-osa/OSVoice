import { Conversation, Message } from "@repo/types";
import { invoke } from "@tauri-apps/api/core";
import { BaseRepo } from "./base.repo";

type LocalConversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

type LocalMessage = {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  model?: string | null;
  tokensUsed?: number | null;
  createdAt: string;
};

const toLocalConversation = (c: Conversation): LocalConversation => ({
  id: c.id,
  title: c.title,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
});

const fromLocalConversation = (c: LocalConversation): Conversation => ({
  id: c.id,
  title: c.title,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
});

const toLocalMessage = (m: Message): LocalMessage => ({
  id: m.id,
  conversationId: m.conversationId,
  role: m.role,
  content: m.content,
  model: m.model ?? null,
  tokensUsed: m.tokensUsed ?? null,
  createdAt: m.createdAt,
});

const fromLocalMessage = (m: LocalMessage): Message => ({
  id: m.id,
  conversationId: m.conversationId,
  role: m.role as Message["role"],
  content: m.content,
  model: m.model ?? undefined,
  tokensUsed: m.tokensUsed ?? undefined,
  createdAt: m.createdAt,
});

export type ListConversationsParams = {
  limit?: number;
  offset?: number;
};

export abstract class BaseConversationRepo extends BaseRepo {
  abstract createConversation(c: Conversation): Promise<Conversation>;
  abstract listConversations(
    params?: ListConversationsParams,
  ): Promise<Conversation[]>;
  abstract updateConversation(c: Conversation): Promise<Conversation>;
  abstract deleteConversation(id: string): Promise<void>;
  abstract createMessage(m: Message): Promise<Message>;
  abstract listMessages(conversationId: string): Promise<Message[]>;
}

export class LocalConversationRepo extends BaseConversationRepo {
  async createConversation(c: Conversation): Promise<Conversation> {
    const stored = await invoke<LocalConversation>("conversation_create", {
      conversation: toLocalConversation(c),
    });
    return fromLocalConversation(stored);
  }

  async listConversations(
    params: ListConversationsParams = {},
  ): Promise<Conversation[]> {
    const limit = Math.max(0, Math.trunc(params.limit ?? 50));
    const offset = Math.max(0, Math.trunc(params.offset ?? 0));
    const conversations = await invoke<LocalConversation[]>(
      "conversation_list",
      { limit, offset },
    );
    return conversations.map(fromLocalConversation);
  }

  async updateConversation(c: Conversation): Promise<Conversation> {
    const stored = await invoke<LocalConversation>("conversation_update", {
      conversation: toLocalConversation(c),
    });
    return fromLocalConversation(stored);
  }

  async deleteConversation(id: string): Promise<void> {
    await invoke<void>("conversation_delete", { id });
  }

  async createMessage(m: Message): Promise<Message> {
    const stored = await invoke<LocalMessage>("message_create", {
      message: toLocalMessage(m),
    });
    return fromLocalMessage(stored);
  }

  async listMessages(conversationId: string): Promise<Message[]> {
    const messages = await invoke<LocalMessage[]>("message_list", {
      conversationId,
    });
    return messages.map(fromLocalMessage);
  }
}
