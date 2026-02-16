import { invoke } from "@tauri-apps/api/core";
import { useCallback, useRef, useState } from "react";
import { showErrorSnackbar } from "../actions/app.actions";
import { createTranscriptionSession } from "../sessions";
import { getAppState } from "../store";
import type {
  StopRecordingResponse,
  TranscriptionSession,
} from "../types/transcription-session.types";
import {
  getMyPreferredMicrophone,
  getTranscriptionPrefs,
} from "../utils/user.utils";

export type VoiceRecordingState = "idle" | "recording" | "transcribing";

type UseVoiceRecordingOptions = {
  onTranscript: (text: string) => void;
  onError?: (error: unknown) => void;
};

type UseVoiceRecordingReturn = {
  recordingState: VoiceRecordingState;
  toggle: () => void;
};

export const useVoiceRecording = ({
  onTranscript,
  onError,
}: UseVoiceRecordingOptions): UseVoiceRecordingReturn => {
  const [recordingState, setRecordingState] =
    useState<VoiceRecordingState>("idle");
  const sessionRef = useRef<TranscriptionSession | null>(null);

  const handleError = useCallback(
    (error: unknown) => {
      if (onError) {
        onError(error);
      } else {
        showErrorSnackbar(error);
      }
    },
    [onError],
  );

  const start = useCallback(async () => {
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
      handleError(error);
      sessionRef.current?.cleanup();
      sessionRef.current = null;
      setRecordingState("idle");
    }
  }, [handleError]);

  const stop = useCallback(async () => {
    setRecordingState("transcribing");
    try {
      const audio = await invoke<StopRecordingResponse>("stop_recording");
      const session = sessionRef.current;

      if (session) {
        const result = await session.finalize(audio);
        session.cleanup();
        sessionRef.current = null;

        if (result.rawTranscript) {
          onTranscript(result.rawTranscript.trim());
        }
      }
    } catch (error) {
      handleError(error);
      sessionRef.current?.cleanup();
      sessionRef.current = null;
    }
    setRecordingState("idle");
  }, [onTranscript, handleError]);

  const toggle = useCallback(() => {
    if (recordingState === "recording") {
      void stop();
    } else if (recordingState === "idle") {
      void start();
    }
  }, [recordingState, start, stop]);

  return { recordingState, toggle };
};
