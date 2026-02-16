import type { Meeting, MeetingSegment } from "@repo/types";
import { invoke } from "@tauri-apps/api/core";
import { BaseRepo } from "./base.repo";

type LocalMeeting = {
  id: string;
  title: string;
  appSource?: string | null;
  startedAt: string;
  endedAt?: string | null;
  durationMs?: number | null;
  status: string;
  audioPath?: string | null;
  summary?: string | null;
  actionItems?: string | null;
  createdAt: string;
  updatedAt: string;
};

type LocalMeetingSegment = {
  id: string;
  meetingId: string;
  speakerId?: string | null;
  speakerName?: string | null;
  text: string;
  startMs: number;
  endMs: number;
  createdAt: string;
};

type MeetingAudioResult = {
  filePath: string;
  durationMs: number;
};

const VALID_STATUSES: Meeting["status"][] = [
  "recording",
  "processing",
  "completed",
  "failed",
];

const toLocalMeeting = (m: Meeting): LocalMeeting => ({
  id: m.id,
  title: m.title,
  appSource: m.appSource ?? null,
  startedAt: m.startedAt,
  endedAt: m.endedAt ?? null,
  durationMs: m.durationMs ?? null,
  status: m.status,
  audioPath: m.audioPath ?? null,
  summary: m.summary ?? null,
  actionItems: m.actionItems ?? null,
  createdAt: m.createdAt,
  updatedAt: m.updatedAt,
});

const fromLocalMeeting = (m: LocalMeeting): Meeting => ({
  id: m.id,
  title: m.title,
  appSource: m.appSource ?? undefined,
  startedAt: m.startedAt,
  endedAt: m.endedAt ?? undefined,
  durationMs: m.durationMs ?? undefined,
  status: VALID_STATUSES.includes(m.status as Meeting["status"])
    ? (m.status as Meeting["status"])
    : "failed",
  audioPath: m.audioPath ?? undefined,
  summary: m.summary ?? undefined,
  actionItems: m.actionItems ?? undefined,
  createdAt: m.createdAt,
  updatedAt: m.updatedAt,
});

const toLocalSegment = (s: MeetingSegment): LocalMeetingSegment => ({
  id: s.id,
  meetingId: s.meetingId,
  speakerId: s.speakerId ?? null,
  speakerName: s.speakerName ?? null,
  text: s.text,
  startMs: s.startMs,
  endMs: s.endMs,
  createdAt: s.createdAt,
});

const fromLocalSegment = (s: LocalMeetingSegment): MeetingSegment => ({
  id: s.id,
  meetingId: s.meetingId,
  speakerId: s.speakerId ?? undefined,
  speakerName: s.speakerName ?? undefined,
  text: s.text,
  startMs: s.startMs,
  endMs: s.endMs,
  createdAt: s.createdAt,
});

export type ListMeetingsParams = {
  limit?: number;
  offset?: number;
};

export abstract class BaseMeetingRepo extends BaseRepo {
  abstract createMeeting(m: Meeting): Promise<Meeting>;
  abstract listMeetings(params?: ListMeetingsParams): Promise<Meeting[]>;
  abstract updateMeeting(m: Meeting): Promise<Meeting>;
  abstract deleteMeeting(id: string): Promise<void>;
  abstract listSegments(meetingId: string): Promise<MeetingSegment[]>;
  abstract createSegmentsBatch(
    segments: MeetingSegment[],
  ): Promise<MeetingSegment[]>;
  abstract renameSpeaker(
    meetingId: string,
    speakerId: string,
    newName: string,
  ): Promise<void>;
  abstract startAudioWriter(
    meetingId: string,
    sampleRate: number,
  ): Promise<void>;
  abstract appendAudioChunk(samples: Float32Array | number[]): Promise<void>;
  abstract finalizeAudioWriter(): Promise<MeetingAudioResult>;
  abstract loadMeetingAudio(
    meetingId: string,
  ): Promise<{ samples: number[]; sampleRate: number }>;
}

export class LocalMeetingRepo extends BaseMeetingRepo {
  async createMeeting(m: Meeting): Promise<Meeting> {
    const stored = await invoke<LocalMeeting>("meeting_create", {
      meeting: toLocalMeeting(m),
    });
    return fromLocalMeeting(stored);
  }

  async listMeetings(params: ListMeetingsParams = {}): Promise<Meeting[]> {
    const limit = Math.max(0, Math.trunc(params.limit ?? 50));
    const offset = Math.max(0, Math.trunc(params.offset ?? 0));
    const meetings = await invoke<LocalMeeting[]>("meeting_list", {
      limit,
      offset,
    });
    return meetings.map(fromLocalMeeting);
  }

  async updateMeeting(m: Meeting): Promise<Meeting> {
    const stored = await invoke<LocalMeeting>("meeting_update", {
      meeting: toLocalMeeting(m),
    });
    return fromLocalMeeting(stored);
  }

  async deleteMeeting(id: string): Promise<void> {
    await invoke<void>("meeting_delete", { id });
  }

  async listSegments(meetingId: string): Promise<MeetingSegment[]> {
    const segments = await invoke<LocalMeetingSegment[]>(
      "meeting_segment_list",
      { meetingId },
    );
    return segments.map(fromLocalSegment);
  }

  async createSegmentsBatch(
    segments: MeetingSegment[],
  ): Promise<MeetingSegment[]> {
    const stored = await invoke<LocalMeetingSegment[]>(
      "meeting_segments_create_batch",
      { segments: segments.map(toLocalSegment) },
    );
    return stored.map(fromLocalSegment);
  }

  async renameSpeaker(
    meetingId: string,
    speakerId: string,
    newName: string,
  ): Promise<void> {
    await invoke<void>("meeting_segment_rename_speaker", {
      meetingId,
      speakerId,
      newName,
    });
  }

  async startAudioWriter(meetingId: string, sampleRate: number): Promise<void> {
    await invoke<void>("meeting_start_audio_writer", {
      meetingId,
      sampleRate,
    });
  }

  async appendAudioChunk(samples: Float32Array | number[]): Promise<void> {
    const arr = samples instanceof Float32Array ? Array.from(samples) : samples;
    await invoke<void>("meeting_append_audio_chunk", { samples: arr });
  }

  async finalizeAudioWriter(): Promise<MeetingAudioResult> {
    return invoke<MeetingAudioResult>("meeting_finalize_audio_writer");
  }

  async loadMeetingAudio(
    meetingId: string,
  ): Promise<{ samples: number[]; sampleRate: number }> {
    return invoke<{ samples: number[]; sampleRate: number }>(
      "meeting_audio_load",
      { meetingId },
    );
  }
}
