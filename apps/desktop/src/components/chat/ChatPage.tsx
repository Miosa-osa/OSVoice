import { Box, Stack, Typography } from "@mui/material";
import { useCallback, useEffect } from "react";
import { FormattedMessage } from "react-intl";
import { useAppStore } from "../../store";
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
