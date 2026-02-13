import { Box, LinearProgress, Stack, Typography } from "@mui/material";
import {
  Star,
  RocketLaunch,
  EmojiEvents,
  TrendingUp,
  Whatshot,
  CalendarToday,
  Speed,
  Timer,
  WorkspacePremium,
  LocalFireDepartment,
} from "@mui/icons-material";
import dayjs from "dayjs";
import { useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useAppStore } from "../../store";
import { getMyUser, getMyUserName } from "../../utils/user.utils";
import { DashboardEntryLayout } from "../dashboard/DashboardEntryLayout";

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
};

const getWordsAchievement = (words: number): string => {
  if (words >= 100000) return "You've written multiple novels!";
  if (words >= 50000) return "You've written a full novel!";
  if (words >= 10000) return "You've written a novella!";
  if (words >= 5000) return "You've written a short story!";
  if (words >= 1000) return "You've written several essays!";
  if (words >= 100) return "Great start!";
  return "Just getting started";
};

const getStreakAchievement = (weeks: number): string => {
  if (weeks >= 52) return "You are a Voice legend! 🏆";
  if (weeks >= 26) return "Half a year strong!";
  if (weeks >= 12) return "Dedicated user!";
  if (weeks >= 4) return "Building the habit!";
  if (weeks >= 2) return "Consistency is key!";
  return "Keep it up!";
};

const getSpeedAchievement = (wpm: number): string => {
  if (wpm >= 300) return "Absolutely insane! 🔥";
  if (wpm >= 250) return "Superhuman speed!";
  if (wpm >= 200) return "Lightning fast! Top 1%";
  if (wpm >= 150) return "Super speedy! Top 5%";
  if (wpm >= 100) return "Fast talker! Top 20%";
  if (wpm >= 75) return "Good pace!";
  if (wpm >= 50) return "Steady rhythm";
  return "Taking it easy";
};

const getAppsAchievement = (apps: number): string => {
  if (apps >= 20) return "You are always in flow state!";
  if (apps >= 10) return "Multi-app master!";
  if (apps >= 5) return "Exploring the possibilities!";
  if (apps >= 2) return "Getting started!";
  return "Try more apps!";
};

type HeroStatCardProps = {
  label: string;
  value: string;
  emoji: string;
  achievement: string;
};

const HeroStatCard = ({
  label,
  value,
  emoji,
  achievement,
}: HeroStatCardProps) => (
  <Box
    sx={{
      p: 3,
      borderRadius: 3,
      bgcolor: "rgba(255, 255, 255, 0.05)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      height: "100%",
    }}
  >
    <Typography
      variant="overline"
      sx={{
        color: "text.secondary",
        letterSpacing: 1.5,
        fontSize: "0.7rem",
        fontWeight: 600,
      }}
    >
      {label}
    </Typography>
    <Typography
      variant="h4"
      fontWeight={700}
      sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}
    >
      {value} <span style={{ fontSize: "1.5rem" }}>{emoji}</span>
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
      {achievement}
    </Typography>
  </Box>
);

type MilestoneProps = {
  icon: React.ReactNode;
  title: string;
  achieved: boolean;
  progress: number;
};

const Milestone = ({ icon, title, achieved, progress }: MilestoneProps) => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={2}
    sx={{
      p: 2,
      borderRadius: 2,
      bgcolor: achieved
        ? "rgba(76, 175, 80, 0.1)"
        : "rgba(255, 255, 255, 0.02)",
      border: achieved
        ? "1px solid rgba(76, 175, 80, 0.3)"
        : "1px solid rgba(255, 255, 255, 0.05)",
    }}
  >
    <Box
      sx={{
        color: achieved ? "#4CAF50" : "text.secondary",
        opacity: achieved ? 1 : 0.5,
      }}
    >
      {icon}
    </Box>
    <Box sx={{ flex: 1 }}>
      <Typography
        variant="body2"
        fontWeight={500}
        sx={{ opacity: achieved ? 1 : 0.7 }}
      >
        {title}
      </Typography>
      {!achieved && (
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            mt: 0.5,
            height: 4,
            borderRadius: 2,
            bgcolor: "rgba(255, 255, 255, 0.05)",
            "& .MuiLinearProgress-bar": {
              borderRadius: 2,
              bgcolor: "primary.main",
            },
          }}
        />
      )}
    </Box>
    {achieved && (
      <Typography variant="caption" sx={{ color: "#4CAF50", fontWeight: 600 }}>
        ✓
      </Typography>
    )}
  </Stack>
);

