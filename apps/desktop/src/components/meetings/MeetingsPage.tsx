import { MicNoneOutlined } from "@mui/icons-material";
import { Box, Button, List, Stack, Typography } from "@mui/material";
import { useCallback, useEffect } from "react";
import { FormattedMessage } from "react-intl";
import { useAppStore } from "../../store";
import {
  deleteMeeting,
  loadMeetings,
  selectMeeting,
  startMeetingRecording,
} from "../../actions/meeting.actions";
import { MeetingDetailPage } from "./MeetingDetailPage";
import { MeetingEmptyState } from "./MeetingEmptyState";
import { MeetingListItem } from "./MeetingListItem";
import { MeetingRecordingBar } from "./MeetingRecordingBar";

export default function MeetingsPage() {
  const meetingIds = useAppStore((s) => s.meeting.meetingIds);
  const activeMeetingId = useAppStore((s) => s.meeting.activeMeetingId);
  const isRecording = useAppStore((s) => s.meeting.isRecording);
  const activeMeeting = useAppStore((s) =>
    activeMeetingId ? s.meetingById[activeMeetingId] : undefined,
  );
  const meetings = useAppStore((s) => {
    return meetingIds.map((id) => s.meetingById[id]).filter(Boolean);
  });

  useEffect(() => {
    void loadMeetings();
  }, []);

  const handleSelect = useCallback((id: string) => {
    selectMeeting(id);
  }, []);

  const handleDelete = useCallback((id: string) => {
    void deleteMeeting(id);
  }, []);

  const handleStartRecording = useCallback(() => {
    void startMeetingRecording();
  }, []);

  if (activeMeeting && !isRecording) {
    return <MeetingDetailPage meeting={activeMeeting} />;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <MeetingRecordingBar />

      <Box sx={{ px: 3, pt: 2, pb: 1 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="titleMedium">
            <FormattedMessage defaultMessage="Meetings" />
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<MicNoneOutlined />}
            onClick={handleStartRecording}
            disabled={isRecording}
          >
            <FormattedMessage defaultMessage="Record" />
          </Button>
        </Stack>
      </Box>

      {meetings.length === 0 && !isRecording ? (
        <MeetingEmptyState />
      ) : (
        <Box sx={{ flex: 1, overflow: "auto", px: 2 }}>
          <List disablePadding>
            {meetings.map((m) =>
              m ? (
                <MeetingListItem
                  key={m.id}
                  meeting={m}
                  selected={m.id === activeMeetingId}
                  onSelect={handleSelect}
                  onDelete={handleDelete}
                />
              ) : null,
            )}
          </List>
        </Box>
      )}
    </Box>
  );
}
