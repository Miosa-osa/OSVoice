import { MicRounded, SendRounded, StopRounded } from "@mui/icons-material";
import { Box, CircularProgress, IconButton, TextField } from "@mui/material";
import { invoke } from "@tauri-apps/api/core";
import { useCallback, useRef, useState } from "react";
import { useIntl } from "react-intl";
import { showErrorSnackbar } from "../../actions/app.actions";
import { createTranscriptionSession } from "../../sessions";
import { getAppState } from "../../store";
import type {
  StopRecordingResponse,
  TranscriptionSession,
} from "../../types/transcription-session.types";
import {
  getMyPreferredMicrophone,
  getTranscriptionPrefs,
} from "../../utils/user.utils";

type ChatInputProps = {
  onSend: (content: string) => void;
  disabled?: boolean;
};

type RecordingState = "idle" | "recording" | "transcribing";

export const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
  const intl = useIntl();
  const [value, setValue] = useState("");
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionRef = useRef<TranscriptionSession | null>(null);

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

  const handleStartRecording = useCallback(async () => {
    try {
      const state = getAppState();
      const prefs = getTranscriptionPrefs(state);
      const preferredMic = getMyPreferredMicrophone(state);

      sessionRef.current = createTranscriptionSession(prefs);

      const startResp = await invoke<{ sampleRate: number }>(
        "start_recording",
        { args: { preferredMicrophone: preferredMic } },
      );

      await sessionRef.current.onRecordingStart(startResp.sampleRate);
      setRecordingState("recording");
    } catch (error) {
      showErrorSnackbar(error);
      sessionRef.current?.cleanup();
      sessionRef.current = null;
      setRecordingState("idle");
    }
  }, []);

  const handleStopRecording = useCallback(async () => {
    setRecordingState("transcribing");
    try {
      const audio = await invoke<StopRecordingResponse>("stop_recording");
      const session = sessionRef.current;

      if (session) {
        const result = await session.finalize(audio);
        session.cleanup();
        sessionRef.current = null;

        if (result.rawTranscript) {
          const current = value.trim();
          const transcript = result.rawTranscript.trim();
          const combined = current ? `${current} ${transcript}` : transcript;
          setValue(combined.slice(0, 10000));
          inputRef.current?.focus();
        }
      }
    } catch (error) {
      showErrorSnackbar(error);
      sessionRef.current?.cleanup();
      sessionRef.current = null;
    }
    setRecordingState("idle");
  }, [value]);

  const handleMicClick = useCallback(() => {
    if (recordingState === "recording") {
      void handleStopRecording();
    } else if (recordingState === "idle") {
      void handleStartRecording();
    }
  }, [recordingState, handleStartRecording, handleStopRecording]);

  const isRecording = recordingState === "recording";
  const isTranscribing = recordingState === "transcribing";

  return (
    <Box
      sx={(theme) => ({
        px: 3,
        py: 2,
        borderTop: `1px solid ${theme.vars?.palette.level2}`,
        backgroundColor: theme.vars?.palette.level0,
      })}
    >
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
          onClick={handleMicClick}
          disabled={disabled || isTranscribing}
          size="small"
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
        <IconButton
          onClick={handleSend}
          disabled={!value.trim() || disabled || isRecording}
          size="small"
          sx={(theme) => ({
            color: value.trim()
              ? theme.vars?.palette.blue
              : theme.vars?.palette.text.secondary,
          })}
        >
          <SendRounded />
        </IconButton>
      </Box>
    </Box>
  );
};
