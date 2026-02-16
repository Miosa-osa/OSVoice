import type { Meeting, MeetingSegment } from "@repo/types";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import dayjs from "dayjs";
import { createId } from "../utils/id.utils";
import {
  getDiarizeRepo,
  getGenerateTextRepo,
  getMeetingRepo,
  getTranscribeAudioRepo,
} from "../repos";
import {
  buildMeetingSummaryPrompt,
  parseMeetingSummaryResponse,
} from "../utils/meeting-prompt.utils";
import { getAppState, produceAppState } from "../store";
import { showErrorSnackbar } from "./app.actions";
import { buildWaveFile } from "../utils/audio.utils";
import { getMyPreferredMicrophone } from "../utils/user.utils";

let audioChunkUnlisten: UnlistenFn | null = null;
let chunkBuffer: number[] = [];
let elapsedTimerHandle: ReturnType<typeof setInterval> | null = null;
let isFlushing = false;

const CHUNK_FLUSH_SIZE = 160_000;

const cleanupRecordingResources = (): void => {
  if (elapsedTimerHandle) {
    clearInterval(elapsedTimerHandle);
    elapsedTimerHandle = null;
  }
  if (audioChunkUnlisten) {
    audioChunkUnlisten();
    audioChunkUnlisten = null;
  }
  chunkBuffer = [];
  isFlushing = false;
};

const flushChunkBuffer = async (): Promise<void> => {
  if (isFlushing || chunkBuffer.length === 0) return;
  isFlushing = true;
  const batch = chunkBuffer;
  chunkBuffer = [];
  try {
    await getMeetingRepo().appendAudioChunk(batch);
  } catch (error) {
    console.error("[meeting] Failed to append audio chunk:", error);
  } finally {
    isFlushing = false;
  }
};

export const loadMeetings = async (): Promise<void> => {
  try {
    const meetings = await getMeetingRepo().listMeetings({ limit: 100 });
    produceAppState((draft) => {
      draft.meeting.meetingIds = meetings.map((m) => m.id);
      for (const m of meetings) {
        draft.meetingById[m.id] = m;
      }
    });
  } catch (error) {
    showErrorSnackbar(error);
  }
};

export const startMeetingRecording = async (): Promise<string | null> => {
  const state = getAppState();
  if (state.meeting.isRecording) return null;
  if (state.activeRecordingMode) return null;

  const now = dayjs().toISOString();
  const meeting: Meeting = {
    id: createId(),
    title: "",
    startedAt: now,
    status: "recording",
    createdAt: now,
    updatedAt: now,
  };

  produceAppState((draft) => {
    draft.meetingById[meeting.id] = meeting;
    draft.meeting.meetingIds = [meeting.id, ...draft.meeting.meetingIds];
    draft.meeting.activeMeetingId = meeting.id;
    draft.meeting.isRecording = true;
    draft.meeting.recordingElapsedMs = 0;
    draft.activeRecordingMode = "dictate";
  });

  try {
    await getMeetingRepo().createMeeting(meeting);

    const preferredMic = getMyPreferredMicrophone(getAppState());
    const { sampleRate } = await invoke<{ sampleRate: number }>(
      "start_recording",
      { args: { preferredMicrophone: preferredMic } },
    );

    await getMeetingRepo().startAudioWriter(meeting.id, sampleRate);

    chunkBuffer = [];
    audioChunkUnlisten = await listen<{ samples: number[] }>(
      "audio_chunk",
      (event) => {
        chunkBuffer.push(...event.payload.samples);
        if (chunkBuffer.length >= CHUNK_FLUSH_SIZE) {
          void flushChunkBuffer();
        }
      },
    );

    const startTime = Date.now();
    elapsedTimerHandle = setInterval(() => {
      produceAppState((draft) => {
        draft.meeting.recordingElapsedMs = Date.now() - startTime;
      });
    }, 1000);

    return meeting.id;
  } catch (error) {
    cleanupRecordingResources();
    try {
      await invoke("stop_recording");
    } catch {
      // recording may not have started yet
    }
    produceAppState((draft) => {
      delete draft.meetingById[meeting.id];
      draft.meeting.meetingIds = draft.meeting.meetingIds.filter(
        (id) => id !== meeting.id,
      );
      draft.meeting.activeMeetingId = null;
      draft.meeting.isRecording = false;
      draft.meeting.recordingElapsedMs = 0;
      draft.activeRecordingMode = null;
    });
    showErrorSnackbar(error);
    return null;
  }
};

