import { Box, Stack, Typography } from "@mui/material";
import { useCallback, useEffect, useRef } from "react";
import { FormattedMessage } from "react-intl";
import { produceAppState, useAppStore } from "../../store";
import {
  loadConversationMessages,
  loadConversations,
  sendChatMessage,
  createNewConversation,
  stopChatStream,
} from "../../actions/chat.actions";
import { ChatInput } from "./ChatInput";
import { ChatMessageList } from "./ChatMessageList";
import { ChatEmptyState } from "./ChatEmptyState";
import { ChatConversationList } from "./ChatConversationList";

export default function ChatPage() {
  const activeConversationId = useAppStore(
    (state) => state.chat.activeConversationId,
  );
  const messageIds = useAppStore((state) => state.chat.messageIds);
  const isLoading = useAppStore((state) => state.chat.isLoading);
  const isStreaming = useAppStore((state) => state.chat.isStreaming);
  const pendingQuery = useAppStore((state) => state.chat.pendingQuickBarQuery);
  const pendingHandled = useRef(false);

  useEffect(() => {
    void loadConversations();
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      void loadConversationMessages(activeConversationId);
    }
  }, [activeConversationId]);

  const handleSend = useCallback(
    async (content: string) => {
      if (!content.trim()) return;
      let convId = activeConversationId;
      if (!convId) {
        convId = await createNewConversation();
      }
      if (convId) {
        await sendChatMessage(convId, content);
      }
    },
    [activeConversationId],
  );

  const handleNewConversation = useCallback(() => {
    produceAppState((draft) => {
      draft.chat.activeConversationId = null;
      draft.chat.messageIds = [];
    });
  }, []);

  useEffect(() => {
    if (pendingQuery && !pendingHandled.current) {
      pendingHandled.current = true;
      produceAppState((draft) => {
        draft.chat.pendingQuickBarQuery = null;
      });
      void handleSend(pendingQuery);
    } else if (!pendingQuery) {
      pendingHandled.current = false;
    }
  }, [pendingQuery, handleSend]);

  return (
    <Stack
      sx={{
        height: "100%",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 3,
          pt: 3,
          pb: 1,
        }}
      >
        <Typography variant="titleMedium">
          <FormattedMessage defaultMessage="Chat" />
        </Typography>
      </Box>
      <Box
        sx={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "row",
        }}
      >
        <ChatConversationList onNewConversation={handleNewConversation} />
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              flex: 1,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {messageIds.length === 0 && !isLoading && !isStreaming ? (
              <ChatEmptyState />
            ) : (
              <ChatMessageList />
            )}
          </Box>
          <ChatInput
            onSend={handleSend}
            disabled={isLoading || isStreaming}
            isStreaming={isStreaming}
            onStop={stopChatStream}
          />
        </Box>
      </Box>
    </Stack>
  );
}
