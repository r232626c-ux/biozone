import React, { useEffect, useRef, useState } from "react";
import {
  Paper,
  Typography,
  Grid,
  Checkbox,
  FormControlLabel,
  Divider,
  TextField,
  Box,
  Button,
  MenuItem,
  IconButton,
  Tooltip,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import axios from "axios";

import { API_URL } from "../../utils/api";

const LabTestRequest = ({ selectedTests, setSelectedTests }) => {
  const [labTests, setLabTests] = useState({});
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const listRef = useRef(null);

  const [newTestName, setNewTestName] = useState("");
  const [newTestCategory, setNewTestCategory] = useState("");

  // ==================================================
  // FETCH LAB TESTS
  // ==================================================
  useEffect(() => {
    const fetchLabTests = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/lab-tests`);

        const grouped = res.data.reduce((acc, test) => {
          if (!acc[test.category]) acc[test.category] = [];
          acc[test.category].push(test);
          return acc;
        }, {});

        setLabTests(grouped);
        setAllCategories(Object.keys(grouped));
      } catch (err) {
        console.error("Error fetching lab tests", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLabTests();
  }, []);

  const getTestKey = (test) =>
    test.id !== undefined && test.id !== null
      ? String(test.id)
      : `${test.category}:${test.name}`;

  // ==================================================
  // TEST TOGGLE
  // ==================================================
  const toggleTest = (test) => {
    const key = getTestKey(test);
    const exists = selectedTests.some((t) => getTestKey(t) === key);

    setSelectedTests((prev) =>
      exists ? prev.filter((t) => getTestKey(t) !== key) : [...prev, test]
    );
  };

  // ==================================================
  // CATEGORY TOGGLE
  // ==================================================
  const allSelected = (tests) =>
    tests.every((t) => selectedTests.some((s) => getTestKey(s) === getTestKey(t)));

  const someSelected = (tests) =>
    tests.some((t) => selectedTests.some((s) => getTestKey(s) === getTestKey(t)));

  const toggleCategory = (tests) => {
    if (allSelected(tests)) {
      setSelectedTests((prev) =>
        prev.filter((t) => !tests.some((ct) => getTestKey(ct) === getTestKey(t)))
      );
    } else {
      setSelectedTests((prev) => {
        const missing = tests.filter(
          (t) => !prev.some((p) => getTestKey(p) === getTestKey(t))
        );
        return [...prev, ...missing];
      });
    }
  };

  // ==================================================
  // ADD NEW TEST
  // ==================================================
  const handleAddTest = async () => {
    if (!newTestName || !newTestCategory) {
      alert("Fill all fields");
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/lab-tests/add`, {
        name: newTestName,
        category: newTestCategory,
      });

      const saved = res.data;

      setLabTests((prev) => ({
        ...prev,
        [newTestCategory]: prev[newTestCategory]
          ? [...prev[newTestCategory], saved]
          : [saved],
      }));

      if (!allCategories.includes(newTestCategory)) {
        setAllCategories((prev) => [...prev, newTestCategory]);
      }

      setNewTestName("");
      setNewTestCategory("");
    } catch {
      alert("Error saving test");
    }
  };

  // ==================================================
  // SEARCH FILTER
  // ==================================================
  const filteredTests = Object.values(labTests)
    .flat()
    .filter((t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const updateScrollButtons = () => {
    const el = listRef.current;
    if (!el) {
      setCanScrollUp(false);
      setCanScrollDown(false);
      return;
    }

    setCanScrollUp(el.scrollTop > 16);
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 16);
  };

  useEffect(() => {
    updateScrollButtons();
  }, [labTests, searchTerm, loading]);

  const handleScroll = () => updateScrollButtons();

  const handleScrollBy = (offset) => {
    if (!listRef.current) return;
    listRef.current.scrollBy({ top: offset, behavior: "smooth" });
  };

  // ==================================================
  // RENDER
  // ==================================================
  return (
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      {/* SEARCH */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search lab tests..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Box>

      {/* ADD NEW TEST */}
      <Box sx={{ display: "flex", gap: 1, mb: 3, flexWrap: "wrap" }}>
        <TextField
          label="New Test Name"
          size="small"
          value={newTestName}
          onChange={(e) => setNewTestName(e.target.value)}
        />

        <TextField
          select
          label="Category"
          size="small"
          sx={{ minWidth: 180 }}
          value={newTestCategory}
          onChange={(e) => setNewTestCategory(e.target.value)}
        >
          {allCategories.map((cat) => (
            <MenuItem key={cat} value={cat}>
              {cat}
            </MenuItem>
          ))}
          <MenuItem value="Other">Other (New Category)</MenuItem>
        </TextField>

        <Button variant="contained" onClick={handleAddTest}>
          Add Test
        </Button>
      </Box>

      {loading && <Typography>Loading lab tests…</Typography>}

      <Box sx={{ position: "relative" }}>
        <Box
          ref={listRef}
          onScroll={handleScroll}
          sx={{
            maxHeight: 520,
            overflowY: "auto",
            pr: 1,
            mb: 1,
          }}
        >
          {/* SEARCH MODE */}
          {searchTerm ? (
            filteredTests.map((test) => (
              <FormControlLabel
                key={test.id}
                control={
                  <Checkbox
                    checked={selectedTests.some((t) => getTestKey(t) === getTestKey(test))}
                    onChange={() => toggleTest(test)}
                  />
                }
                label={`${test.name} (${test.category})`}
              />
            ))
          ) : (
            /* CATEGORY MODE */
            Object.entries(labTests).map(([category, tests]) => (
              <Box key={category} sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={allSelected(tests)}
                      indeterminate={someSelected(tests) && !allSelected(tests)}
                      onChange={() => toggleCategory(tests)}
                    />
                  }
                  label={
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {category}
                    </Typography>
                  }
                />

                <Divider sx={{ mb: 1 }} />

                <Grid container spacing={1}>
                  {tests.map((test) => (
                    <Grid item xs={12} md={4} key={test.id}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedTests.some(
                              (t) => getTestKey(t) === getTestKey(test)
                            )}
                            onChange={() => toggleTest(test)}
                          />
                        }
                        label={test.name}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ))
          )}
        </Box>

        {(canScrollUp || canScrollDown) && (
          <Box
            sx={{
              position: "absolute",
              right: 8,
              bottom: 8,
              display: "flex",
              flexDirection: "column",
              gap: 1,
              zIndex: 1,
            }}
          >
            <Tooltip title="Scroll up">
              <span>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleScrollBy(-320)}
                  disabled={!canScrollUp}
                >
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="Scroll down">
              <span>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleScrollBy(320)}
                  disabled={!canScrollDown}
                >
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default LabTestRequest;
