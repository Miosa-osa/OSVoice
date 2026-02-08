import { ArrowUpward, AutoAwesomeOutlined } from "@mui/icons-material";
import { Box, IconButton, InputBase } from "@mui/material";
import { emitTo } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";
import { useIntl } from "react-intl";

export const QuickBarOverlayRoot = () => {
  const intl = useIntl();
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    emitTo("main", "quick-bar-query", { query: trimmed }).catch(console.error);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    } else if (e.key === "Escape") {
      inputRef.current?.blur();
    }
  };

  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4px",
      }}
    >
      <Box
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
          paddingLeft: "12px",
          paddingRight: "6px",
          gap: "8px",
        }}
      >
        <AutoAwesomeOutlined
          sx={{
            color: "rgba(255, 255, 255, 0.6)",
            fontSize: "16px",
          }}
        />
        <InputBase
          inputRef={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={intl.formatMessage({
            defaultMessage: "Ask OSVoice...",
          })}
          fullWidth
          sx={{
            color: "#FFFFFF",
            fontSize: "13px",
            fontWeight: 400,
            "& input::placeholder": {
              color: "rgba(255, 255, 255, 0.5)",
              opacity: 1,
            },
          }}
        />
        {value && (
          <IconButton
            onClick={handleSend}
            size="small"
            sx={{
              width: "26px",
              height: "26px",
              backgroundColor: "rgba(255, 255, 255, 0.12)",
              color: "#FFFFFF",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.18)",
              },
            }}
          >
            <ArrowUpward sx={{ fontSize: "14px" }} />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};
