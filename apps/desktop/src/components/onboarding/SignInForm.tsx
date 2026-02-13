import { ArrowForward, OfflineBolt } from "@mui/icons-material";
import { Box, Button, Link, Stack, Typography } from "@mui/material";
import { FormattedMessage } from "react-intl";
import { goToOnboardingPage } from "../../actions/onboarding.actions";
import { trackButtonClick } from "../../utils/analytics.utils";
import { DualPaneLayout, OnboardingFormLayout } from "./OnboardingCommon";

export const SignInForm = () => {
  const handleGetStarted = () => {
    trackButtonClick("onboarding_local_setup");
    goToOnboardingPage("chooseTranscription");
  };

  const rightContent = (
    <Box
      component="img"
      src="https://illustrations.popsy.co/amber/student-going-to-school.svg"
      alt="Illustration"
      sx={{ maxWidth: 400, maxHeight: 400 }}
    />
  );

  const form = (
    <OnboardingFormLayout
      actions={
        <Typography variant="caption" color="text.secondary">
          Powered by{" "}
          <Link
            href="https://osa.dev"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: "primary.main", fontWeight: 600 }}
          >
            OSA
          </Link>
        </Typography>
      }
    >
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h4" fontWeight={600}>
            <FormattedMessage defaultMessage="Set Up OS Voice" />
          </Typography>
          <Typography variant="body1" color="text.secondary">
            <FormattedMessage defaultMessage="Voice-to-text that runs entirely on your device. Your audio never leaves your machine." />
          </Typography>
        </Stack>

        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: "action.hover",
          }}
        >
          <OfflineBolt color="primary" />
          <Typography variant="body2" color="text.secondary">
            <FormattedMessage defaultMessage="100% local & private — no account required" />
          </Typography>
        </Stack>

        <Button
          fullWidth
          variant="contained"
          size="large"
          endIcon={<ArrowForward />}
          onClick={handleGetStarted}
        >
          <FormattedMessage defaultMessage="Get Started" />
        </Button>
      </Stack>
    </OnboardingFormLayout>
  );

  return <DualPaneLayout left={form} right={rightContent} />;
};
