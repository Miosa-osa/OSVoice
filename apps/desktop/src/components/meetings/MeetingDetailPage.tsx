import {
  ArrowBack,
  AutoAwesomeOutlined,
  EditOutlined,
} from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { memo, useCallback, useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { useAppStore } from "../../store";
import {
  generateMeetingSummary,
  loadMeetingSegments,
  processMeetingRecording,
  selectMeeting,
  updateMeetingTitle,
} from "../../actions/meeting.actions";
import { MeetingTranscriptTimeline } from "./MeetingTranscriptTimeline";
import { MeetingSummaryCard } from "./MeetingSummaryCard";
import { MeetingActionItems } from "./MeetingActionItems";
import type { Meeting } from "@repo/types";

type Props = {
  meeting: Meeting;
};

export const MeetingDetailPage = memo(function MeetingDetailPage({
  meeting,
}: Props) {
  const isProcessing = useAppStore((s) => s.meeting.isProcessing);
  const segmentIds = useAppStore((s) => s.meeting.segmentIds);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(meeting.title);

  useEffect(() => {
    void loadMeetingSegments(meeting.id);
  }, [meeting.id]);

  const handleBack = useCallback(() => {
    selectMeeting(null);
  }, []);

  const handleProcess = useCallback(() => {
    void processMeetingRecording(meeting.id);
  }, [meeting.id]);

  const handleGenerateSummary = useCallback(() => {
    void generateMeetingSummary(meeting.id);
  }, [meeting.id]);

  const handleTitleSave = useCallback(() => {
    if (titleDraft.trim() !== meeting.title) {
      void updateMeetingTitle(meeting.id, titleDraft.trim());
    }
    setEditingTitle(false);
  }, [meeting.id, meeting.title, titleDraft]);

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleTitleSave();
      if (e.key === "Escape") {
        setTitleDraft(meeting.title);
        setEditingTitle(false);
      }
    },
    [handleTitleSave, meeting.title],
  );

  const displayTitle =
    meeting.title ||
    new Date(meeting.startedAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ px: 3, pt: 2, pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton size="small" onClick={handleBack} aria-label="Back">
            <ArrowBack fontSize="small" />
          </IconButton>

          {editingTitle ? (
            <TextField
              autoFocus
              size="small"
              variant="standard"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              sx={{ flex: 1 }}
            />
          ) : (
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{ flex: 1, minWidth: 0 }}
            >
              <Typography variant="titleMedium" noWrap>
                {displayTitle}
              </Typography>
              <IconButton
                size="small"
                onClick={() => {
                  setTitleDraft(meeting.title);
                  setEditingTitle(true);
                }}
                aria-label="Edit title"
              >
                <EditOutlined sx={{ fontSize: 16 }} />
              </IconButton>
            </Stack>
          )}
        </Stack>
      </Box>

      {isProcessing && (
        <Box sx={{ px: 3, py: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              <FormattedMessage defaultMessage="Processing recording..." />
            </Typography>
          </Stack>
        </Box>
      )}

      <Box sx={{ flex: 1, overflow: "auto", px: 3, pb: 3 }}>
        <Stack spacing={3}>
          {meeting.status === "processing" && !isProcessing && (
            <Button
              variant="outlined"
              size="small"
              onClick={handleProcess}
              sx={{ alignSelf: "flex-start" }}
            >
              <FormattedMessage defaultMessage="Retry Processing" />
            </Button>
          )}

          {meeting.status === "failed" && (
            <Button
              variant="outlined"
              size="small"
              onClick={handleProcess}
              sx={{ alignSelf: "flex-start" }}
            >
              <FormattedMessage defaultMessage="Retry Processing" />
            </Button>
          )}

          {meeting.summary && <MeetingSummaryCard summary={meeting.summary} />}

          {meeting.actionItems && (
            <MeetingActionItems actionItemsJson={meeting.actionItems} />
          )}

          {segmentIds.length > 0 &&
            !meeting.summary &&
            meeting.status === "completed" && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<AutoAwesomeOutlined />}
                onClick={handleGenerateSummary}
                sx={{ alignSelf: "flex-start" }}
              >
                <FormattedMessage defaultMessage="Generate Summary" />
              </Button>
            )}

          {segmentIds.length > 0 && (
            <MeetingTranscriptTimeline meetingId={meeting.id} />
          )}

          {segmentIds.length === 0 &&
            !isProcessing &&
            meeting.status === "completed" && (
              <Typography variant="body2" color="text.secondary">
                <FormattedMessage defaultMessage="No transcript available for this meeting." />
              </Typography>
            )}
        </Stack>
      </Box>
    </Box>
  );
});
