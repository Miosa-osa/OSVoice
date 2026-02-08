import { Box, Typography } from "@mui/material";
import { useAppStore } from "../../store";

type ChatMessageBubbleProps = {
  messageId: string;
};

export const ChatMessageBubble = ({ messageId }: ChatMessageBubbleProps) => {
  const message = useAppStore((state) => state.messageById[messageId]);

  if (!message) return null;

  const isUser = message.role === "user";

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        width: "100%",
      }}
    >
      <Box
        sx={(theme) => ({
          maxWidth: "80%",
          px: 2,
          py: 1.5,
          borderRadius: 3,
          backgroundColor: isUser
            ? theme.vars.palette.blue
            : theme.vars.palette.level1,
          color: isUser
            ? theme.vars.palette.onBlue
            : theme.vars.palette.text.primary,
          backdropFilter: isUser ? "none" : "blur(20px)",
        })}
      >
        <Typography
          variant="body2"
          sx={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            lineHeight: 1.6,
          }}
        >
          {message.content}
        </Typography>
        {message.model && (
          <Typography
            variant="caption"
            sx={{
              display: "block",
              mt: 0.5,
              opacity: 0.6,
              fontSize: "0.7rem",
            }}
          >
            {message.model}
          </Typography>
        )}
      </Box>
    </Box>
  );
};
