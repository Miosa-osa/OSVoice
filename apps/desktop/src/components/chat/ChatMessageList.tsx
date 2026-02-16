import { Box, keyframes } from "@mui/material";
import { useEffect, useRef } from "react";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";
import { useAppStore } from "../../store";
import { ChatMessageBubble } from "./ChatMessageBubble";

const bounce = keyframes`
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-4px); }
`;

const TypingIndicator = () => (
  <Box sx={{ display: "flex", justifyContent: "flex-start", width: "100%" }}>
    <Box
      sx={(theme) => ({
        px: 2,
        py: 1.5,
        borderRadius: 3,
        backgroundColor: theme.vars?.palette.level1,
        backdropFilter: "blur(20px)",
        display: "flex",
        gap: 0.5,
        alignItems: "center",
      })}
    >
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={(theme) => ({
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: theme.vars?.palette.text.secondary,
            opacity: 0.6,
            animation: `${bounce} 1.2s ease-in-out infinite`,
            animationDelay: `${i * 0.15}s`,
          })}
        />
      ))}
    </Box>
  </Box>
);

export const ChatMessageList = () => {
  const messageIds = useAppStore((state) => state.chat.messageIds);
  const isLoading = useAppStore((state) => state.chat.isLoading);
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  useEffect(() => {
    if (virtuosoRef.current) {
      virtuosoRef.current.scrollToIndex({
        index: messageIds.length - 1,
        behavior: "smooth",
        align: "end",
      });
    }
  }, [messageIds.length, isLoading]);

  return (
    <Box
      sx={{
        flex: 1,
        overflowY: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Virtuoso
        ref={virtuosoRef}
        data={messageIds}
        followOutput="smooth"
        itemContent={(_index, id) => (
          <Box sx={{ px: 3, py: 1 }}>
            <ChatMessageBubble messageId={id} />
          </Box>
        )}
        style={{ flex: 1 }}
      />
      {isLoading && (
        <Box sx={{ px: 3, py: 1 }}>
          <TypingIndicator />
        </Box>
      )}
    </Box>
  );
};
