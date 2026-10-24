
import { useMemo, useState } from "react";

import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Skeleton,
} from "@mui/material";

import {
  Search,
  Pencil,
  Trash2,
  Eye,
  Database,
} from "lucide-react";

import { motion } from "motion/react";

import "../../styles/components/CommonTable.css";

const MotionTableRow = motion.create(TableRow);

export default function CommonTable({
  title = "Records",
  columns = [],
  rows = [],
  loading = false,
  searchable = true,
  pagination = true,
  pageSize = 5,
  onEdit,
  onDelete,
  onView,
  getRowId = (row) => row.id,
  emptyMessage = "No records found",
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);

  const [orderBy, setOrderBy] = useState(null);
  const [order, setOrder] = useState("asc");

  const showActions = Boolean(onEdit || onDelete || onView);

  // Filter records using searchable column values.
  const filteredRows = useMemo(() => {
    const term = search.toLowerCase().trim();

    if (!term) return rows;

    return rows.filter((row) =>
      columns.some((column) => {
        if (column.searchable === false) return false;

        const value = row[column.field];

        return String(value ?? "")
          .toLowerCase()
          .includes(term);
      })
    );
  }, [rows, columns, search]);

  // Sort records without modifying original data.
  const sortedRows = useMemo(() => {
    if (!orderBy) return filteredRows;

    const column = columns.find(
      (item) => item.field === orderBy
    );

    return [...filteredRows].sort((a, b) => {
      const first = a[orderBy];
      const second = b[orderBy];

      if (first == null && second == null) return 0;
      if (first == null) return 1;
      if (second == null) return -1;

      let comparison;

      if (
        typeof first === "number" &&
        typeof second === "number"
      ) {
        comparison = first - second;
      } else {
        comparison = String(first).localeCompare(
          String(second),
          undefined,
          {
            numeric: true,
            sensitivity: "base",
          }
        );
      }

      return order === "asc"
        ? comparison
        : -comparison;
    });
  }, [filteredRows, orderBy, order, columns]);

  const visibleRows = pagination
    ? sortedRows.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
      )
    : sortedRows;

  const handleSort = (field) => {
    if (orderBy === field) {
      setOrder((prev) =>
        prev === "asc" ? "desc" : "asc"
      );
    } else {
      setOrderBy(field);
      setOrder("asc");
    }

    setPage(0);
  };

  const handleSearch = (event) => {
    setSearch(event.target.value);
    setPage(0);
  };

  return (
    <Paper elevation={0} className="toyo-table-card">
      {/* Table header */}
      <Box className="toyo-table-toolbar">
        <Box>
          <Typography variant="h6" fontWeight={750}>
            {title}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            {filteredRows.length} records
          </Typography>
        </Box>

        {searchable && (
          <TextField
            size="small"
            placeholder="Search records..."
            value={search}
            onChange={handleSearch}
            className="toyo-table-search"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={17} />
                  </InputAdornment>
                ),
              },
            }}
          />
        )}
      </Box>

      <TableContainer sx={{ overflowX: "auto" }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.field}
                  align={column.align || "left"}
                  sx={{ minWidth: column.minWidth }}
                >
                  {column.sortable === false ? (
                    column.headerName
                  ) : (
                    <TableSortLabel
                      active={orderBy === column.field}
                      direction={
                        orderBy === column.field
                          ? order
                          : "asc"
                      }
                      onClick={() =>
                        handleSort(column.field)
                      }
                    >
                      {column.headerName}
                    </TableSortLabel>
                  )}
                </TableCell>
              ))}

              {showActions && (
                <TableCell align="right">
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              Array.from({ length: rowsPerPage }).map(
                (_, index) => (
                  <TableRow key={`loading-${index}`}>
                    {Array.from({
                      length:
                        columns.length +
                        (showActions ? 1 : 0),
                    }).map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton height={28} />
                      </TableCell>
                    ))}
                  </TableRow>
                )
              )
            ) : visibleRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={
                    columns.length +
                    (showActions ? 1 : 0)
                  }
                  align="center"
                  sx={{ py: 7 }}
                >
                  <Database
                    size={34}
                    color="#9BBAD1"
                  />

                  <Typography
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((row, index) => (
                <MotionTableRow
                  key={getRowId(row)}
                  initial={{
                    opacity: 0,
                    y: 12,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.25,
                    delay: Math.min(index * 0.04, 0.3),
                  }}
                  hover
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.field}
                      align={column.align || "left"}
                    >
                      {column.renderCell
                        ? column.renderCell(
                            row[column.field],
                            row
                          )
                        : String(
                            row[column.field] ?? "—"
                          )}
                    </TableCell>
                  ))}

                  {showActions && (
                    <TableCell align="right">
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 0.5,
                        }}
                      >
                        {onView && (
                          <Tooltip title="View">
                            <IconButton
                              size="small"
                              aria-label="View record"
                              onClick={() => onView(row)}
                            >
                              <Eye size={17} />
                            </IconButton>
                          </Tooltip>
                        )}

                        {onEdit && (
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              color="primary"
                              aria-label="Edit record"
                              onClick={() => onEdit(row)}
                            >
                              <Pencil size={17} />
                            </IconButton>
                          </Tooltip>
                        )}

                        {onDelete && (
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              aria-label="Delete record"
                              onClick={() => onDelete(row)}
                            >
                              <Trash2 size={17} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  )}
                </MotionTableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {pagination && !loading && (
        <TablePagination
          component="div"
          count={sortedRows.length}
          page={Math.min(
            page,
            Math.max(
              0,
              Math.ceil(
                sortedRows.length / rowsPerPage
              ) - 1
            )
          )}
          onPageChange={(_, newPage) =>
            setPage(newPage)
          }
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(
              parseInt(event.target.value, 10)
            );
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25]}
        />
      )}
    </Paper>
  );
}
