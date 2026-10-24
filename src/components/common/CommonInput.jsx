
import { useState } from "react";
import {
  TextField,
  InputAdornment,
  IconButton,
} from "@mui/material";

import { Eye, EyeOff } from "lucide-react";

import "../../styles/components/CommonInput.css";

const CommonInput = ({
  name,
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  placeholder = "",
  required = false,
  disabled = false,
  error = false,
  helperText = "",
  startIcon,
  endIcon,
  fullWidth = true,
  size = "medium",
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";

  const inputType =
    isPassword && showPassword ? "text" : type;

  return (
    <TextField
      name={name}
      label={label}
      type={inputType}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      error={Boolean(error)}
      helperText={helperText}
      fullWidth={fullWidth}
      size={size}
      className="toyo-common-input"
      slotProps={{
        input: {
          startAdornment: startIcon ? (
            <InputAdornment position="start">
              {startIcon}
            </InputAdornment>
          ) : undefined,

          endAdornment: isPassword ? (
            <InputAdornment position="end">
              <IconButton
                edge="end"
                type="button"
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                onClick={() =>
                  setShowPassword((prev) => !prev)
                }
                disabled={disabled}
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </IconButton>
            </InputAdornment>
          ) : endIcon ? (
            <InputAdornment position="end">
              {endIcon}
            </InputAdornment>
          ) : undefined,
        },
        htmlInput: {
          min: type === "number" ? 0 : undefined,
        },
      }}
      {...rest}
    />
  );
};

export default CommonInput;
