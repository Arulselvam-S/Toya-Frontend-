
import {
  Box,
  Typography,
  Pagination,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";

import { motion, useReducedMotion } from "motion/react";

import "../../styles/components/CommonPagination.css";

export default function CommonPagination({
  page = 1,
  rowsPerPage = 10,
  totalRecords = 0,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [5, 10, 25, 50],
  disabled = false,
  loading = false,
  showRowsPerPage = true,
  showRecordInfo = true,
  siblingCount = 1,
  className = "",
}) {
  const reduceMotion = useReducedMotion();

  const safeRowsPerPage = Math.max(1, rowsPerPage);

  const totalPages = Math.max(
    1,
    Math.ceil(totalRecords / safeRowsPerPage)
  );

  const currentPage = Math.min(
    Math.max(1, page),
    totalPages
  );

  const startRecord =
    totalRecords === 0
      ? 0
      : (currentPage - 1) * safeRowsPerPage + 1;

  const endRecord = Math.min(
    currentPage * safeRowsPerPage,
    totalRecords
  );

  const isDisabled = disabled || loading;

  return (
    <motion.div
      className={`toya-pagination-wrapper ${className}`}
      initial={
        reduceMotion
          ? false
          : { opacity: 0, y: 12 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Box className="toya-pagination-info">
        {showRecordInfo && (
          <Typography className="toya-pagination-text">
            Showing{" "}
            <strong>{startRecord}–{endRecord}</strong>
            {" "}of{" "}
            <strong>{totalRecords}</strong>
            {" "}records
          </Typography>
        )}

        {showRowsPerPage && (
          <Box className="toya-rows-control">
            <Typography className="toya-pagination-text">
              Rows per page
            </Typography>

            <FormControl size="small">
              <Select
                value={rowsPerPage}
                disabled={isDisabled}
                onChange={(event) => {
                  onRowsPerPageChange?.(
                    Number(event.target.value)
                  );
                }}
                aria-label="Rows per page"
                className="toya-rows-select"
              >
                {rowsPerPageOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}
      </Box>

      <Pagination
        count={totalPages}
        page={currentPage}
        onChange={(_, newPage) => {
          onPageChange?.(newPage);
        }}
        disabled={isDisabled || totalRecords === 0}
        color="primary"
        shape="rounded"
        siblingCount={siblingCount}
        boundaryCount={1}
        showFirstButton
        showLastButton
        className="toya-pagination"
        aria-label="Records pagination"
      />
    </motion.div>
  );
}
