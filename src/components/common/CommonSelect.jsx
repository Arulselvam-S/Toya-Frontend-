
import { Autocomplete, TextField, Chip } from "@mui/material";
import { ChevronDown, X } from "lucide-react";

import "../../styles/components/CommonSelect.css";

const CommonSelect = ({
  name,
  label,
  options = [],
  value = null,
  onChange,
  onBlur,
  placeholder = "Select an option",
  required = false,
  disabled = false,
  multiple = false,
  error = false,
  helperText = "",
  loading = false,
  fullWidth = true,
  size = "medium",
  disableClearable = false,
  ...rest
}) => {
  const normalizedOptions = options.map((option) =>
    typeof option === "string"
      ? { label: option, value: option }
      : option
  );

  const findOption = (selectedValue) =>
    normalizedOptions.find(
      (option) => option.value === selectedValue
    ) ?? null;

  const selectedValue = multiple
    ? (Array.isArray(value) ? value : [])
        .map(findOption)
        .filter(Boolean)
    : findOption(value);

  const handleChange = (_, newValue) => {
    if (!onChange) return;

    if (multiple) {
      onChange(newValue.map((option) => option.value));
    } else {
      onChange(newValue?.value ?? null);
    }
  };

  return (
    <Autocomplete
      {...rest}
      multiple={multiple}
      options={normalizedOptions}
      value={selectedValue}
      onChange={handleChange}
      onBlur={onBlur}
      disabled={disabled}
      loading={loading}
      fullWidth={fullWidth}
      size={size}
      disableClearable={disableClearable}
      className="toyo-common-select"
      popupIcon={<ChevronDown size={18} />}
      clearIcon={<X size={16} />}
      isOptionEqualToValue={(option, selected) =>
        option.value === selected.value
      }
      getOptionLabel={(option) => option?.label ?? ""}
      renderTags={(selectedOptions, getTagProps) =>
        selectedOptions.map((option, index) => {
          const { key, ...tagProps } = getTagProps({ index });

          return (
            <Chip
              key={key ?? option.value}
              label={option.label}
              size="small"
              {...tagProps}
            />
          );
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          name={name}
          label={label}
          placeholder={
            multiple && selectedValue.length > 0
              ? ""
              : placeholder
          }
          required={
            required &&
            (multiple
              ? selectedValue.length === 0
              : selectedValue === null)
          }
          error={Boolean(error)}
          helperText={helperText}
        />
      )}
    />
  );
};

export default CommonSelect;
