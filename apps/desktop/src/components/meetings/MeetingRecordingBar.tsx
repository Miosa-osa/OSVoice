import { FiberManualRecord, Stop } from "@mui/icons-material";
import { Box, Button, Stack, Typography } from "@mui/material";
import { memo } from "react";
import { FormattedMessage } from "react-intl";
import { useAppStore } from "../../store";
import { stopMeetingRecording } from "../../actions/meeting.actions";

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export const MeetingRecordingBar = memo(function MeetingRecordingBar() {
  const isRecording = useAppStore((s) => s.meeting.isRecording);
  const elapsed = useAppStore((s) => s.meeting.recordingElapsedMs);

  if (!isRecording) return null;

  return (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: "error.main",
        color: "error.contrastText",
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={1.5} alignItems="center">
          <FiberManualRecord
            sx={{
              fontSize: 14,
              animation: "pulse 1.5s infinite",
              "@keyframes pulse": {
                "0%": { opacity: 1 },
                "50%": { opacity: 0.3 },
                "100%": { opacity: 1 },
              },
            }}
          />
          <Typography variant="body2" fontWeight={600}>
            <FormattedMessage defaultMessage="Recording meeting" />
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontVariantNumeric: "tabular-nums" }}
          >
            {formatElapsed(elapsed)}
          </Typography>
        </Stack>
        <Button
          size="small"
          variant="contained"
          color="inherit"
          startIcon={<Stop />}
          onClick={() => void stopMeetingRecording()}
          sx={{ color: "error.main", bgcolor: "error.contrastText" }}
        >
          <FormattedMessage defaultMessage="Stop" />
        </Button>
      </Stack>
    </Box>
  );
});
