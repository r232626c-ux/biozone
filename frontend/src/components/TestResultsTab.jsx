import React, { useState, useMemo, useEffect } from "react";
import {
  Paper, Typography, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Box, Button, Select, MenuItem, FormControl, InputLabel
} from "@mui/material";
import axios from "axios";
import { API_URL } from "../utils/api";
import lab_reference from "../utils/lab_test_reference_data";
import { getReferenceRange, interpretLabTest, calculateLDL, calculateTSAT, calculateEGFR, calculateCrCl, calculateAnionGap } from "../utils/lab_interpretation";

const TestResultsTab = ({
  selectedTests = [],
  setSelectedTests = () => {},
  patient = {},
  selectedRequest: propSelectedRequest = null,
  setSelectedRequest: propSetSelectedRequest = () => {},
}) => {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(propSelectedRequest);

  const categories = Object.keys(lab_reference || {});

  // Sync selectedRequest when prop changes
  useEffect(() => {
    setSelectedRequest(propSelectedRequest);
    // Also add it to requests list if not already there
    if (propSelectedRequest && !requests.find(r => r.id === propSelectedRequest.id)) {
      setRequests(prev => [propSelectedRequest, ...prev]);
    }
  }, [propSelectedRequest]);

  const testsInCategory = useMemo(() => {
    const catName = categories[selectedCategory];
    return selectedTests.filter((t) => t.category === catName);
  }, [selectedCategory, selectedTests, categories]);

  const handleResultChange = (idx, value) => {
    const test = testsInCategory[idx];
    const updated = [...selectedTests];
    const realIndex = selectedTests.findIndex((t) => t.id === test.id);

    const referenceInfo = lab_reference[test.category]?.[test.name];

    let interpretation = interpretLabTest({
      testName: test.name,
      value,
      age: patient.age,
      sex: patient.sex,
      referenceInfo,
    });

    const resultsMap = {};
    updated.forEach((t) => {
      if (t.result && !isNaN(parseFloat(t.result))) resultsMap[t.name] = parseFloat(t.result);
    });

    switch (test.name) {
      case "Total Cholesterol":
        resultsMap[test.name] = parseFloat(value);
        break;
      case "HDL Cholesterol":
        resultsMap[test.name] = parseFloat(value);
        break;
      case "Triglycerides":
        resultsMap[test.name] = parseFloat(value);
        break;
      case "Creatinine":
        resultsMap[test.name] = parseFloat(value);
        const egfrValue = calculateEGFR(resultsMap["Creatinine"], patient.age, patient.sex);
        const egfrIndex = updated.findIndex(t => t.name === "eGFR");
        if (egfrIndex !== -1 && egfrValue !== null) {
          const egfrReference = lab_reference["Chemistry Tests"]?.["eGFR"];
          const egfrInterpretation = interpretLabTest({
            testName: "eGFR",
            value: egfrValue,
            age: patient.age,
            sex: patient.sex,
            referenceInfo: egfrReference,
          });
          updated[egfrIndex] = {
            ...updated[egfrIndex],
            result: egfrValue.toString(),
            flag: egfrInterpretation.flag || "",
            refRange:
              egfrInterpretation.refMin != null && egfrInterpretation.refMax != null
                ? `${egfrInterpretation.refMin} - ${egfrInterpretation.refMax}`
                : updated[egfrIndex].refRange || "",
          };
        }
        break;
      case "Serum Iron":
        resultsMap[test.name] = parseFloat(value);
        break;
      case "TIBC":
        resultsMap[test.name] = parseFloat(value);
        break;
      default:
        break;
    }

    // Calculate derived tests
    // LDL
    if (resultsMap["Total Cholesterol"] !== undefined && resultsMap["HDL Cholesterol"] !== undefined && resultsMap["Triglycerides"] !== undefined) {
      const ldlValue = calculateLDL(resultsMap["Total Cholesterol"], resultsMap["HDL Cholesterol"], resultsMap["Triglycerides"]);
      if (ldlValue !== null) {
        const ldlIndex = updated.findIndex(t => t.name === "LDL Cholesterol");
        if (ldlIndex !== -1) {
          const ldlReference = lab_reference["Chemistry Tests"]?.["LDL Cholesterol"];
          const ldlInterpretation = interpretLabTest({
            testName: "LDL Cholesterol",
            value: ldlValue,
            age: patient.age,
            sex: patient.sex,
            referenceInfo: ldlReference,
          });
          updated[ldlIndex] = {
            ...updated[ldlIndex],
            result: ldlValue.toString(),
            flag: ldlInterpretation.flag || "",
            refRange:
              ldlInterpretation.refMin != null && ldlInterpretation.refMax != null
                ? `${ldlInterpretation.refMin} - ${ldlInterpretation.refMax}`
                : updated[ldlIndex].refRange || "",
          };
        }
      }
    }

    // TSAT
    if (resultsMap["Serum Iron"] !== undefined && resultsMap["TIBC"] !== undefined) {
      const tsatValue = calculateTSAT(resultsMap["Serum Iron"], resultsMap["TIBC"]);
      if (tsatValue !== null) {
        const tsatIndex = updated.findIndex(t => t.name === "Transferrin Saturation");
        if (tsatIndex !== -1) {
          const tsatReference = lab_reference["Iron Studies"]?.["Transferrin Saturation"];
          const tsatInterpretation = interpretLabTest({
            testName: "Transferrin Saturation",
            value: tsatValue,
            age: patient.age,
            sex: patient.sex,
            referenceInfo: tsatReference,
          });
          updated[tsatIndex] = {
            ...updated[tsatIndex],
            result: tsatValue.toString(),
            flag: tsatInterpretation.flag || "",
            refRange:
              tsatInterpretation.refMin != null && tsatInterpretation.refMax != null
                ? `${tsatInterpretation.refMin} - ${tsatInterpretation.refMax}`
                : updated[tsatIndex].refRange || "",
          };
        }
      }
    }

    updated[realIndex] = {
      ...updated[realIndex],
      result: value,
      flag: interpretation.flag || "",
      refRange:
        interpretation.refMin != null && interpretation.refMax != null
          ? `${interpretation.refMin} - ${interpretation.refMax}`
          : updated[realIndex].refRange || "",
      unit: referenceInfo?.unit || updated[realIndex].unit || "",
      comment: referenceInfo?.comment || updated[realIndex].comment || "",
    };

    setSelectedTests(updated);
  };

  const handleUnitChange = (idx, value) => {
    const test = testsInCategory[idx];
    const updated = [...selectedTests];
    const realIndex = selectedTests.findIndex((t) => t.id === test.id);

    updated[realIndex] = {
      ...updated[realIndex],
      unit: value,
    };

    setSelectedTests(updated);
  };

  const handleCommentChange = (idx, value) => {
    const test = testsInCategory[idx];
    const updated = [...selectedTests];
    const realIndex = selectedTests.findIndex((t) => t.id === test.id);

    updated[realIndex] = {
      ...updated[realIndex],
      comment: value,
    };

    setSelectedTests(updated);
  };

  const handleSave = async () => {
    console.log("🔍 handleSave called. selectedRequest:", selectedRequest);
    console.log("🔍 selectedTests count:", selectedTests.length);
    console.log("🔍 selectedTests:", selectedTests);

    if (!selectedRequest) {
      alert("❌ No request selected");
      return;
    }

    if (!selectedTests || selectedTests.length === 0) {
      alert("❌ No tests selected for this request");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Use patient_id from selectedRequest or patient prop
      const patient_id = selectedRequest.patient_id || patient.patientId;
      
      console.log("🔍 patient_id:", patient_id);

      if (!patient_id) {
        alert("❌ Patient ID not found in request");
        return;
      }

      // Save ALL tests, not just those with results - this allows for empty/null results
      const payloads = selectedTests.map((test) => ({
        patient_id,
        lab_request_id: selectedRequest.id,
        lab_test_id: test.id,
        test_name: test.name,
        results: test.result || "",
        unit: test.unit || "",
        ref_range: test.refRange || "",
        flag: test.flag || "",
        comment: test.comment || "",
      }));

      console.log("🔍 Saving payloads:", payloads);
      console.log("📤 POSTing to /lab-results/save...");

      await Promise.all(
        payloads.map((p) => 
          axios.post(`${API_URL}/lab-results/save`, p, { headers })
            .catch(err => {
              console.error("❌ Failed to save test:", p.test_name, err);
              throw err;
            })
        )
      );

      console.log("✅ All results saved, updating request status...");
      
      await axios.patch(`${API_URL}/lab-requests/${selectedRequest.id}`, { status: "Completed" }, { headers });

      console.log("✅ Request status updated to Completed");

      const updated = { ...selectedRequest, status: "Completed" };
      setSelectedRequest(updated);
      propSetSelectedRequest(updated);

      alert("✅ Results saved successfully!");
    } catch (err) {
      console.error("❌ Save error:", err);
      console.error("Error response:", err.response?.data);
      alert("❌ Failed to save results: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleReset = async () => {
    if (!selectedRequest) {
      alert("No request selected");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get(`${API_URL}/lab-results/request/${selectedRequest.id}`, { headers });
      const results = response.data || [];

      const updated = selectedTests.map((test) => {
        const savedResult = results.find((r) => r.lab_test_id === test.id);
        return {
          ...test,
          result: savedResult?.results || "",
          unit: savedResult?.unit || "",
          flag: savedResult?.flag || "",
          comment: savedResult?.comment || "",
        };
      });

      setSelectedTests(updated);
      alert("Results loaded successfully");
    } catch (err) {
      console.error("Load error:", err);
      alert("Failed to load results: " + (err.response?.data?.detail || err.message));
    }
  };

  // Fetch lab requests when patient changes (only if no selectedRequest prop provided)
  useEffect(() => {
    // If parent provided a selectedRequest, don't fetch - just use what we have
    if (propSelectedRequest) {
      return;
    }

    // Otherwise, fetch requests for this patient
    const fetchRequests = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${API_URL}/lab-requests/`, {
          headers,
        });
        const items = Array.isArray(res.data) ? res.data : [];
        setRequests(items);
        const pending = items.find((r) => r.status === "Pending");
        const pick = pending || items[0] || null;
        setSelectedRequest(pick);
        propSetSelectedRequest(pick);
      } catch (err) {
        console.error("Failed to fetch lab requests", err);
      }
    };
    fetchRequests();
  }, [propSelectedRequest]);

  return (
    <Box sx={{ p: 2 }}>
      <FormControl size="small" sx={{ minWidth: 320, mb: 2 }}>
        <InputLabel id="request-select-label">Select Request</InputLabel>
        <Select
          labelId="request-select-label"
          value={selectedRequest?.id || ""}
          label="Select Request"
          onChange={(e) => {
            const id = e.target.value;
            const r = requests.find((x) => x.id === id) || null;
            setSelectedRequest(r);
            propSetSelectedRequest(r);
          }}
        >
          {requests.length === 0 ? (
            <MenuItem value="">No requests available</MenuItem>
          ) : (
            requests.map((r) => (
              <MenuItem key={r.id} value={r.id}>
                {`#${r.id} — ${r.status} — ${r.created_at?.split("T")[0]}`}
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>

      <Tabs value={selectedCategory} onChange={(_, v) => setSelectedCategory(v)}>
        {categories.map((cat, idx) => (
          <Tab key={idx} label={cat} />
        ))}
      </Tabs>

      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f0f0f0" }}>
              <TableCell>Test Name</TableCell>
              <TableCell>Result</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Ref Range</TableCell>
              <TableCell>Flag</TableCell>
              <TableCell>Comment</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {testsInCategory.map((test, idx) => (
              <TableRow key={test.id}>
                <TableCell>{test.name}</TableCell>
                <TableCell>
                  {(() => {
                    const typeString = `${test.category || ""} ${test.name || ""}`;
                    const isDrugDropdown =
                      test.subTab === "drugs" || /drug|sensitivity|sti|hpv/i.test(typeString);
                    return isDrugDropdown ? (
                      <FormControl fullWidth size="small">
                        <Select
                          value={test.result || ""}
                          onChange={(e) => handleResultChange(idx, e.target.value)}
                          displayEmpty
                        >
                          <MenuItem value="">Select</MenuItem>
                          <MenuItem value="Sensitive">Sensitive</MenuItem>
                          <MenuItem value="Intermediate">Intermediate</MenuItem>
                          <MenuItem value="Resistant">Resistant</MenuItem>
                        </Select>
                      </FormControl>
                    ) : (
                      <TextField
                        size="small"
                        value={test.result || ""}
                        onChange={(e) => handleResultChange(idx, e.target.value)}
                        variant="outlined"
                      />
                    );
                  })()}
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={test.unit || ""}
                    onChange={(e) => handleUnitChange(idx, e.target.value)}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{test.refRange || "—"}</TableCell>
                <TableCell>{test.flag || "—"}</TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={test.comment || ""}
                    onChange={(e) => handleCommentChange(idx, e.target.value)}
                    variant="outlined"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 2 }}>
        {!selectedRequest && (
          <Typography variant="caption" color="error" sx={{ ml: 1 }}>
            ⚠️ Please select a request first, or use the main Save button in the toolbar
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default TestResultsTab;
