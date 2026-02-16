import { CheckCircleOutline } from "@mui/icons-material";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { memo, useMemo } from "react";

type ActionItem = {
  task: string;
  assignee: string | null;
  priority: string;
};

const PRIORITY_COLORS: Record<string, "error" | "warning" | "default"> = {
  high: "error",
  medium: "warning",
  low: "default",
};

type Props = {
  actionItemsJson: string;
};

export const MeetingActionItems = memo(function MeetingActionItems({
  actionItemsJson,
}: Props) {
  const items = useMemo((): ActionItem[] => {
    try {
      const parsed = JSON.parse(actionItemsJson) as ActionItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [actionItemsJson]);

  if (items.length === 0) return null;

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <CheckCircleOutline sx={{ fontSize: 18, color: "primary.main" }} />
        <Typography variant="titleSmall">Action Items</Typography>
      </Stack>
      <Stack spacing={1}>
        {items.map((item, idx) => (
          <Stack
            key={idx}
            direction="row"
            spacing={1.5}
            alignItems="flex-start"
            sx={{
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: "action.hover",
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2">{item.task}</Typography>
              {item.assignee && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  {item.assignee}
                </Typography>
              )}
            </Box>
            <Chip
              label={item.priority}
              size="small"
              color={PRIORITY_COLORS[item.priority] ?? "default"}
              variant="outlined"
            />
          </Stack>
        ))}
      </Stack>
    </Box>
  );
});
