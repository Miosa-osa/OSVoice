import {
  ContentCopy,
  MoreVert,
  Replay,
  Delete,
  Download,
} from "@mui/icons-material";
import {
  Box,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { getRec } from "@repo/utilities";
import { convertFileSrc } from "@tauri-apps/api/core";
import dayjs from "dayjs";
import { useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { showErrorSnackbar, showSnackbar } from "../../actions/app.actions";
import { retranscribeTranscription } from "../../actions/transcriptions.actions";
import { getTranscriptionRepo } from "../../repos";
import { produceAppState, useAppStore } from "../../store";

export type RecentTranscriptRowProps = {
  id: string;
};

export const RecentTranscriptRow = ({ id }: RecentTranscriptRowProps) => {
  const intl = useIntl();
  const transcription = useAppStore((state) =>
    getRec(state.transcriptionById, id),
  );
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const audioSnapshot = transcription?.audio;
  const audioSrc = useMemo(() => {
    if (!audioSnapshot) return null;
    try {
      return convertFileSrc(audioSnapshot.filePath);
    } catch {
      return null;
    }
  }, [audioSnapshot]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(transcription?.transcript || "");
      showSnackbar(
        intl.formatMessage({ defaultMessage: "Copied to clipboard" }),
        { mode: "success" },
      );
    } catch (error) {
      showErrorSnackbar(error);
    }
  }, [intl, transcription?.transcript]);

  const handleDelete = useCallback(async () => {
    setAnchorEl(null);
    try {
      produceAppState((draft) => {
        delete draft.transcriptionById[id];
        draft.transcriptions.transcriptionIds =
          draft.transcriptions.transcriptionIds.filter((tid) => tid !== id);
      });
      await getTranscriptionRepo().deleteTranscription(id);
      showSnackbar(
        intl.formatMessage({ defaultMessage: "Transcript deleted" }),
        { mode: "success" },
      );
    } catch (error) {
      showErrorSnackbar(error);
    }
  }, [id, intl]);

  const handleRetranscribe = useCallback(async () => {
    setAnchorEl(null);
    if (!audioSnapshot) {
      showErrorSnackbar(
        intl.formatMessage({ defaultMessage: "No audio available" }),
      );
      return;
    }
    try {
      await retranscribeTranscription({ transcriptionId: id, toneId: null });
      showSnackbar(
        intl.formatMessage({ defaultMessage: "Retranscribing..." }),
        { mode: "info" },
      );
    } catch (error) {
      showErrorSnackbar(error);
    }
  }, [audioSnapshot, id, intl]);

  const handleDownloadAudio = useCallback(() => {
    setAnchorEl(null);
    if (!audioSrc) {
      showErrorSnackbar(
        intl.formatMessage({ defaultMessage: "No audio available" }),
      );
      return;
    }
    const link = document.createElement("a");
    link.href = audioSrc;
    link.download = `transcript-${id}.wav`;
    link.click();
  }, [audioSrc, id, intl]);

  if (!transcription) return null;

  const timeLabel = dayjs(transcription.createdAt).format("h:mm A");

  return (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        py: 1.5,
        px: 2,
        borderRadius: 2,
        transition: "background-color 150ms",
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ minWidth: 70, pt: 0.25, fontFeatureSettings: '"tnum"' }}
        >
          {timeLabel}
        </Typography>
        <Typography
          variant="body2"
          color="text.primary"
          sx={{
            flex: 1,
            lineHeight: 1.6,
            wordBreak: "break-word",
          }}
        >
          {transcription.transcript}
        </Typography>
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            opacity: isHovered ? 1 : 0,
            transition: "opacity 150ms",
          }}
        >
          <Tooltip title={<FormattedMessage defaultMessage="Copy" />}>
            <IconButton size="small" onClick={handleCopy}>
              <ContentCopy sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={<FormattedMessage defaultMessage="More options" />}>
            <IconButton
              size="small"
              onClick={(e) => setAnchorEl(e.currentTarget)}
            >
              <MoreVert sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={handleRetranscribe} disabled={!audioSnapshot}>
          <ListItemIcon>
            <Replay fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            <FormattedMessage defaultMessage="Retry transcript" />
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>
          <ListItemIcon>
            <Delete fontSize="small" sx={{ color: "error.main" }} />
          </ListItemIcon>
          <ListItemText>
            <FormattedMessage defaultMessage="Delete transcript" />
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDownloadAudio} disabled={!audioSrc}>
          <ListItemIcon>
            <Download fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            <FormattedMessage defaultMessage="Download audio" />
          </ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};
