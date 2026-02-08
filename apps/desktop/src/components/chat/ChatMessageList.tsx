import { Box } from "@mui/material";
import { useEffect, useRef } from "react";
import { useAppStore } from "../../store";
import { ChatMessageBubble } from "./ChatMessageBubble";

export const ChatMessageList = () => {
  const messageIds = useAppStore((state) => state.chat.messageIds);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messageIds]);

  return (
    <Box
      ref={scrollRef}
      sx={{
        flex: 1,
        overflowY: "auto",
        px: 3,
        py: 2,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {messageIds.map((id) => (
        <ChatMessageBubble key={id} messageId={id} />
      ))}
    </Box>
  );
};
