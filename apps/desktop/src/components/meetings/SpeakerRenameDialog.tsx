import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { memo, useCallback, useState } from "react";
import { FormattedMessage } from "react-intl";
import { renameSpeaker } from "../../actions/meeting.actions";

type Props = {
  meetingId: string;
  speakerId: string;
  currentName: string;
  onClose: () => void;
};

export const SpeakerRenameDialog = memo(function SpeakerRenameDialog({
  meetingId,
  speakerId,
  currentName,
  onClose,
}: Props) {
  const [name, setName] = useState(currentName);

  const handleSave = useCallback(() => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== currentName) {
      void renameSpeaker(meetingId, speakerId, trimmed);
    }
    onClose();
  }, [meetingId, speakerId, currentName, name, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSave();
    },
    [handleSave],
  );

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <FormattedMessage defaultMessage="Rename Speaker" />
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          size="small"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Speaker name"
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          <FormattedMessage defaultMessage="Cancel" />
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!name.trim()}
        >
          <FormattedMessage defaultMessage="Save" />
        </Button>
      </DialogActions>
    </Dialog>
  );
});