export default function StatsPage() {
  const intl = useIntl();
  const user = useAppStore(getMyUser);
  const userName = useAppStore(getMyUserName);
  const transcriptions = useAppStore((state) =>
    Object.values(state.transcriptionById),
  );
  const appTargets = useAppStore((state) => Object.values(state.appTargetById));

  const wordsTotal = user?.wordsTotal ?? 0;
  const wordsThisMonth = user?.wordsThisMonth ?? 0;
  const totalApps = appTargets.length;
  const bestWpm = user?.bestWpm ?? 0;
  const totalDurationMs = user?.totalDurationMs ?? 0;
  const avgWpmFromUser =
    totalDurationMs > 0
      ? Math.round((wordsTotal / totalDurationMs) * 60000)
      : 0;

  const weeksActive = Math.max(
    1,
    Math.ceil(
      (Date.now() -
        (user?.createdAt ? new Date(user.createdAt).getTime() : Date.now())) /
        (7 * 24 * 60 * 60 * 1000),
    ),
  );

  const stats = useMemo(() => {
    if (transcriptions.length === 0) {
      return {
        avgWpm: 0,
        totalTranscriptions: 0,
        totalDuration: 0,
        avgWordsPerTranscription: 0,
        bestDay: null as string | null,
        bestDayWords: 0,
        streakDays: 0,
        todayWords: 0,
        thisWeekWords: 0,
        lastWeekWords: 0,
      };
    }

    let totalWpm = 0;
    let totalWords = 0;
    let totalDuration = 0;
    const wordsByDay: Record<string, number> = {};
    const today = dayjs().startOf("day");
    const weekAgo = today.subtract(7, "day");
    const twoWeeksAgo = today.subtract(14, "day");

    let thisWeekWords = 0;
    let lastWeekWords = 0;
    let todayWords = 0;

    for (const t of transcriptions) {
      const words = t.transcript?.split(/\s+/).length ?? 0;
      const duration = t.audio?.durationMs ?? 0;
      totalWords += words;
      totalDuration += duration;

      if (duration > 0) {
        const wpm = (words / duration) * 60000;
        totalWpm += wpm;
      }

      const day = dayjs(t.createdAt).format("YYYY-MM-DD");
      wordsByDay[day] = (wordsByDay[day] || 0) + words;

      const createdAt = dayjs(t.createdAt);
      if (createdAt.isAfter(today)) {
        todayWords += words;
      }
      if (createdAt.isAfter(weekAgo)) {
        thisWeekWords += words;
      } else if (createdAt.isAfter(twoWeeksAgo)) {
        lastWeekWords += words;
      }
    }

    const avgWpm = Math.round(totalWpm / transcriptions.length);
    const avgWordsPerTranscription = Math.round(
      totalWords / transcriptions.length,
    );

    let bestDay: string | null = null;
    let bestDayWords = 0;
    for (const [day, words] of Object.entries(wordsByDay)) {
      if (words > bestDayWords) {
        bestDayWords = words;
        bestDay = day;
      }
    }

    let streakDays = 0;
    let checkDate = dayjs().startOf("day");
    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.format("YYYY-MM-DD");
      if (wordsByDay[dateStr]) {
        streakDays++;
        checkDate = checkDate.subtract(1, "day");
      } else if (i === 0) {
        checkDate = checkDate.subtract(1, "day");
      } else {
        break;
      }
    }

    return {
      avgWpm,
      totalTranscriptions: transcriptions.length,
      totalDuration,
      avgWordsPerTranscription,
      bestDay,
      bestDayWords,
      streakDays,
      todayWords,
      thisWeekWords,
      lastWeekWords,
    };
  }, [transcriptions]);

  const monthlyGoal = 10000;
  const monthlyProgress = Math.min((wordsThisMonth / monthlyGoal) * 100, 100);

  const weekChange =
    stats.lastWeekWords > 0
      ? Math.round(
          ((stats.thisWeekWords - stats.lastWeekWords) / stats.lastWeekWords) *
            100,
        )
      : stats.thisWeekWords > 0
        ? 100
        : 0;

  return (
    <DashboardEntryLayout>
      <Stack spacing={4}>
        <Box sx={{ textAlign: "center", py: 2 }}>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
            You've been Flowing. Hard.
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's a personal snapshot of your productivity with OS Voice,{" "}
            {userName}.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
          }}
        >
          <HeroStatCard
            label="WEEKLY STREAK"
            value={`${weeksActive} weeks`}
            emoji="⭐"
            achievement={getStreakAchievement(weeksActive)}
          />
          <HeroStatCard
            label="AVERAGE SPEED"
            value={`${avgWpmFromUser || stats.avgWpm} WPM`}
            emoji="🏆"
            achievement={getSpeedAchievement(avgWpmFromUser || stats.avgWpm)}
          />
          <HeroStatCard
            label="TOTAL WORDS DICTATED"
            value={formatNumber(wordsTotal)}
            emoji="🚀"
            achievement={getWordsAchievement(wordsTotal)}
          />
          <HeroStatCard
            label="TOTAL APPS USED"
            value={`${totalApps} apps`}
            emoji="👑"
            achievement={getAppsAchievement(totalApps)}
          />
        </Box>

        <Box
          sx={{
            p: 3,
            borderRadius: 3,
            background:
              "linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.02) 100%)",
            border: "1px solid rgba(76, 175, 80, 0.2)",
          }}
        >
          <Stack spacing={2}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <TrendingUp sx={{ color: "#4CAF50", fontSize: 24 }} />
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    <FormattedMessage defaultMessage="Monthly Goal" />
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    <FormattedMessage defaultMessage="Keep up the momentum!" />
                  </Typography>
                </Box>
              </Stack>
              <Stack alignItems="flex-end">
                <Typography variant="h5" fontWeight={700}>
                  {formatNumber(wordsThisMonth)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  / {formatNumber(monthlyGoal)} words
                </Typography>
              </Stack>
            </Stack>
            <Box>
              <LinearProgress
                variant="determinate"
                value={monthlyProgress}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: "rgba(255, 255, 255, 0.05)",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 5,
                    background:
                      "linear-gradient(90deg, #4CAF50 0%, #8BC34A 100%)",
                  },
                }}
              />
              <Stack
                direction="row"
                justifyContent="space-between"
                sx={{ mt: 1 }}
              >
                <Typography variant="caption" color="text.secondary">
                  {Math.round(monthlyProgress)}% complete
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatNumber(Math.max(0, monthlyGoal - wordsThisMonth))}{" "}
                  words to go
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2,
          }}
        >
          <Box>
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                height: "100%",
              }}
            >
              <Typography variant="body1" fontWeight={600} sx={{ mb: 2 }}>
                <FormattedMessage defaultMessage="This Week" />
              </Typography>
              <Stack spacing={2}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="body2" color="text.secondary">
                    <FormattedMessage defaultMessage="Words dictated" />
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {formatNumber(stats.thisWeekWords)}
                  </Typography>
                </Stack>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="body2" color="text.secondary">
                    <FormattedMessage defaultMessage="vs last week" />
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    sx={{ color: weekChange >= 0 ? "#4CAF50" : "#f44336" }}
                  >
                    {weekChange >= 0 ? "+" : ""}
                    {weekChange}%
                  </Typography>
                </Stack>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="body2" color="text.secondary">
                    <FormattedMessage defaultMessage="Transcriptions" />
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {stats.totalTranscriptions}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Box>

          <Box>
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                height: "100%",
              }}
            >
              <Typography variant="body1" fontWeight={600} sx={{ mb: 2 }}>
                <FormattedMessage defaultMessage="Personal Bests" />
              </Typography>
              <Stack spacing={2}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <EmojiEvents sx={{ fontSize: 18, color: "#FFB800" }} />
                    <Typography variant="body2" color="text.secondary">
                      <FormattedMessage defaultMessage="Best day" />
                    </Typography>
                  </Stack>
                  <Stack alignItems="flex-end">
                    <Typography variant="body1" fontWeight={600}>
                      {formatNumber(stats.bestDayWords)} words
                    </Typography>
                    {stats.bestDay && (
                      <Typography variant="caption" color="text.secondary">
                        {dayjs(stats.bestDay).format("MMM D, YYYY")}
                      </Typography>
                    )}
                  </Stack>
                </Stack>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LocalFireDepartment
                      sx={{ fontSize: 18, color: "#FF6B35" }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      <FormattedMessage defaultMessage="Current streak" />
                    </Typography>
                  </Stack>
                  <Typography variant="body1" fontWeight={600}>
                    {stats.streakDays} days
                  </Typography>
                </Stack>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Speed sx={{ fontSize: 18, color: "#9C27B0" }} />
                    <Typography variant="body2" color="text.secondary">
                      <FormattedMessage defaultMessage="Best WPM" />
                    </Typography>
                  </Stack>
                  <Typography variant="body1" fontWeight={600}>
                    {bestWpm} WPM
                  </Typography>
                </Stack>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Timer sx={{ fontSize: 18, color: "#2196F3" }} />
                    <Typography variant="body2" color="text.secondary">
                      <FormattedMessage defaultMessage="Avg per transcription" />
                    </Typography>
                  </Stack>
                  <Typography variant="body1" fontWeight={600}>
                    {stats.avgWordsPerTranscription} words
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Box>
        </Box>

        <Box>
          <Typography variant="body1" fontWeight={600} sx={{ mb: 2 }}>
            <FormattedMessage defaultMessage="Milestones" />
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 1.5,
            }}
          >
            <Box>
              <Milestone
                icon={<RocketLaunch sx={{ fontSize: 20 }} />}
                title={intl.formatMessage({
                  defaultMessage: "First 100 words",
                })}
                achieved={wordsTotal >= 100}
                progress={Math.min((wordsTotal / 100) * 100, 100)}
              />
            </Box>
            <Box>
              <Milestone
                icon={<Star sx={{ fontSize: 20 }} />}
                title={intl.formatMessage({
                  defaultMessage: "1,000 words club",
                })}
                achieved={wordsTotal >= 1000}
                progress={Math.min((wordsTotal / 1000) * 100, 100)}
              />
            </Box>
            <Box>
              <Milestone
                icon={<Whatshot sx={{ fontSize: 20 }} />}
                title={intl.formatMessage({ defaultMessage: "7-day streak" })}
                achieved={stats.streakDays >= 7}
                progress={Math.min((stats.streakDays / 7) * 100, 100)}
              />
            </Box>
            <Box>
              <Milestone
                icon={<WorkspacePremium sx={{ fontSize: 20 }} />}
                title={intl.formatMessage({
                  defaultMessage: "10,000 words mastery",
                })}
                achieved={wordsTotal >= 10000}
                progress={Math.min((wordsTotal / 10000) * 100, 100)}
              />
            </Box>
            <Box>
              <Milestone
                icon={<EmojiEvents sx={{ fontSize: 20 }} />}
                title={intl.formatMessage({
                  defaultMessage: "Speed demon (100+ WPM)",
                })}
                achieved={bestWpm >= 100}
                progress={Math.min((bestWpm / 100) * 100, 100)}
              />
            </Box>
            <Box>
              <Milestone
                icon={<CalendarToday sx={{ fontSize: 20 }} />}
                title={intl.formatMessage({ defaultMessage: "30-day streak" })}
                achieved={stats.streakDays >= 30}
                progress={Math.min((stats.streakDays / 30) * 100, 100)}
              />
            </Box>
          </Box>
        </Box>
      </Stack>
    </DashboardEntryLayout>
  );
}
