import { SendRounded } from "@mui/icons-material";
import { Box, IconButton, TextField } from "@mui/material";
import { useCallback, useRef, useState } from "react";
import { useIntl } from "react-intl";

type ChatInputProps = {
  onSend: (content: string) => void;
  disabled?: boolean;
};

export const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
  const intl = useIntl();
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

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
        borderTop: `1px solid ${theme.vars.palette.level2}`,
        backgroundColor: theme.vars.palette.level0,
      })}
    >
      <Box
        sx={(theme) => ({
          display: "flex",
          alignItems: "flex-end",
          gap: 1,
          backgroundColor: theme.vars.palette.level1,
          borderRadius: 3,
          px: 2,
          py: 1,
        })}
      >
        <TextField
          inputRef={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={intl.formatMessage({
            defaultMessage: "Ask OSVoice anything...",
          })}
          multiline
          maxRows={6}
          fullWidth
          variant="standard"
          disabled={disabled}
          slotProps={{
            input: {
              disableUnderline: true,
              sx: { fontSize: 14, py: 0.5 },
            },
          }}
        />
        <IconButton
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          size="small"
          sx={(theme) => ({
            color: value.trim()
              ? theme.vars.palette.blue
              : theme.vars.palette.text.secondary,
          })}
        >
          <SendRounded />
        </IconButton>
      </Box>
    </Box>
  );
};
