import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import {
  Star,
  RocketLaunch,
  EmojiEvents,
  TrendingUp,
} from "@mui/icons-material";
import { FormattedMessage, useIntl } from "react-intl";
import { produceAppState, useAppStore } from "../../store";
import { getMyUser } from "../../utils/user.utils";

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
};

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
};

const StatCard = ({ icon, label, value, color }: StatCardProps) => (
  <Box
    sx={{
      p: 2,
      borderRadius: 2,
      bgcolor: "action.hover",
      flex: 1,
      minWidth: 120,
    }}
  >
    <Stack spacing={1}>
      <Box sx={{ color }}>{icon}</Box>
      <Typography variant="h5" fontWeight={700}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  </Box>
);

export const StatsDialog = () => {
  const intl = useIntl();
  const open = useAppStore((state) => state.settings.statsDialogOpen);
  const user = useAppStore(getMyUser);
  const transcriptions = useAppStore((state) =>
    Object.values(state.transcriptionById),
  );

  const wordsTotal = user?.wordsTotal ?? 0;
  const wordsThisMonth = user?.wordsThisMonth ?? 0;

  const weeksActive = Math.max(
    1,
    Math.ceil(
      (Date.now() -
        (user?.createdAt ? new Date(user.createdAt).getTime() : Date.now())) /
        (7 * 24 * 60 * 60 * 1000),
    ),
  );

  const avgWpm =
    transcriptions.length > 0
      ? Math.round(
          transcriptions.reduce((sum, t) => {
            const words = t.transcript?.split(/\s+/).length ?? 0;
            const duration = t.audio?.durationMs
              ? t.audio.durationMs / 60000
              : 1;
            return sum + (duration > 0 ? words / duration : 0);
          }, 0) / transcriptions.length,
        )
      : 0;

  const totalTranscriptions = transcriptions.length;
  const monthlyGoal = 10000;
  const monthlyProgress = Math.min((wordsThisMonth / monthlyGoal) * 100, 100);

  const handleClose = () => {
    produceAppState((draft) => {
      draft.settings.statsDialogOpen = false;
    });
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Typography variant="h6" fontWeight={600}>
          <FormattedMessage defaultMessage="Your Stats" />
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <StatCard
              icon={<Star sx={{ fontSize: 28 }} />}
              label={intl.formatMessage({ defaultMessage: "Weeks Active" })}
              value={weeksActive}
              color="#FFB800"
            />
            <StatCard
              icon={<RocketLaunch sx={{ fontSize: 28 }} />}
              label={intl.formatMessage({ defaultMessage: "Total Words" })}
              value={formatNumber(wordsTotal)}
              color="#FF4D4D"
            />
            <StatCard
              icon={<EmojiEvents sx={{ fontSize: 28 }} />}
              label={intl.formatMessage({ defaultMessage: "Avg WPM" })}
              value={avgWpm}
              color="#FFB800"
            />
          </Stack>

          <Box sx={{ p: 2, borderRadius: 2, bgcolor: "action.hover" }}>
            <Stack spacing={1.5}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <TrendingUp sx={{ color: "#4CAF50" }} />
                  <Typography variant="body1" fontWeight={500}>
                    <FormattedMessage defaultMessage="Monthly Progress" />
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {formatNumber(wordsThisMonth)} / {formatNumber(monthlyGoal)}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={monthlyProgress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: "action.disabledBackground",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 4,
                    bgcolor: "#4CAF50",
                  },
                }}
              />
            </Stack>
          </Box>

          <Stack direction="row" spacing={2}>
            <Box
              sx={{ p: 2, borderRadius: 2, bgcolor: "action.hover", flex: 1 }}
            >
              <Typography variant="h6" fontWeight={700}>
                {totalTranscriptions.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <FormattedMessage defaultMessage="Total Transcriptions" />
              </Typography>
            </Box>
            <Box
              sx={{ p: 2, borderRadius: 2, bgcolor: "action.hover", flex: 1 }}
            >
              <Typography variant="h6" fontWeight={700}>
                {formatNumber(wordsThisMonth)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <FormattedMessage defaultMessage="Words This Month" />
              </Typography>
            </Box>
          </Stack>
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
