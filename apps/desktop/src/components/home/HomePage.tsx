import { Box, Button, Stack, Typography } from "@mui/material";
import { Star, RocketLaunch, EmojiEvents } from "@mui/icons-material";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import { useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useNavigate } from "react-router-dom";
import { produceAppState, useAppStore } from "../../store";
import { getMyUser, getMyUserName } from "../../utils/user.utils";
import { DictationInstruction } from "../common/DictationInstruction";
import { DashboardEntryLayout } from "../dashboard/DashboardEntryLayout";
import { HomeSideEffects } from "./HomeSideEffects";
import { RecentTranscriptRow } from "./RecentTranscriptRow";

dayjs.extend(isToday);
dayjs.extend(isYesterday);

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

type StatItemProps = {
  icon: React.ReactNode;
  value: string;
};

const StatItem = ({ icon, value }: StatItemProps) => (
  <Stack direction="row" alignItems="center" spacing={0.75}>
    {icon}
    <Typography variant="body2" fontWeight={500}>
      {value}
    </Typography>
  </Stack>
);

type GroupedTranscriptions = {
  label: string;
  ids: string[];
};

export default function HomePage() {
  const navigate = useNavigate();
  const user = useAppStore(getMyUser);
  const userName = useAppStore(getMyUserName);
  const transcriptionById = useAppStore((state) => state.transcriptionById);
  const transcriptionIds = useAppStore(
    (state) => state.transcriptions.transcriptionIds,
  );
  const intl = useIntl();

  const transcriptions = useMemo(
    () => Object.values(transcriptionById),
    [transcriptionById],
  );

  const wordsTotal = user?.wordsTotal ?? 0;

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

  const weeksLabel =
    weeksActive === 1
      ? intl.formatMessage(
          { defaultMessage: "{weeks} week" },
          { weeks: weeksActive },
        )
      : intl.formatMessage(
          { defaultMessage: "{weeks} weeks" },
          { weeks: weeksActive },
        );

  const groupedTranscriptions = useMemo((): GroupedTranscriptions[] => {
    const sorted = [...transcriptionIds].sort((a, b) => {
      const tA = transcriptionById[a];
      const tB = transcriptionById[b];
      if (!tA || !tB) return 0;
      return (
        new Date(tB.createdAt).getTime() - new Date(tA.createdAt).getTime()
      );
    });

    const groups: Record<string, string[]> = {};

    for (const id of sorted) {
      const t = transcriptionById[id];
      if (!t) continue;

      const date = dayjs(t.createdAt);
      let label: string;

      if (date.isToday()) {
        label = intl.formatMessage({ defaultMessage: "TODAY" });
      } else if (date.isYesterday()) {
        label = intl.formatMessage({ defaultMessage: "YESTERDAY" });
      } else {
        label = date.format("MMMM D, YYYY").toUpperCase();
      }

      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(id);
    }

    return Object.entries(groups).map(([label, ids]) => ({ label, ids }));
  }, [transcriptionIds, transcriptionById, intl]);

  const handleShowMeHow = () => {
    produceAppState((draft) => {
      draft.settings.shortcutsDialogOpen = true;
    });
  };

  return (
    <DashboardEntryLayout>
      <HomeSideEffects />
      <Stack direction="column">
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          sx={{ mb: 3 }}
        >
          <Typography variant="h5" fontWeight={600}>
            <FormattedMessage
              defaultMessage="Welcome back, {name}"
              values={{ name: userName }}
            />
          </Typography>
          <Stack
            direction="row"
            spacing={1.5}
            onClick={() => navigate("/dashboard/stats")}
            sx={{
              py: 0.75,
              px: 1.5,
              borderRadius: 10,
              bgcolor: "action.hover",
              alignItems: "center",
              cursor: "pointer",
              transition: "background-color 0.2s",
              "&:hover": {
                bgcolor: "action.selected",
              },
            }}
          >
            <StatItem
              icon={<Star sx={{ fontSize: 16, color: "#FFB800" }} />}
              value={weeksLabel}
            />
            <StatItem
              icon={<RocketLaunch sx={{ fontSize: 16, color: "#FF4D4D" }} />}
              value={intl.formatMessage(
                { defaultMessage: "{words} words" },
                { words: formatNumber(wordsTotal) },
              )}
            />
            <StatItem
              icon={<EmojiEvents sx={{ fontSize: 16, color: "#FFB800" }} />}
              value={intl.formatMessage(
                { defaultMessage: "{wpm} WPM" },
                { wpm: avgWpm },
              )}
            />
          </Stack>
        </Stack>

        <Box
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 2,
            bgcolor: "rgba(255, 243, 224, 0.15)",
            border: "1px solid rgba(255, 193, 7, 0.3)",
          }}
        >
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{ mb: 1, color: "text.primary" }}
          >
            <FormattedMessage defaultMessage="Hold" />{" "}
            <Box
              component="span"
              sx={{
                px: 1,
                py: 0.25,
                bgcolor: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: 1,
                fontFamily: "monospace",
                fontSize: "0.9em",
              }}
            >
              fn
            </Box>{" "}
            <FormattedMessage defaultMessage="to dictate and let OS Voice format for you" />
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
            <FormattedMessage defaultMessage="Press and hold fn to dictate in any app. OS Voice's Smart Formatting will handle punctuation, new lines, lists, and adjust when you change your mind mid-sentence." />
          </Typography>
          <Box sx={{ mb: 2 }}>
            <DictationInstruction />
          </Box>
          <Button
            variant="contained"
            size="small"
            onClick={handleShowMeHow}
            sx={{
              bgcolor: "primary.main",
              color: "primary.contrastText",
              textTransform: "none",
              "&:hover": { bgcolor: "primary.dark" },
            }}
          >
            <FormattedMessage defaultMessage="Show me how" />
          </Button>
        </Box>

        {groupedTranscriptions.length > 0 ? (
          <Stack spacing={3}>
            {groupedTranscriptions.map((group) => (
              <Box key={group.label}>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ mb: 1, display: "block", letterSpacing: 1 }}
                >
                  {group.label}
                </Typography>
                <Stack spacing={0}>
                  {group.ids.map((id) => (
                    <RecentTranscriptRow key={id} id={id} />
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        ) : (
          <Box sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>
            <Typography variant="body1">
              <FormattedMessage defaultMessage="No transcriptions yet. Start dictating to see your history here." />
            </Typography>
          </Box>
        )}
      </Stack>
    </DashboardEntryLayout>
  );
}
