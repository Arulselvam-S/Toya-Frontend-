
import { createTheme } from "@mui/material/styles";
import { colors } from "./colors";

const muiTheme = createTheme({
  palette: {
    mode: "light",

    primary: {
      main: colors.primary,
      dark: colors.primaryDark,
      light: colors.aquaLight,
    },

    secondary: {
      main: colors.aqua,
    },

    background: {
      default: colors.background,
      paper: colors.white,
    },

    text: {
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
    },

    success: {
      main: colors.success,
    },

    warning: {
      main: colors.warning,
    },

    error: {
      main: colors.error,
    },

    divider: colors.divider,
  },

  typography: {
    fontFamily: '"Inter", sans-serif',

    h4: {
      fontWeight: 800,
    },

    h5: {
      fontWeight: 700,
    },

    h6: {
      fontWeight: 700,
    },

    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },

  shape: {
    borderRadius: 14,
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: "10px 20px",
          boxShadow: "none",
          transition: "all 0.2s ease",
        },

        containedPrimary: {
          background:
            "linear-gradient(105deg, #0879ED, #25AFF5)",

          "&:hover": {
            boxShadow:
              "0 8px 22px rgba(8,121,237,0.22)",
          },
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },

    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        size: "medium",
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

export default muiTheme;
