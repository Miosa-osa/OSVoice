import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { FormattedMessage } from "react-intl";
import { produceAppState, useAppStore } from "../../store";
import { ListTile } from "../common/ListTile";

export const VibeCodingDialog = () => {
  const { open, variableRecognitionEnabled, fileTaggingEnabled } = useAppStore(
    (state) => ({
      open: state.settings.vibeCodingDialogOpen,
      variableRecognitionEnabled:
        state.settings.vibeCoding.variableRecognitionEnabled,
      fileTaggingEnabled: state.settings.vibeCoding.fileTaggingEnabled,
    }),
  );

  const handleClose = () => {
    produceAppState((draft) => {
      draft.settings.vibeCodingDialogOpen = false;
    });
  };

  const handleVariableRecognitionChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    produceAppState((draft) => {
      draft.settings.vibeCoding.variableRecognitionEnabled =
        event.target.checked;
    });
  };

  const handleFileTaggingChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    produceAppState((draft) => {
      draft.settings.vibeCoding.fileTaggingEnabled = event.target.checked;
    });
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Stack spacing={1}>
          <Typography variant="h6">
            <FormattedMessage defaultMessage="Vibe coding" />
          </Typography>
          <Typography variant="body2" color="textSecondary">
            <FormattedMessage defaultMessage="Optimize OS Voice for coding in your favorite IDE." />
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <ListTile
            title={
              <FormattedMessage defaultMessage="Variable recognition (VS Code, Cursor, Windsurf)" />
            }
            subtitle={
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  <FormattedMessage defaultMessage="Better understands variables in code." />
                </Typography>
                <Link
                  href="https://osa.dev/docs/vibe-coding"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="body2"
                >
                  <FormattedMessage defaultMessage="Learn more →" />
                </Link>
              </Stack>
            }
            disableRipple
            trailing={
              <Switch
                edge="end"
                checked={variableRecognitionEnabled}
                onChange={handleVariableRecognitionChange}
              />
            }
          />
          <ListTile
            title={
              <FormattedMessage defaultMessage="File Tagging in Chat (Cursor & Windsurf)" />
            }
            subtitle={
              <Typography variant="body2" color="text.secondary">
                <FormattedMessage
                  defaultMessage="Automatically tags files in your IDE (like {example})"
                  values={{ example: <code>index.tsx</code> }}
                />
              </Typography>
            }
            disableRipple
            trailing={
              <Switch
                edge="end"
                checked={fileTaggingEnabled}
                onChange={handleFileTaggingChange}
              />
            }
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
          <FormattedMessage defaultMessage="Close" />
        </Button>
      </DialogActions>
    </Dialog>
  );
};
