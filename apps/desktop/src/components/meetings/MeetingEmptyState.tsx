import { MicNoneOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { FormattedMessage } from "react-intl";

export const MeetingEmptyState = () => {
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Stack spacing={2} alignItems="center" sx={{ maxWidth: 360, px: 3 }}>
        <MicNoneOutlined
          sx={(theme) => ({
            fontSize: 48,
            color: theme.vars?.palette.blue,
            opacity: 0.6,
          })}
        />
        <Typography variant="titleMedium" textAlign="center">
          <FormattedMessage defaultMessage="No meetings yet" />
        </Typography>
        <Typography variant="body2" textAlign="center" color="text.secondary">
          <FormattedMessage defaultMessage="Record a meeting to get transcriptions, speaker labels, and AI-generated summaries." />
        </Typography>
      </Stack>
    </Box>
  );
};
