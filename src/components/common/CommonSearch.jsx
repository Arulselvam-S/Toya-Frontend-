
import { useEffect, useRef, useState } from "react";

import {
  Box,
  InputBase,
  IconButton,
  CircularProgress,
} from "@mui/material";

import { Search, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import "../../styles/components/CommonSearch.css";

export default function CommonSearch({
  value = "",
  onChange,
  onSearch,
  placeholder = "Search...",
  debounceMs = 400,
  loading = false,
  disabled = false,
  fullWidth = false,
  className = "",
}) {
  const [query, setQuery] = useState(value);
  const [focused, setFocused] = useState(false);

  const reduceMotion = useReducedMotion();
  const searchRef = useRef(onSearch);

  useEffect(() => {
    searchRef.current = onSearch;
  }, [onSearch]);

  // Synchronize incoming value from the parent.
  useEffect(() => {
    setQuery(value ?? "");
  }, [value]);

  // Debounced callback — suitable for future API searches.
  useEffect(() => {
    if (!searchRef.current) return;

    const timer = setTimeout(() => {
      searchRef.current?.(query.trim());
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  const handleChange = (event) => {
    const newValue = event.target.value;

    setQuery(newValue);
    onChange?.(newValue);
  };

  const handleClear = () => {
    setQuery("");
    onChange?.("");
    searchRef.current?.("");
  };

  return (
    <motion.div
      className={`toya-search-wrapper ${className}`}
      style={{
        width: fullWidth ? "100%" : undefined,
      }}
      animate={
        reduceMotion
          ? undefined
          : {
              scale: focused ? 1.015 : 1,
            }
      }
      transition={{ duration: 0.2 }}
    >
      <Box
        className={`toya-common-search ${
          focused ? "toya-search-focused" : ""
        } ${disabled ? "toya-search-disabled" : ""}`}
      >
        <Search
          size={19}
          className="toya-search-icon"
        />

        <InputBase
          value={query}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          fullWidth
          inputProps={{
            "aria-label": placeholder,
            type: "search",
          }}
        />

        {loading && (
          <CircularProgress
            size={17}
            thickness={5}
          />
        )}

        {!loading && query && !disabled && (
          <IconButton
            size="small"
            aria-label="Clear search"
            onClick={handleClear}
          >
            <X size={17} />
          </IconButton>
        )}
      </Box>
    </motion.div>
  );
}
