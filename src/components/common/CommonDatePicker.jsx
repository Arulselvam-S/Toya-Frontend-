
import { Box, Stack } from "@mui/material";
import {
  LocalizationProvider,
  DatePicker,
} from "@mui/x-date-pickers";

import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

import "../../styles/components/CommonDatePicker.css";

const DATE_FORMAT = "YYYY-MM-DD";

const toDayjs = (value) => {
  if (!value) return null;

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
};

const toDateString = (date) => {
  if (!date || !date.isValid()) return null;
  return date.format(DATE_FORMAT);
};

export default function CommonDatePicker({
  name,
  label = "Select Date",
  value = null,
  onChange,
  onBlur,
  placeholder = "DD/MM/YYYY",

  mode = "single",
  endValue = null,
  onEndChange,

  required = false,
  disabled = false,
  readOnly = false,
  error = false,
  helperText = "",

  minDate,
  maxDate,
  disableFuture = false,
  disablePast = false,
  fullWidth = true,
  size = "medium",
}) {
  const sharedProps = {
    disabled,
    readOnly,
    disableFuture,
    disablePast,
    minDate: toDayjs(minDate),
    maxDate: toDayjs(maxDate),
    format: "DD/MM/YYYY",
  };

  const getTextFieldProps = (fieldName, fieldError) => ({
    name: fieldName,
    size,
    fullWidth,
    required,
    error: Boolean(fieldError),
    helperText: fieldError ? helperText : "",
    onBlur,
    placeholder,
    className: "toya-common-date-input",
  });

  const picker = (
    pickerLabel,
    pickerName,
    pickerValue,
    changeHandler,
    fieldError,
    extraProps = {}
  ) => (
    <DatePicker
      {...sharedProps}
      {...extraProps}
      label={pickerLabel}
      value={toDayjs(pickerValue)}
      onChange={(newDate) => {
        changeHandler?.(toDateString(newDate));
      }}
      slotProps={{
        textField: getTextFieldProps(
          pickerName,
          fieldError
        ),
        popper: {
          className: "toya-date-popper",
        },
        actionBar: {
          actions: ["clear", "today", "accept"],
        },
      }}
    />
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      {mode === "range" ? (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ width: fullWidth ? "100%" : "auto" }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {picker(
              "Start Date",
              `${name || "date"}Start`,
              value,
              onChange,
              error,
              {
                maxDate: toDayjs(endValue) ||
                  toDayjs(maxDate),
              }
            )}
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            {picker(
              "End Date",
              `${name || "date"}End`,
              endValue,
              onEndChange,
              error,
              {
                minDate: toDayjs(value) ||
                  toDayjs(minDate),
              }
            )}
          </Box>
        </Stack>
      ) : (
        <Box sx={{ width: fullWidth ? "100%" : "auto" }}>
          {picker(
            label,
            name,
            value,
            onChange,
            error
          )}
        </Box>
      )}
    </LocalizationProvider>
  );
}
