import { AutoAwesomeOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { memo } from "react";

type Props = {
  summary: string;
};

export const MeetingSummaryCard = memo(function MeetingSummaryCard({
  summary,
}: Props) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: "action.hover",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <AutoAwesomeOutlined sx={{ fontSize: 18, color: "primary.main" }} />
        <Typography variant="titleSmall">Summary</Typography>
      </Stack>
      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
        {summary}
      </Typography>
    </Box>
  );
});
