export type MeetingStatus = "recording" | "processing" | "completed" | "failed";

export type Meeting = {
  id: string;
  title: string;
  appSource?: string | null;
  startedAt: string;
  endedAt?: string | null;
  durationMs?: number | null;
  status: MeetingStatus;
  audioPath?: string | null;
  summary?: string | null;
  actionItems?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MeetingSegment = {
  id: string;
  meetingId: string;
  speakerId?: string | null;
  speakerName?: string | null;
  text: string;
  startMs: number;
  endMs: number;
  createdAt: string;
};
