import { Box, type BoxProps, useTheme } from "@mui/material";
import AppLogoPng from "../../assets/app-logo.png";

export type LogoProps = BoxProps;

export const Logo = ({
  sx,
  width = "2.2rem",
  height = "2.2rem",
  ...rest
}: LogoProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  return (
    <Box
      component="img"
      src={AppLogoPng}
      alt="OS Voice"
      width={width}
      height={height}
      sx={{
        objectFit: "contain",
        // Invert colors for dark mode so the logo remains visible
        filter: isDarkMode ? "invert(1)" : "none",
        ...sx,
      }}
      {...rest}
    />
  );
};
