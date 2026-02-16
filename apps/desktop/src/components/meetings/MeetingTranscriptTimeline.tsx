import { Box, Stack, Typography } from "@mui/material";
import { memo, useMemo } from "react";
import { useAppStore } from "../../store";
import { SpeakerRenameDialog } from "./SpeakerRenameDialog";
import { useState, useCallback } from "react";

const SPEAKER_COLORS = [
  "#4fc3f7",
  "#81c784",
  "#ffb74d",
  "#ce93d8",
  "#ef5350",
  "#26a69a",
  "#ffa726",
  "#ab47bc",
];

function formatTimestamp(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

type Props = {
  meetingId: string;
};

export const MeetingTranscriptTimeline = memo(
  function MeetingTranscriptTimeline({ meetingId }: Props) {
    const segmentIds = useAppStore((s) => s.meeting.segmentIds);
    const segmentById = useAppStore((s) => s.meetingSegmentById);
    const [renameTarget, setRenameTarget] = useState<{
      speakerId: string;
      currentName: string;
    } | null>(null);

    const segments = useMemo(
      () =>
        segmentIds
          .map((id) => segmentById[id])
          .filter((s) => s != null && s.meetingId === meetingId),
      [segmentIds, segmentById, meetingId],
    );

    const speakerColorMap = useMemo(() => {
      const map = new Map<string, string>();
      let colorIdx = 0;
      for (const seg of segments) {
        const key = seg.speakerId ?? seg.speakerName ?? "unknown";
        if (!map.has(key)) {
          map.set(key, SPEAKER_COLORS[colorIdx % SPEAKER_COLORS.length]);
          colorIdx++;
        }
      }
      return map;
    }, [segments]);

    const handleSpeakerClick = useCallback(
      (speakerId: string | null | undefined, speakerName: string) => {
        if (!speakerId) return;
        setRenameTarget({ speakerId, currentName: speakerName });
      },
      [],
    );

    if (segments.length === 0) return null;

    return (
      <Box>
        <Typography variant="titleSmall" sx={{ mb: 2 }}>
          Transcript
        </Typography>
        <Stack spacing={1.5}>
          {segments.map((seg) => {
            const speakerKey = seg.speakerId ?? seg.speakerName ?? "unknown";
            const color = speakerColorMap.get(speakerKey) ?? SPEAKER_COLORS[0];
            const displayName = seg.speakerName ?? seg.speakerId ?? "Speaker";

            return (
              <Stack key={seg.id} direction="row" spacing={1.5}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontVariantNumeric: "tabular-nums",
                    minWidth: 48,
                    pt: 0.25,
                    flexShrink: 0,
                  }}
                >
                  {formatTimestamp(seg.startMs)}
                </Typography>
                <Box
                  sx={{
                    width: 3,
                    borderRadius: 1,
                    bgcolor: color,
                    flexShrink: 0,
                  }}
                />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color,
                      fontWeight: 600,
                      cursor: seg.speakerId ? "pointer" : "default",
                      "&:hover": seg.speakerId
                        ? { textDecoration: "underline" }
                        : {},
                    }}
                    onClick={() =>
                      handleSpeakerClick(seg.speakerId, displayName)
                    }
                  >
                    {displayName}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.25 }}>
                    {seg.text}
                  </Typography>
                </Box>
              </Stack>
            );
          })}
        </Stack>

        {renameTarget && (
          <SpeakerRenameDialog
            meetingId={meetingId}
            speakerId={renameTarget.speakerId}
            currentName={renameTarget.currentName}
            onClose={() => setRenameTarget(null)}
          />
        )}
      </Box>
    );
  },
);