export const stopMeetingRecording = async (): Promise<void> => {
  const state = getAppState();
  const meetingId = state.meeting.activeMeetingId;
  if (!meetingId || !state.meeting.isRecording) return;

  cleanupRecordingResources();

  produceAppState((draft) => {
    draft.meeting.isRecording = false;
    draft.meeting.isProcessing = true;
  });

  try {
    await invoke("stop_recording");

    await flushChunkBuffer();

    const result = await getMeetingRepo().finalizeAudioWriter();

    const now = dayjs().toISOString();
    const existingMeeting = getAppState().meetingById[meetingId];
    if (!existingMeeting) return;

    const updated: Meeting = {
      ...existingMeeting,
      endedAt: now,
      durationMs: result.durationMs,
      audioPath: result.filePath,
      status: "processing",
      updatedAt: now,
    };

    produceAppState((draft) => {
      draft.meetingById[meetingId] = updated;
      draft.activeRecordingMode = null;
    });

    await getMeetingRepo().updateMeeting(updated);
  } catch (error) {
    produceAppState((draft) => {
      draft.meeting.isProcessing = false;
      draft.activeRecordingMode = null;
    });
    showErrorSnackbar(error);
  }
};

export const deleteMeeting = async (meetingId: string): Promise<void> => {
  const state = getAppState();
  const meeting = state.meetingById[meetingId];
  if (!meeting) return;

  const removedSegments: Record<string, MeetingSegment> = {};
  const removedSegmentIds: string[] = [];
  for (const segId of state.meeting.segmentIds) {
    const seg = state.meetingSegmentById[segId];
    if (seg?.meetingId === meetingId) {
      removedSegments[segId] = seg;
      removedSegmentIds.push(segId);
    }
  }

  produceAppState((draft) => {
    delete draft.meetingById[meetingId];
    draft.meeting.meetingIds = draft.meeting.meetingIds.filter(
      (id) => id !== meetingId,
    );
    if (draft.meeting.activeMeetingId === meetingId) {
      draft.meeting.activeMeetingId = null;
    }
    for (const segId of removedSegmentIds) {
      delete draft.meetingSegmentById[segId];
    }
    draft.meeting.segmentIds = draft.meeting.segmentIds.filter(
      (id) => !removedSegmentIds.includes(id),
    );
  });

  try {
    await getMeetingRepo().deleteMeeting(meetingId);
  } catch (error) {
    produceAppState((draft) => {
      draft.meetingById[meetingId] = meeting;
      if (!draft.meeting.meetingIds.includes(meetingId)) {
        draft.meeting.meetingIds.unshift(meetingId);
      }
      for (const [segId, seg] of Object.entries(removedSegments)) {
        draft.meetingSegmentById[segId] = seg;
      }
      draft.meeting.segmentIds = [
        ...draft.meeting.segmentIds,
        ...removedSegmentIds,
      ];
    });
    showErrorSnackbar(error);
  }
};

export const updateMeetingTitle = async (
  meetingId: string,
  title: string,
): Promise<void> => {
  const meeting = getAppState().meetingById[meetingId];
  if (!meeting) return;

  const updated: Meeting = {
    ...meeting,
    title,
    updatedAt: dayjs().toISOString(),
  };

  produceAppState((draft) => {
    draft.meetingById[meetingId] = updated;
  });

  try {
    await getMeetingRepo().updateMeeting(updated);
  } catch (error) {
    produceAppState((draft) => {
      draft.meetingById[meetingId] = meeting;
    });
    showErrorSnackbar(error);
  }
};

export const loadMeetingSegments = async (meetingId: string): Promise<void> => {
  try {
    const segments = await getMeetingRepo().listSegments(meetingId);
    produceAppState((draft) => {
      const newSegmentIds: string[] = [];
      for (const seg of segments) {
        draft.meetingSegmentById[seg.id] = seg;
        newSegmentIds.push(seg.id);
      }
      draft.meeting.segmentIds = newSegmentIds;
    });
  } catch (error) {
    showErrorSnackbar(error);
  }
};

export const selectMeeting = (meetingId: string | null): void => {
  produceAppState((draft) => {
    draft.meeting.activeMeetingId = meetingId;
    draft.meeting.segmentIds = [];
  });
};

