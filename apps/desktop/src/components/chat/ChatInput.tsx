import { MicRounded, SendRounded, StopRounded } from "@mui/icons-material";
import { Box, CircularProgress, IconButton, TextField } from "@mui/material";
import { useCallback, useRef, useState } from "react";
import { useIntl } from "react-intl";
import { useVoiceRecording } from "../../hooks/voice-recording.hooks";
import { ChatAttachmentBar } from "./ChatAttachmentBar";

type ChatInputProps = {
  onSend: (content: string) => void;
  disabled?: boolean;
  isStreaming?: boolean;
  onStop?: () => void;
};

export const ChatInput = ({
  onSend,
  disabled,
  isStreaming,
  onStop,
}: ChatInputProps) => {
  const intl = useIntl();
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const onTranscript = useCallback((text: string) => {
    setValue((prev) => {
      const current = prev.trim();
      const combined = current ? `${current} ${text}` : text;
      return combined.slice(0, 10000);
    });
    inputRef.current?.focus();
  }, []);

  const { recordingState, toggle } = useVoiceRecording({ onTranscript });

  const isRecording = recordingState === "recording";
  const isTranscribing = recordingState === "transcribing";

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    inputRef.current?.focus();
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <Box
      sx={(theme) => ({
        px: 3,
        py: 2,
        borderTop: `1px solid ${theme.vars?.palette.level2}`,
        backgroundColor: theme.vars?.palette.level0,
      })}
    >
      <ChatAttachmentBar />
      <Box
        sx={(theme) => ({
          display: "flex",
          alignItems: "flex-end",
          gap: 1,
          backgroundColor: isRecording
            ? theme.vars?.palette.level2
            : theme.vars?.palette.level1,
          borderRadius: 3,
          px: 2,
          py: 1,
          transition: "background-color 0.2s ease",
        })}
      >
        <IconButton
          onClick={toggle}
          disabled={disabled || isTranscribing}
          size="small"
          aria-label={
            isRecording
              ? intl.formatMessage({ defaultMessage: "Stop recording" })
              : intl.formatMessage({ defaultMessage: "Start voice input" })
          }
          sx={(theme) => ({
            color: isRecording ? "#ef4444" : theme.vars?.palette.text.secondary,
          })}
        >
          {isTranscribing ? (
            <CircularProgress size={20} />
          ) : isRecording ? (
            <StopRounded />
          ) : (
            <MicRounded />
          )}
        </IconButton>
        <TextField
          inputRef={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isRecording
              ? intl.formatMessage({ defaultMessage: "Listening..." })
              : intl.formatMessage({
                  defaultMessage: "Ask OSVoice anything...",
                })
          }
          multiline
          maxRows={6}
          fullWidth
          variant="standard"
          disabled={disabled || isRecording}
          slotProps={{
            input: {
              disableUnderline: true,
              sx: { fontSize: 14, py: 0.5 },
            },
          }}
        />
        {isStreaming ? (
          <IconButton
            onClick={onStop}
            size="small"
            aria-label={intl.formatMessage({
              defaultMessage: "Stop generating",
            })}
            sx={{ color: "#ef4444" }}
          >
            <StopRounded />
          </IconButton>
        ) : (
          <IconButton
            onClick={handleSend}
            disabled={!value.trim() || disabled || isRecording}
            size="small"
            aria-label={intl.formatMessage({
              defaultMessage: "Send message",
            })}
            sx={(theme) => ({
              color: value.trim()
                ? theme.vars?.palette.blue
                : theme.vars?.palette.text.secondary,
            })}
          >
            <SendRounded />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};
