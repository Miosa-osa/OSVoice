import { AutoAwesomeRounded } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { FormattedMessage } from "react-intl";

export const ChatEmptyState = () => {
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
        <AutoAwesomeRounded
          sx={(theme) => ({
            fontSize: 48,
            color: theme.vars.palette.blue,
            opacity: 0.6,
          })}
        />
        <Typography variant="titleMedium" textAlign="center">
          <FormattedMessage defaultMessage="Ask OSVoice anything" />
        </Typography>
        <Typography variant="body2" textAlign="center" color="text.secondary">
          <FormattedMessage defaultMessage="Chat with AI using your configured model. Your conversations are stored locally." />
        </Typography>
      </Stack>
    </Box>
  );
};