export const renameSpeaker = async (
  meetingId: string,
  speakerId: string,
  newName: string,
): Promise<void> => {
  try {
    await getMeetingRepo().renameSpeaker(meetingId, speakerId, newName);

    produceAppState((draft) => {
      for (const segId of draft.meeting.segmentIds) {
        const seg = draft.meetingSegmentById[segId];
        if (seg && seg.meetingId === meetingId && seg.speakerId === speakerId) {
          seg.speakerName = newName;
        }
      }
    });
  } catch (error) {
    showErrorSnackbar(error);
  }
};

export const setMeetingProcessingDone = (meetingId: string): void => {
  produceAppState((draft) => {
    draft.meeting.isProcessing = false;
    const m = draft.meetingById[meetingId];
    if (m) {
      m.status = "completed";
    }
  });
};

export const processMeetingRecording = async (
  meetingId: string,
): Promise<void> => {
  const meeting = getAppState().meetingById[meetingId];
  if (!meeting) return;

  produceAppState((draft) => {
    draft.meeting.isProcessing = true;
  });

  try {
    const { samples, sampleRate } =
      await getMeetingRepo().loadMeetingAudio(meetingId);

    const diarizeRepo = getDiarizeRepo();
    const now = dayjs().toISOString();

    let segments: MeetingSegment[];

    if (diarizeRepo) {
      const wavBlob = buildWaveFile(Float32Array.from(samples), sampleRate);
      const result = await diarizeRepo.diarize({
        audioBlob: wavBlob,
        meetingId,
      });

      segments = result.segments.map((seg) => ({
        ...seg,
        id: createId(),
        createdAt: now,
      }));
    } else {
      const { repo } = getTranscribeAudioRepo();
      if (!repo) {
        throw new Error("No transcription provider configured");
      }

      const transcribeResult = await repo.transcribeAudio({
        samples,
        sampleRate,
      });

      segments = [
        {
          id: createId(),
          meetingId,
          text: transcribeResult.text,
          startMs: 0,
          endMs: meeting.durationMs ?? 0,
          createdAt: now,
        },
      ];
    }

    if (segments.length > 0) {
      await getMeetingRepo().createSegmentsBatch(segments);
    }

    const updatedMeeting: Meeting = {
      ...meeting,
      status: "completed",
      updatedAt: now,
    };

    await getMeetingRepo().updateMeeting(updatedMeeting);

    produceAppState((draft) => {
      draft.meetingById[meetingId] = updatedMeeting;
      draft.meeting.isProcessing = false;
      const newSegmentIds: string[] = [];
      for (const seg of segments) {
        draft.meetingSegmentById[seg.id] = seg;
        newSegmentIds.push(seg.id);
      }
      draft.meeting.segmentIds = newSegmentIds;
    });
  } catch (error) {
    const failedMeeting: Meeting = {
      ...meeting,
      status: "failed",
      updatedAt: dayjs().toISOString(),
    };

    produceAppState((draft) => {
      draft.meetingById[meetingId] = failedMeeting;
      draft.meeting.isProcessing = false;
    });

    try {
      await getMeetingRepo().updateMeeting(failedMeeting);
    } catch {
      // ignore secondary update failure
    }

    showErrorSnackbar(error);
  }
};

export const generateMeetingSummary = async (
  meetingId: string,
): Promise<void> => {
  const state = getAppState();
  const meeting = state.meetingById[meetingId];
  if (!meeting) return;

  const segmentIds = state.meeting.segmentIds;
  const segments = segmentIds
    .map((id: string) => state.meetingSegmentById[id])
    .filter((s): s is MeetingSegment => s != null && s.meetingId === meetingId);

  if (segments.length === 0) return;

  const { repo } = getGenerateTextRepo();
  if (!repo) {
    showErrorSnackbar("No LLM provider configured for summary generation");
    return;
  }

  try {
    const prompt = buildMeetingSummaryPrompt(segments);
    const result = await repo.generateText({
      system: "You are a meeting summary assistant. Return only valid JSON.",
      prompt,
    });

    const parsed = parseMeetingSummaryResponse(result.text);
    const now = dayjs().toISOString();
    const updated: Meeting = {
      ...meeting,
      summary: parsed.summary,
      actionItems: JSON.stringify(parsed.actionItems),
      updatedAt: now,
    };

    produceAppState((draft) => {
      draft.meetingById[meetingId] = updated;
    });

    await getMeetingRepo().updateMeeting(updated);
  } catch (error) {
    showErrorSnackbar(error);
  }
};
