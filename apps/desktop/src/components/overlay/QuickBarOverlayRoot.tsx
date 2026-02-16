import {
  ArrowUpward,
  AutoAwesomeOutlined,
  KeyboardCommandKeyRounded,
  MicRounded,
  MoreHorizRounded,
  StopRounded,
} from "@mui/icons-material";
import {
  Box,
  CircularProgress,
  IconButton,
  InputBase,
  Typography,
} from "@mui/material";
import { emitTo } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useCallback, useEffect, useRef, useState } from "react";
import { useIntl } from "react-intl";
import { useVoiceRecording } from "../../hooks/voice-recording.hooks";

const INTERACTIVE_SELECTOR =
  'button, input, textarea, select, a, [role="button"]';

const menuItemSx = {
  px: "12px",
  py: "8px",
  fontSize: "13px",
  color: "rgba(255, 255, 255, 0.85)",
  cursor: "pointer",
  userSelect: "none",
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
} as const;

export const QuickBarOverlayRoot = () => {
  const intl = useIntl();
  const [value, setValue] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onTranscript = useCallback((text: string) => {
    setValue((prev) => {
      const current = prev.trim();
      return current ? `${current} ${text}` : text;
    });
  }, []);

  const onError = useCallback((error: unknown) => {
    console.error("Voice recording failed", error);
  }, []);

  const { recordingState, toggle } = useVoiceRecording({
    onTranscript,
    onError,
  });

  const isRecording = recordingState === "recording";

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.overflow = "hidden";
    document.body.style.backgroundColor = "transparent";
  }, []);

  useEffect(() => {
    emitTo("main", "overlay_ready", { windowLabel: "quick-bar-overlay" }).catch(
      console.error,
    );
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || trimmed.length > 500) return;
    emitTo("main", "quick-bar-query", { query: trimmed }).catch(console.error);
    setValue("");
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSend();
      } else if (e.key === "Escape") {
        if (menuOpen) {
          setMenuOpen(false);
        } else {
          inputRef.current?.blur();
        }
      }
    },
    [handleSend, menuOpen],
  );

  const handlePillMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest(INTERACTIVE_SELECTOR)) return;
    e.preventDefault();
    void getCurrentWindow().startDragging();
  }, []);

  const handleMenuToggle = useCallback(() => {
    setMenuOpen((prev) => !prev);
  }, []);

  const handleSettings = useCallback(() => {
    setMenuOpen(false);
    emitTo("main", "quick-bar-open-settings", {}).catch(console.error);
  }, []);

  const handleNewChat = useCallback(() => {
    setMenuOpen(false);
    emitTo("main", "quick-bar-open-chat", {}).catch(console.error);
  }, []);

  const handleHide = useCallback(() => {
    setMenuOpen(false);
    getCurrentWindow().hide().catch(console.error);
  }, []);

  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        alignItems: "center",
        padding: "4px",
        position: "relative",
      }}
    >
      {menuOpen && (
        <Box
          sx={{
            width: "180px",
            backgroundColor: "rgba(30, 30, 30, 0.95)",
            backdropFilter: "blur(20px)",
            borderRadius: "8px",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
            overflow: "hidden",
            py: "4px",
            mb: "6px",
            alignSelf: "flex-end",
            mr: "4px",
          }}
        >
          <Box onClick={handleSettings} sx={menuItemSx}>
            {intl.formatMessage({ defaultMessage: "Preferences" })}
          </Box>
          <Box onClick={handleNewChat} sx={menuItemSx}>
            {intl.formatMessage({ defaultMessage: "New Chat" })}
          </Box>
          <Box onClick={handleHide} sx={menuItemSx}>
            {intl.formatMessage({ defaultMessage: "Hide Assistant" })}
          </Box>
        </Box>
      )}

      <Box
        onMouseDown={handlePillMouseDown}
        sx={{
          width: "100%",
          height: "36px",
          backgroundColor: "rgba(30, 30, 30, 0.85)",
          backdropFilter: "blur(20px)",
          borderRadius: "18px",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.3)",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          cursor: "default",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "40px",
            height: "100%",
            flexShrink: 0,
            cursor: "grab",
          }}
        >
          <AutoAwesomeOutlined
            sx={{
              color: "rgba(255, 255, 255, 0.6)",
              fontSize: "16px",
              pointerEvents: "none",
            }}
          />
        </Box>

        <InputBase
          inputRef={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isRecording
              ? intl.formatMessage({ defaultMessage: "Listening..." })
              : intl.formatMessage({ defaultMessage: "Ask OSVoice..." })
          }
          fullWidth
          disabled={isRecording}
          sx={{
            color: "#FFFFFF",
            fontSize: "13px",
            fontWeight: 400,
            "& input": { padding: 0, height: "100%" },
            "& input::placeholder": {
              color: "rgba(255, 255, 255, 0.5)",
              opacity: 1,
            },
          }}
        />

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "2px",
            opacity: 0.35,
            flexShrink: 0,
            mr: "4px",
            pointerEvents: "none",
          }}
        >
          <KeyboardCommandKeyRounded sx={{ fontSize: 12, color: "#fff" }} />
          <Typography sx={{ fontSize: 11, color: "#fff", lineHeight: 1 }}>
            .
          </Typography>
        </Box>

        <IconButton
          onClick={toggle}
          size="small"
          aria-label={
            isRecording
              ? intl.formatMessage({ defaultMessage: "Stop recording" })
              : intl.formatMessage({ defaultMessage: "Start voice input" })
          }
          sx={{
            width: "28px",
            height: "28px",
            flexShrink: 0,
            color: isRecording ? "#ef4444" : "rgba(255, 255, 255, 0.5)",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            },
          }}
        >
          {recordingState === "transcribing" ? (
            <CircularProgress size={14} sx={{ color: "#fff" }} />
          ) : isRecording ? (
            <StopRounded sx={{ fontSize: "16px" }} />
          ) : (
            <MicRounded sx={{ fontSize: "16px" }} />
          )}
        </IconButton>

        {value ? (
          <IconButton
            onClick={handleSend}
            size="small"
            aria-label={intl.formatMessage({ defaultMessage: "Send query" })}
            sx={{
              width: "28px",
              height: "28px",
              flexShrink: 0,
              mr: "4px",
              backgroundColor: "rgba(255, 255, 255, 0.12)",
              color: "#FFFFFF",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.18)",
              },
            }}
          >
            <ArrowUpward sx={{ fontSize: "14px" }} />
          </IconButton>
        ) : (
          <IconButton
            size="small"
            onClick={handleMenuToggle}
            aria-label={intl.formatMessage({ defaultMessage: "Open menu" })}
            sx={{
              width: "28px",
              height: "28px",
              flexShrink: 0,
              mr: "4px",
              color: "rgba(255, 255, 255, 0.5)",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            <MoreHorizRounded sx={{ fontSize: "16px" }} />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};
