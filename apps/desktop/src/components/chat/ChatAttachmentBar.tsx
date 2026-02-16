import {
  AttachFileRounded,
  CloseRounded,
  DescriptionRounded,
} from "@mui/icons-material";
import {
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { memo, useCallback, useState } from "react";
import { useIntl } from "react-intl";
import { produceAppState, useAppStore } from "../../store";
import type { MessageAttachment } from "../../state/chat.state";

export const ChatAttachmentBar = memo(() => {
  const intl = useIntl();
  const pendingAttachments = useAppStore(
    (state) => state.chat.pendingAttachments,
  );
  const transcriptionIds = useAppStore((state) =>
    Object.keys(state.transcriptionById).slice(0, 10),
  );
  const transcriptionById = useAppStore((state) => state.transcriptionById);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpen = useCallback((e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const addAttachment = useCallback(
    (attachment: MessageAttachment) => {
      produceAppState((draft) => {
        const exists = draft.chat.pendingAttachments.some(
          (a) => a.id === attachment.id,
        );
        if (!exists) {
          draft.chat.pendingAttachments.push(attachment);
        }
      });
      handleClose();
    },
    [handleClose],
  );

  const removeAttachment = useCallback((id: string) => {
    produceAppState((draft) => {
      draft.chat.pendingAttachments = draft.chat.pendingAttachments.filter(
        (a) => a.id !== id,
      );
    });
  }, []);

  const handleAddTranscription = useCallback(
    (transcriptionId: string) => {
      const t = transcriptionById[transcriptionId];
      if (!t) return;
      const content = t.transcript || t.rawTranscript || "";
      const label =
        content.slice(0, 40) + (content.length > 40 ? "..." : "") ||
        "Transcription";
      addAttachment({
        type: "transcription",
        id: transcriptionId,
        label,
        content,
      });
    },
    [transcriptionById, addAttachment],
  );

  const isDisabled = useAppStore(
    (state) => state.chat.isLoading || state.chat.isStreaming,
  );

  return (
    <Box>
      {pendingAttachments.length > 0 && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 0.5,
            mb: 1,
          }}
        >
          {pendingAttachments.map((a) => (
            <Chip
              key={a.id}
              label={a.label}
              size="small"
              icon={<DescriptionRounded sx={{ fontSize: 14 }} />}
              onDelete={() => removeAttachment(a.id)}
              deleteIcon={<CloseRounded sx={{ fontSize: 14 }} />}
              sx={(theme) => ({
                backgroundColor: theme.vars?.palette.level2,
                fontSize: 12,
                height: 24,
              })}
            />
          ))}
        </Box>
      )}
      <IconButton
        onClick={handleOpen}
        disabled={isDisabled}
        size="small"
        aria-label={intl.formatMessage({ defaultMessage: "Attach context" })}
        sx={(theme) => ({
          color: theme.vars?.palette.text.secondary,
        })}
      >
        <AttachFileRounded sx={{ fontSize: 20 }} />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: (theme) => ({
              backgroundColor: theme.vars?.palette.level1,
              backdropFilter: "blur(20px)",
              maxHeight: 300,
              minWidth: 220,
            }),
          },
        }}
      >
        <Typography
          variant="caption"
          sx={{ px: 2, py: 0.5, opacity: 0.6, display: "block" }}
        >
          {intl.formatMessage({ defaultMessage: "Recent transcriptions" })}
        </Typography>
        {transcriptionIds.length === 0 && (
          <MenuItem disabled>
            <ListItemText
              primary={intl.formatMessage({
                defaultMessage: "No transcriptions yet",
              })}
            />
          </MenuItem>
        )}
        {transcriptionIds.map((id) => {
          const t = transcriptionById[id];
          if (!t) return null;
          const text = t.transcript || t.rawTranscript || "";
          const preview = text.slice(0, 50) + (text.length > 50 ? "..." : "");
          const alreadyAttached = pendingAttachments.some((a) => a.id === id);
          return (
            <MenuItem
              key={id}
              onClick={() => handleAddTranscription(id)}
              disabled={alreadyAttached}
              sx={{ fontSize: 13 }}
            >
              <ListItemIcon>
                <DescriptionRounded sx={{ fontSize: 16 }} />
              </ListItemIcon>
              <ListItemText primary={preview || "Empty transcription"} />
            </MenuItem>
          );
        })}
      </Menu>
    </Box>
  );
});
