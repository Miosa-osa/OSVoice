import { Box, Typography } from "@mui/material";
import { memo } from "react";
import Markdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { useAppStore } from "../../store";

type ChatMessageBubbleProps = {
  messageId: string;
};

const REMARK_PLUGINS = [remarkGfm];
const REHYPE_PLUGINS = [rehypeSanitize];

export const ChatMessageBubble = memo(
  ({ messageId }: ChatMessageBubbleProps) => {
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
              ? theme.vars?.palette.blue
              : theme.vars?.palette.level1,
            color: isUser
              ? theme.vars?.palette.onBlue
              : theme.vars?.palette.text.primary,
            backdropFilter: isUser ? "none" : "blur(20px)",
          })}
        >
          {isUser ? (
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
          ) : (
            <Box
              sx={(theme) => ({
                fontSize: 14,
                lineHeight: 1.6,
                wordBreak: "break-word",
                "& p": { margin: 0 },
                "& p + p": { mt: 1.5 },
                "& code": {
                  backgroundColor: theme.vars?.palette.level2,
                  borderRadius: 1,
                  px: 0.5,
                  py: 0.25,
                  fontSize: "0.85em",
                  fontFamily: "monospace",
                },
                "& pre": {
                  backgroundColor: theme.vars?.palette.level2,
                  borderRadius: 2,
                  p: 1.5,
                  overflow: "auto",
                  my: 1,
                  "& code": {
                    backgroundColor: "transparent",
                    p: 0,
                  },
                },
                "& ul, & ol": { pl: 2.5, my: 0.5 },
                "& li": { mb: 0.25 },
                "& a": { color: theme.vars?.palette.blue },
                "& blockquote": {
                  borderLeft: `3px solid ${theme.vars?.palette.level3}`,
                  pl: 1.5,
                  my: 1,
                  opacity: 0.85,
                },
                "& table": {
                  borderCollapse: "collapse",
                  my: 1,
                  "& th, & td": {
                    border: `1px solid ${theme.vars?.palette.level3}`,
                    px: 1,
                    py: 0.5,
                    fontSize: 13,
                  },
                },
              })}
            >
              <Markdown
                remarkPlugins={REMARK_PLUGINS}
                rehypePlugins={REHYPE_PLUGINS}
              >
                {message.content}
              </Markdown>
            </Box>
          )}
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
  },
);
