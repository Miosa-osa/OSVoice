import { Nullable } from "@repo/types";

export type MeetingState = {
  meetingIds: string[];
  activeMeetingId: Nullable<string>;
  segmentIds: string[];
  isRecording: boolean;
  isProcessing: boolean;
  recordingElapsedMs: number;
};

export const INITIAL_MEETING_STATE: MeetingState = {
  meetingIds: [],
  activeMeetingId: null,
  segmentIds: [],
  isRecording: false,
  isProcessing: false,
  recordingElapsedMs: 0,
};
