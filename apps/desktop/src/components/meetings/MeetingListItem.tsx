import { DeleteOutline } from "@mui/icons-material";
import {
  Box,
  Chip,
  IconButton,
  ListItemButton,
  Stack,
  Typography,
} from "@mui/material";
import { memo, useCallback } from "react";
import { FormattedMessage } from "react-intl";
import { Meeting } from "@repo/types";

const STATUS_LABELS: Record<Meeting["status"], React.ReactNode> = {
  recording: <FormattedMessage defaultMessage="Recording" />,
  processing: <FormattedMessage defaultMessage="Processing" />,
  completed: <FormattedMessage defaultMessage="Completed" />,
  failed: <FormattedMessage defaultMessage="Failed" />,
};

const STATUS_COLORS: Record<
  Meeting["status"],
  "warning" | "info" | "success" | "error"
> = {
  recording: "warning",
  processing: "info",
  completed: "success",
  failed: "error",
};

function formatDuration(ms: number | undefined | null): string {
  if (!ms || ms <= 0) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

type MeetingListItemProps = {
  meeting: Meeting;
  selected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
};

export const MeetingListItem = memo(function MeetingListItem({
  meeting,
  selected,
  onSelect,
  onDelete,
}: MeetingListItemProps) {
  const handleClick = useCallback(
    () => onSelect(meeting.id),
    [meeting.id, onSelect],
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(meeting.id);
    },
    [meeting.id, onDelete],
  );

  const title =
    meeting.title ||
    new Date(meeting.startedAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <ListItemButton
      selected={selected}
      onClick={handleClick}
      sx={{ borderRadius: 2, px: 2, py: 1.5, mb: 0.5 }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ width: "100%" }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body2" noWrap>
            {title}
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ mt: 0.5 }}
          >
            <Chip
              label={STATUS_LABELS[meeting.status]}
              color={STATUS_COLORS[meeting.status]}
              size="small"
              variant="outlined"
            />
            <Typography variant="caption" color="text.secondary">
              {formatDuration(meeting.durationMs)}
            </Typography>
          </Stack>
        </Box>
        {meeting.status !== "recording" && (
          <IconButton
            size="small"
            onClick={handleDelete}
            aria-label="Delete meeting"
            sx={{ ml: 1 }}
          >
            <DeleteOutline fontSize="small" />
          </IconButton>
        )}
      </Stack>
    </ListItemButton>
  );
});
