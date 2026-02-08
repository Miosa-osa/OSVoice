import { Box, Stack, Typography } from "@mui/material";
import { useCallback, useEffect, useRef } from "react";
import { FormattedMessage } from "react-intl";
import { produceAppState, useAppStore } from "../../store";
import {
  loadConversationMessages,
  sendChatMessage,
  createNewConversation,
} from "../../actions/chat.actions";
import { ChatInput } from "./ChatInput";
import { ChatMessageList } from "./ChatMessageList";
import { ChatEmptyState } from "./ChatEmptyState";

export default function ChatPage() {
  const activeConversationId = useAppStore(
    (state) => state.chat.activeConversationId,
  );
  const messageIds = useAppStore((state) => state.chat.messageIds);
  const isStreaming = useAppStore((state) => state.chat.isStreaming);
  const pendingQuery = useAppStore((state) => state.chat.pendingQuickBarQuery);
  const pendingHandled = useRef(false);

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
          flexDirection: "column",
        }}
      >
        {messageIds.length === 0 && !isStreaming ? (
          <ChatEmptyState />
        ) : (
          <ChatMessageList />
        )}
      </Box>
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </Stack>
  );
}
