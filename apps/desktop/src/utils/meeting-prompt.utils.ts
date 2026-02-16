import type { MeetingSegment } from "@repo/types";

function formatTimestamp(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function formatTranscriptFromSegments(segments: MeetingSegment[]): string {
  return segments
    .map((seg) => {
      const time = formatTimestamp(seg.startMs);
      const speaker = seg.speakerName ?? seg.speakerId ?? "Speaker";
      return `[${time}] ${speaker}: ${seg.text}`;
    })
    .join("\n");
}

export function buildMeetingSummaryPrompt(segments: MeetingSegment[]): string {
  const transcript = formatTranscriptFromSegments(segments);

  return `You are a meeting assistant. Analyze the following meeting transcript and produce a JSON response with this exact structure:

{
  "summary": "A concise 2-4 paragraph summary of the meeting covering the main discussion points.",
  "keyTopics": ["topic1", "topic2", "topic3"],
  "decisions": ["decision1", "decision2"],
  "actionItems": [
    {"task": "description of task", "assignee": "person name or null", "priority": "high|medium|low"}
  ]
}

Rules:
- Write the summary in clear, professional language
- Extract only action items that were explicitly discussed or agreed upon
- If no speaker names are available, use the speaker IDs
- If no clear decisions or action items exist, return empty arrays
- Return ONLY valid JSON, no markdown formatting

Meeting Transcript:
${transcript}`;
}

export type MeetingSummaryResult = {
  summary: string;
  keyTopics: string[];
  decisions: string[];
  actionItems: { task: string; assignee: string | null; priority: string }[];
};

export function parseMeetingSummaryResponse(
  text: string,
): MeetingSummaryResult {
  const cleaned = text
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as MeetingSummaryResult;
    return {
      summary: parsed.summary ?? "",
      keyTopics: Array.isArray(parsed.keyTopics) ? parsed.keyTopics : [],
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
    };
  } catch {
    return {
      summary: text,
      keyTopics: [],
      decisions: [],
      actionItems: [],
    };
  }
}
