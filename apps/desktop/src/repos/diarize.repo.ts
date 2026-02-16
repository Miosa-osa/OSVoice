import type { MeetingSegment } from "@repo/types";
import {
  assemblyaiDiarize,
  type AssemblyAIUtterance,
} from "@repo/voice-ai/src/assemblyai.utils";
import { BaseRepo } from "./base.repo";

export type DiarizeInput = {
  audioBlob: ArrayBuffer;
  meetingId: string;
};

export type DiarizeOutput = {
  segments: Omit<MeetingSegment, "id" | "createdAt">[];
  fullText: string;
};

export abstract class BaseDiarizeRepo extends BaseRepo {
  abstract diarize(input: DiarizeInput): Promise<DiarizeOutput>;
}

function utteranceToSegment(
  u: AssemblyAIUtterance,
  meetingId: string,
): Omit<MeetingSegment, "id" | "createdAt"> {
  return {
    meetingId,
    speakerId: u.speaker,
    speakerName: u.speaker,
    text: u.text,
    startMs: u.start,
    endMs: u.end,
  };
}

export class AssemblyAIDiarizeRepo extends BaseDiarizeRepo {
  constructor(private readonly apiKey: string) {
    super();
  }

  async diarize(input: DiarizeInput): Promise<DiarizeOutput> {
    const result = await assemblyaiDiarize({
      apiKey: this.apiKey,
      audioBlob: input.audioBlob,
    });

    const segments = result.utterances.map((u) =>
      utteranceToSegment(u, input.meetingId),
    );

    return { segments, fullText: result.text };
  }
}
