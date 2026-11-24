import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  TextField,
  MenuItem,
  Divider,
  FormControlLabel,
  Checkbox,
  Select,
  InputLabel,
  FormControl,
  Button,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CircularProgress,
  Stack,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import VerifiedIcon from "@mui/icons-material/Verified";
import dayjs from "dayjs";
import axios from "axios";
import { useLocation } from "react-router-dom";

import { API_URL } from "../utils/api";
import { lab_reference } from "../data/lab_test_reference_data";
import LabTestRequest from "../components/NewRequest/LabTestRequest";
import RequestToolbar from "../components/NewRequest/RequestToolbar";
import TestResultsTab from "../components/NewRequest/TestResultsTab";
import ViewResults from "../components/NewRequest/ViewResults";

const initialPatient = {
  lastName: "",
  firstName: "",
  dob: "",
  gender: "",
  phone: "",
  email: "",
  address: "",
  funding: "CASH (ZWL)",
  memberNumber: "",
  memberSuffix: "",
  relationship: "Self",
  principal: true,
  facility: "",
  doctorName: "",
  ahFoz: "",
  clinicalData: "",
};

const NewRequestPage = () => {
  const location = useLocation();
  const navigationState = location.state;
  const [patient, setPatient] = useState({ ...initialPatient });
  const [tab, setTab] = useState(0);
  const [selectedTests, setSelectedTests] = useState([]);
  const [requestId, setRequestId] = useState(null);
  const [requestRef, setRequestRef] = useState(null);
  const [patientId, setPatientId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sampleDate, setSampleDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [labResults, setLabResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMatches, setSearchMatches] = useState([]);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    const restoreState = async () => {
      try {
        const savedPatient = localStorage.getItem("newRequest_patient");
        const savedTests = localStorage.getItem("newRequest_selectedTests");
        const savedRequestId = localStorage.getItem("newRequest_requestId");
        const savedRequestRef = localStorage.getItem("newRequest_requestRef");
        const savedPatientId = localStorage.getItem("newRequest_patientId");
        const savedSelectedRequest = localStorage.getItem("newRequest_selectedRequest");
        const savedSampleDate = localStorage.getItem("newRequest_sampleDate");
        const isNavigationEdit = navigationState?.mode === "edit";

        if (isNavigationEdit) {
          setPatient({ ...initialPatient });
          setRequestId(null);
          setRequestRef(null);
          setPatientId(navigationState.patientId ?? null);
          setSelectedTests([]);
          setSelectedRequest(null);
          setLabResults([]);
          setSampleDate(dayjs().format("YYYY-MM-DD"));
        } else {
          if (savedPatient) setPatient(JSON.parse(savedPatient));
          if (savedTests) setSelectedTests(normalizeSelectedTests(JSON.parse(savedTests)));
          if (savedRequestRef) setRequestRef(JSON.parse(savedRequestRef));
          if (savedPatientId) setPatientId(JSON.parse(savedPatientId));
          if (savedSelectedRequest) setSelectedRequest(JSON.parse(savedSelectedRequest));
          if (savedSampleDate) setSampleDate(JSON.parse(savedSampleDate));
        }

        const token = localStorage.getItem("token");
        if (!token) return;
        const headers = { Authorization: `Bearer ${token}` };

        const patientIdValue = isNavigationEdit
          ? navigationState.patientId ?? null
          : savedPatientId
            ? JSON.parse(savedPatientId)
            : null;
        const editedRequest =
          !isNavigationEdit && savedSelectedRequest
            ? JSON.parse(savedSelectedRequest)
            : null;
        const requestIdValue =
          navigationState?.requestId ??
          editedRequest?.id ??
          (savedRequestId ? JSON.parse(savedRequestId) : null);
        const parsedRequestId = requestIdValue != null ? Number(requestIdValue) : null;
        const validRequestId = Number.isInteger(parsedRequestId) ? parsedRequestId : null;

        if (patientIdValue) {
          try {
            const patientRes = await axios.get(
              `${API_URL}/patients/${patientIdValue}`,
              { headers }
            );
            const patientItem = patientRes.data;
            setPatient({
              lastName: patientItem.last_name ?? "",
              firstName: patientItem.first_name ?? "",
              dob: patientItem.dob ?? "",
              gender: patientItem.gender ?? "",
              phone: patientItem.phone ?? "",
              email: patientItem.email ?? "",
              address: patientItem.address ?? "",
              funding: patientItem.funding ?? "CASH (ZWL)",
              memberNumber: patientItem.member_number ?? "",
              memberSuffix: patientItem.member_suffix ?? "",
              relationship: patientItem.relationship ?? "Self",
              principal: patientItem.principal ?? true,
              facility: patientItem.facility ?? "",
              doctorName: patientItem.doctor_name ?? "",
              ahFoz: patientItem.ah_foz ?? "",
              clinicalData: patientItem.clinical_data ?? "",
            });
          } catch (err) {
            console.warn("Could not load patient record", err);
          }
        }

        if (validRequestId) {
          try {
            const labReqRes = await axios.get(
              `${API_URL}/lab-requests/${validRequestId}`,
              { headers }
            );
            const labRequest = labReqRes.data;
            setRequestId(labRequest.id);
            setSelectedRequest({ id: labRequest.id, patient_id: labRequest.patient?.id ?? patientIdValue });
            if (labRequest.sample_date) setSampleDate(labRequest.sample_date);

            const labResultsRes = await axios.get(
              `${API_URL}/lab-requests/${validRequestId}/results/`,
              { headers }
            );
            const results = Array.isArray(labResultsRes.data) ? labResultsRes.data : [];
            setLabResults(results);

            const savedSelReq =
              !isNavigationEdit && savedSelectedRequest
                ? JSON.parse(savedSelectedRequest)
                : null;
            const savedTestsArray = savedTests ? normalizeSelectedTests(JSON.parse(savedTests)) : null;
            const sameRequestPersisted =
              !isNavigationEdit &&
              savedSelReq &&
              savedSelReq.id === validRequestId &&
              Array.isArray(savedTestsArray);

            if (sameRequestPersisted) {
              setSelectedTests(savedTestsArray);
              setTab(results.length > 0 ? 2 : 1);
            } else if (results.length > 0) {
              const loadedTests = results.map((r) => ({
                id: r.lab_test_id ?? r.id,
                name: r.test_name,
                category: getTestCategory(r.test_name),
                result: r.results || r.test_result || r.result || "",
                unit: r.unit || r.test_unit || "",
                refRange: r.ref_range || r.refRange || "",
                flag: r.flag || "",
                comment: r.comment || "",
              }));

              // 🔧 FIX: If any FBC test is present, ensure Monocytes and Monocytes (%) are included
              const hasFBCTest = loadedTests.some((t) => t.category === "Full Blood Count (FBC)");
              
              let testsToSet = loadedTests;

              if (hasFBCTest) {
                const normalizedLoaded = new Set(
                  loadedTests.map((t) =>
                    String(t.name || "").toLowerCase().replace(/\s+/g, "").replace(/[()%]/g, "")
                  )
                );

                // Ensure these critical FBC tests are present
                const missingFBC = [];
                const criticalFBCTests = [
                  { name: "Monocytes (%)", id: 999901 },
                  { name: "Monocytes", id: 999902 },
                ];

                criticalFBCTests.forEach((fbcTest) => {
                  const normKey = String(fbcTest.name)
                    .toLowerCase()
                    .replace(/\s+/g, "")
                    .replace(/[()%]/g, "");
                  if (!normalizedLoaded.has(normKey)) {
                    missingFBC.push({
                      ...fbcTest,
                      category: "Full Blood Count (FBC)",
                      result: "",
                      unit: "",
                      refRange: "",
                      flag: "",
                      comment: "",
                    });
                  }
                });

                testsToSet = [...loadedTests, ...missingFBC];
              }

              setSelectedTests(normalizeSelectedTests(testsToSet));
              setTab(2);
            } else if (!isNavigationEdit && savedTestsArray) {
              setSelectedTests(savedTestsArray);
              setTab(1);
            }
          } catch (err) {
            console.warn("Could not load lab request for edit", err);
          }
        } else if (requestIdValue) {
          // Preserve legacy request reference labels without treating them as backend IDs.
          setRequestRef(String(requestIdValue));
        }
      } catch (err) {
        console.warn("Could not restore saved request state", err);
      }
    };

    restoreState();
  }, [navigationState]);

  useEffect(() => {
    try {
      localStorage.setItem("newRequest_patient", JSON.stringify(patient));
      localStorage.setItem("newRequest_selectedTests", JSON.stringify(selectedTests));
      localStorage.setItem("newRequest_requestId", JSON.stringify(requestId));
      localStorage.setItem("newRequest_requestRef", JSON.stringify(requestRef));
      localStorage.setItem("newRequest_patientId", JSON.stringify(patientId));
      localStorage.setItem("newRequest_selectedRequest", JSON.stringify(selectedRequest));
      localStorage.setItem("newRequest_sampleDate", JSON.stringify(sampleDate));
    } catch (err) {
      console.warn("Could not persist request state", err);
    }
  }, [patient, selectedTests, requestId, requestRef, patientId, sampleDate, selectedRequest]);

  // Periodic auto-save every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const shouldSave = hasPatientFormData() || selectedTests.length > 0;
      if (shouldSave && !saving) {
        handleSave({ auto: true }).catch(err => console.error("Periodic auto-save failed:", err));
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [patient, selectedTests, saving]);

  const normalizeTestName = (name) => {
    if (typeof name === "string") return name.trim();
    if (name === null || name === undefined) return "";
    return String(name).trim();
  };

  // Helper function to find category for a test name
  const getTestCategory = (testName) => {
    const normalizedName = normalizeTestName(testName);
    if (!normalizedName) return "Other";

    // Normalize a key for loose matching: strip spaces, parentheses, percent signs
    const normKey = (s) => String(s || "").toLowerCase().replace(/\s+/g, "").replace(/[()%]/g, "");

    const target = normKey(normalizedName);
    
    for (const [category, tests] of Object.entries(lab_reference)) {
      for (const key of Object.keys(tests)) {
        if (normKey(key) === target) {
          return category;
        }
      }
    }

    return "Other"; // Default fallback
  };

  const FBC_ORDER = [
    "WBC",
    "RBC",
    "HB",
    "HCT",
    "MCV",
    "MCH",
    "MCHC",
    "RDW",
    "Platelets",
    "Neutrophils (%)",
    "Lymphocytes (%)",
    "Monocytes (%)",
    "Neutrophils",
    "Monocytes",
    "Lymphocytes",
  ];

  const normalizeSelectedTests = (tests) => {
    if (!Array.isArray(tests)) return [];

    const uniqueTests = [];
    const seen = new Set();

    tests.forEach((test) => {
      const normalizedName = normalizeTestName(test.name);
      const currentCategory = test.category && lab_reference[test.category]?.[normalizedName]
        ? test.category
        : getTestCategory(normalizedName);
      const key = `${currentCategory}::${normalizedName}::${test.subTab || ""}`;

      if (!seen.has(key)) {
        seen.add(key);
        uniqueTests.push({
          ...test,
          name: normalizedName,
          category: currentCategory || "Other",
        });
      }
    });

    const reordered = uniqueTests.map((test) => ({ ...test }));
    const fbcTests = reordered.filter((test) => test.category === "Full Blood Count (FBC)");

    if (fbcTests.length > 0) {
      const sortedFbc = fbcTests.slice().sort((a, b) => {
        const aIndex = FBC_ORDER.indexOf(a.name);
        const bIndex = FBC_ORDER.indexOf(b.name);
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });

      let fbcIndex = 0;
      return reordered.map((test) =>
        test.category === "Full Blood Count (FBC)" ? sortedFbc[fbcIndex++] : test
      );
    }

    return reordered;
  };

  const age = useMemo(
    () => (patient.dob ? dayjs().diff(dayjs(patient.dob), "year") : ""),
    [patient.dob]
  );

  const fundingOptions = [
      "Agrimed",
      "Alliance Health Options,Multimed,Select RTGS",
      "Alliance Health Options,Multimed,Select USD",
      "Alliance Health Super Select RTGS",
      "Bonvie Bonvie Art",
      "Bonvie Comarton Fund RTGS",
      "Bonvie Medical Aid Scheme RTGS",
      "Bonvie Nyaradzo Fund RTGS",
      "Bonvie Platinum USD",
      "BUPA",
      "Calm Health Int.",
      "CASH (ZWL)",
      "Cash - USD",
      "CELLMED CONVENTIONAL RTGS",
      "Cellmed CMED RTGS",
      "Cellmed Diaspora Plan USD",
      "Cellmed Premium USD",
      "Cellmed Premium ZWL",
      "Cellmed Zesa Group Medical Fund",
      "Cellmed Zimplats RTGS",
      "Cellmed Zimplats USD",
      "CIGNA",
      "CIMAS Healthguard USD",
      "CIMAS HIT RTGS",
      "CIMAS MAIN RTGS",
      "CIMAS MSU RTGS",
      "CIMAS RIOZIM RTGS",
      "CIMAS TONGAAT HULETT USD",
      "CIMAS Triangle RTGS",
      "CIMAS UZ RTGS",
      "Corporate24",
      "CREDIT",
      "DISCOUNT",
      "EMERALD MEDICAL AID",
      "EMF Medical Aid",
      "Engineering Medical Aid Fund (EMAF) RTGS",
      "FBC USD",
      "Fbc Health Insurance RTGS",
      "FLIMAS (Fidelity Life) RTGS",
      "FLIMAS (Fidelity Life) USD",
      "FML/FMMSF (First Mutual) RTGS",
      "FMH Gold Indexed Insurer RTGS",
      "FMH Gold RTGS",
      "FMH Gold USD",
      "FMH Micromed RTGS",
      "FMH Pearl Executive Gold USD",
      "FMH Pearl Gold USD",
      "FMH Silver RTGS",
      "FREE",
      "GAMAS",
      "Generation Health RTGS",
      "Generation Health USD",
      "Global Health RTGS",
      "Hamilton Insurance",
      "Health International",
      "Healthcare Benefits Consulting RTGS",
      "Healthcare Benefits Consulting USD",
      "Henner",
      "Heritage Health Fund",
      "HMMAS",
      "Liberty",
      "MAISHA HEALTH FUND INDEXED RTGS",
      "MAISHA HEALTH FUND MAIN RTGS",
      "MAISHA HEALTH FUND RTGS",
      "MAISHA HEALTH FUND USD FUNDS",
      "MAISHA HEALTH FUND USD PURE",
      "masca rtgs",
      "MEDICITY",
      "Minerva",
      "National Social Security Authority (NSSA)",
      "Northern, Northern Alliance RTGS",
      "Northern, Northern Alliance USD",
      "Old Mutual",
      "Pro-Health",
      "PSMAS",
      "Railmed",
      "Steward Medical Funds",
      "SureMed",
      "UZ-UCSF",
      "Varimed",
      "ZiG (Zim Gold)",
      "ZimPapers",
    ];

  const handleLogout = async () => {
    console.log("🚪 Logout initiated");
    // Auto-save before logout if there's data
    const shouldSave = hasPatientFormData() || selectedTests.length > 0;
    console.log("💾 Logout save check:", shouldSave, "hasData:", hasPatientFormData(), "tests:", selectedTests.length);
    if (shouldSave) {
      try {
        await handleSave({ auto: true });
      } catch (err) {
        console.error("Auto-save on logout failed:", err);
        // Still proceed with logout even if save fails
      }
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Clear the persisted state as well
    localStorage.removeItem("newRequest_patient");
    localStorage.removeItem("newRequest_selectedTests");
    localStorage.removeItem("newRequest_requestId");
    localStorage.removeItem("newRequest_patientId");
    localStorage.removeItem("newRequest_sampleDate");
    window.location.href = "/login";
  };

  const hasPatientFormData = () => {
    const values = [
      patient.firstName,
      patient.lastName,
      patient.dob,
      patient.gender,
      patient.phone,
      patient.email,
      patient.address,
      patient.facility,
      patient.memberNumber,
      patient.memberSuffix,
      patient.doctorName,
      patient.ahFoz,
      patient.clinicalData,
    ];
    return values.some((value) => value && String(value).trim() !== "");
  };

  const handleTabChange = async (event, newTab) => {
    if (tab !== newTab) {
      const shouldSave = hasPatientFormData() || selectedTests.length > 0;
      if (shouldSave) {
        await handleSave({ auto: true });
      }
    }
    setTab(newTab);
  };

  const handlePatientChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPatient((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNewRequest = () => {
    if (!patientId) {
      setPatient({ ...initialPatient });
    }
    setSelectedTests([]);
    setRequestId(null);
    setRequestRef(null);
    setSelectedRequest(null);
    setLabResults([]);
    setSampleDate(dayjs().format("YYYY-MM-DD"));
    setTab(1);

    // Clear any previous request editing state immediately,
    // while preserving the current patient info.
    localStorage.setItem("newRequest_selectedTests", JSON.stringify([]));
    localStorage.removeItem("newRequest_requestId");
    localStorage.removeItem("newRequest_requestRef");
    localStorage.removeItem("newRequest_selectedRequest");
    localStorage.setItem("newRequest_sampleDate", JSON.stringify(dayjs().format("YYYY-MM-DD")));
  };

  const handleNewPatient = () => {
    setPatient({ ...initialPatient });
    setPatientId(null);
    setRequestId(null);
    setRequestRef(null);
    setSelectedRequest(null);
    setSelectedTests([]);
    setLabResults([]);
    setSampleDate(dayjs().format("YYYY-MM-DD"));
    setSearchQuery("");
    setTab(0);
    localStorage.setItem("newRequest_selectedTests", JSON.stringify([]));
    localStorage.removeItem("newRequest_requestId");
    localStorage.removeItem("newRequest_requestRef");
    localStorage.removeItem("newRequest_patientId");
    localStorage.removeItem("newRequest_selectedRequest");
    localStorage.setItem("newRequest_sampleDate", JSON.stringify(dayjs().format("YYYY-MM-DD")));
    setSnack({ open: true, message: "Enter new patient details and select tests", severity: "info" });
  };

  const handleSave = async ({ auto = false } = {}) => {
    console.log("🔄 handleSave called, auto:", auto, "selectedTests:", selectedTests.length, "hasData:", hasPatientFormData());
    if (!patient.firstName || !patient.lastName) {
      return setSnack({ open: true, message: "Please enter patient first and last name", severity: "warning" });
    }

    setSaving(true);
    let saveStats = { patientSaved: false, requestSaved: false, resultsSaved: 0 };

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const headers = { Authorization: `Bearer ${token}` };
      let patient_id = patientId;

      // Only a patient explicitly selected from Search may reuse an existing record.
      if (!patient_id) {
        console.log("➕ Creating new patient...");
        const patientRes = await axios.post(
          `${API_URL}/patients/`,
          {
            first_name: patient.firstName,
            last_name: patient.lastName,
            dob: patient.dob || null,
            gender: patient.gender || null,
            phone: patient.phone || null,
            email: patient.email || null,
            address: patient.address || null,
            facility: patient.facility || null,
            funding: patient.funding || null,
            member_number: patient.memberNumber || null,
            member_suffix: patient.memberSuffix || null,
            relationship: patient.relationship || null,
            principal: patient.principal ?? true,
            doctor_name: patient.doctorName || null,
            ah_foz: patient.ahFoz || null,
            clinical_data: patient.clinicalData || null,
          },
          { headers }
        );
        patient_id = patientRes.data.id;
        saveStats.patientSaved = true;
        console.log("✅ New patient created with ID:", patient_id);
      }

      if (!patient_id) {
        throw new Error("Unable to determine patient ID for saving");
      }

      setPatientId(patient_id);

      let lab_request_id = requestId;
      let createdNewRequest = false;
      let testsToSave = [];

      if (selectedTests.length > 0) {
        // 3️⃣ Ensure there is a lab request for this patient
        if (lab_request_id) {
          // Use the current request ID explicitly when editing an existing request.
          console.log("📋 Using current request ID:", lab_request_id);
          try {
            await axios.patch(
              `${API_URL}/lab-requests/${lab_request_id}`,
              {
                lab_test_ids: selectedTests.map((t) => Number(t.id)),
              },
              { headers }
            );
            console.log("✅ Updated existing lab request with selected tests");
            saveStats.requestSaved = true;
          } catch (patchErr) {
            console.warn("⚠️ Lab request patch failed, will proceed:", patchErr.response?.data || patchErr.message);
          }
        } else {
          console.log("➕ Creating new lab request...");
          const requestRes = await axios.post(
            `${API_URL}/lab-requests/`,
            {
              patient_id,
              lab_test_ids: selectedTests.map((t) => Number(t.id)),
            },
            { headers }
          );
          lab_request_id = requestRes.data.id;
          createdNewRequest = true;
          console.log("✅ Created new lab request with ID:", lab_request_id);
          saveStats.requestSaved = true;
        }

        setRequestId(lab_request_id);
        setSelectedRequest((prev) => prev?.id === lab_request_id ? prev : { id: lab_request_id, patient_id });

        // 4️⃣ Save lab results - different behavior for auto vs manual save
        if (auto) {
          // For auto-save: save ALL selected tests (even empty ones) so they appear in other tabs
          testsToSave = selectedTests;
          console.log("💾 Auto-saving lab results for ALL", testsToSave.length, "selected tests");
        } else if (createdNewRequest) {
          // If we just created a new lab request, persist all selected tests as blank results
          // so the test selection is preserved when editing the request later.
          testsToSave = selectedTests;
          console.log("💾 Saving blank lab results for new request for", testsToSave.length, "selected tests");
        } else {
          // For manual save of an existing request: only save tests with actual data
          testsToSave = selectedTests.filter((test) => test.result || test.comment);
          console.log("💾 Manual saving lab results for", testsToSave.length, "tests with data (out of", selectedTests.length, ")");
        }

        if (testsToSave.length > 0) {
          try {
            await Promise.all(
              testsToSave.map((test) => {
                console.log("📤 Saving test:", test.name, "result:", test.result, "auto:", auto);
                return axios.post(
                  `${API_URL}/lab-results/`,
                  {
                    patient_id,
                    lab_request_id,
                    lab_test_id: Number(test.id),
                    test_name: test.name,
                    results: String(test.result ?? ""),
                    unit: test.unit ?? "",
                    ref_range: test.refRange ?? "",
                    flag: test.flag ?? "",
                    comment: test.comment ?? "",
                  },
                  { headers }
                );
              })
            );
            saveStats.resultsSaved = testsToSave.length;
            console.log("✅ Lab results saved successfully:", saveStats.resultsSaved, "tests");
          } catch (err) {
            console.error("❌ Failed to save lab results:", err.response?.data || err.message);
            throw err; // Re-throw to be caught by outer try-catch
          }
        } else {
          console.log("⚠️ No tests with data to save (for manual save mode)");
        }
      } else {
        console.log("ℹ️ No tests selected - patient-only save");
      }

      // Show comprehensive success message
      const hasMeaningfulData = hasPatientFormData() || (auto ? selectedTests.length > 0 : testsToSave?.length > 0);
      if (hasMeaningfulData) {
        const details = [];
        if (saveStats.patientSaved) details.push("Patient ✓");
        if (saveStats.requestSaved) details.push("Lab Request ✓");
        if (saveStats.resultsSaved > 0) details.push(`Results: ${saveStats.resultsSaved} ✓`);
        
        const message = details.length > 0 
          ? `Saved: ${details.join(" | ")}` 
          : (auto ? "Automatically saved ✅" : "Saved successfully ✅");
        
        console.log("📢 Save complete:", message);
        setSnack({
          open: true,
          message: message,
          severity: "success",
        });
      }
    } catch (err) {
      console.error("❌ SAVE ERROR:", err.response?.data || err.message);
      console.error("Save stats:", saveStats);
      setSnack({ open: true, message: `Save failed ❌: ${err.response?.data?.detail || err.message}`, severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = async () => {
    const safeQuery = searchQuery.trim();
    if (!safeQuery) {
      setSnack({ open: true, message: "Enter a name to search", severity: "warning" });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setSnack({ open: true, message: "Not authenticated. Please login.", severity: "error" });
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };

      setSearching(true);
      const patientRes = await axios.get(`${API_URL}/patients/search/`, {
        params: { query: safeQuery },
        headers,
      });

      if (!Array.isArray(patientRes.data) || patientRes.data.length === 0) {
        setSnack({ open: true, message: "Patient not found — you can create a new one", severity: "info" });
        return;
      }

      setSearchMatches(patientRes.data);
      setSearchDialogOpen(true);
    } catch (error) {
      console.error("❌ Search failed:", error);
      console.error("Response data:", error.response?.data);
      console.error("Response status:", error.response?.status);
      console.error("Error message:", error.message);

      // Provide specific error messages based on response
      let errorMsg = "Failed to retrieve patient data";
      if (error.response?.status === 401) {
        errorMsg = "Authentication failed. Please login again.";
      } else if (error.response?.status === 422) {
        errorMsg = "Invalid search query. Please enter a valid name.";
      } else if (error.response?.data?.detail) {
        errorMsg = `Search error: ${error.response.data.detail}`;
      }

      setSnack({ open: true, message: errorMsg, severity: "error" });
    } finally {
      setSearching(false);
    }
  };

  const handleSelectPatientVisit = async (patientItem, visit = null) => {
    setLoadingPatient(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated. Please login.");
      const headers = { Authorization: `Bearer ${token}` };

      setPatient({
        lastName: patientItem.last_name ?? "",
        firstName: patientItem.first_name ?? "",
        dob: patientItem.dob ?? "",
        gender: patientItem.gender ?? "",
        phone: patientItem.phone ?? "",
        email: patientItem.email ?? "",
        address: patientItem.address ?? "",
        funding: patientItem.funding ?? "CASH (ZWL)",
        memberNumber: patientItem.member_number ?? "",
        memberSuffix: patientItem.member_suffix ?? "",
        relationship: patientItem.relationship ?? "Self",
        principal: patientItem.principal ?? true,
        facility: patientItem.facility ?? "",
        doctorName: patientItem.doctor_name ?? "",
        ahFoz: patientItem.ah_foz ?? "",
        clinicalData: patientItem.clinical_data ?? "",
      });
      setPatientId(patientItem.id);
      setRequestRef(null);
      setLabResults([]);
      setSelectedTests([]);

      if (!visit) {
        setRequestId(null);
        setSelectedRequest(null);
        setSampleDate(dayjs().format("YYYY-MM-DD"));
        setTab(0);
        setSearchDialogOpen(false);
        setSnack({
          open: true,
          message: `Patient selected: ${patientItem.first_name} ${patientItem.last_name}`,
          severity: "success",
        });
        return;
      }

      const requestIdValue = Number(visit.id);
      if (!Number.isInteger(requestIdValue)) {
        throw new Error("The selected visit has an invalid request ID.");
      }

      setRequestId(requestIdValue);
      setSelectedRequest({ ...visit, id: requestIdValue, patient_id: patientItem.id });
      setSampleDate(
        visit.sample_date ?? visit.created_at?.slice(0, 10) ?? dayjs().format("YYYY-MM-DD")
      );

      const resultsResponse = await axios.get(
        `${API_URL}/lab-requests/${requestIdValue}/results/`,
        { headers }
      );
      const results = Array.isArray(resultsResponse.data) ? resultsResponse.data : [];
      setLabResults(results);

      const savedSelectedRequestRaw = localStorage.getItem("newRequest_selectedRequest");
      const savedSelectedTestsRaw = localStorage.getItem("newRequest_selectedTests");
      const savedSelectedRequest = savedSelectedRequestRaw
        ? JSON.parse(savedSelectedRequestRaw)
        : null;
      const savedTests = savedSelectedTestsRaw
        ? normalizeSelectedTests(JSON.parse(savedSelectedTestsRaw))
        : [];
      const usePersistedSelection =
        savedSelectedRequest?.id === requestIdValue &&
        Array.isArray(savedTests) &&
        savedTests.length > 0;

      if (usePersistedSelection) {
        setSelectedTests(savedTests);
        setTab(results.length > 0 ? 2 : 1);
      } else if (results.length > 0) {
        const loadedTests = results.map((result) => {
          const name = normalizeTestName(result.test_name);
          return {
            id: result.lab_test_id ?? result.id,
            name,
            category: getTestCategory(name),
            result: result.results ?? result.test_result ?? result.result ?? "",
            unit: result.unit ?? result.test_unit ?? "",
            refRange: result.ref_range ?? result.refRange ?? "",
            flag: result.flag ?? "",
            comment: result.comment ?? "",
          };
        });
        const hasFBCTest = loadedTests.some(
          (test) => test.category === "Full Blood Count (FBC)"
        );
        const normalizedNames = new Set(
          loadedTests.map((test) =>
            String(test.name || "").toLowerCase().replace(/\s+/g, "").replace(/[()%]/g, "")
          )
        );
        const requiredFbcTests = [
          { name: "Monocytes (%)", id: 999901 },
          { name: "Monocytes", id: 999902 },
        ];
        const missingFbcTests = hasFBCTest
          ? requiredFbcTests
              .filter((test) => {
                const key = test.name.toLowerCase().replace(/\s+/g, "").replace(/[()%]/g, "");
                return !normalizedNames.has(key);
              })
              .map((test) => ({
                ...test,
                category: "Full Blood Count (FBC)",
                result: "",
                unit: "",
                refRange: "",
                flag: "",
                comment: "",
              }))
          : [];

        setSelectedTests(normalizeSelectedTests([...loadedTests, ...missingFbcTests]));
        setTab(2);
      } else {
        setSelectedTests([]);
        setTab(1);
      }

      setSearchDialogOpen(false);
      setSnack({
        open: true,
        message: `Loaded visit #${requestIdValue} for ${patientItem.first_name} ${patientItem.last_name}`,
        severity: "success",
      });
    } catch (error) {
      console.error("Could not load selected patient visit", error);
      setSnack({
        open: true,
        message: error.response?.data?.detail || error.message || "Could not load the selected visit.",
        severity: "error",
      });
    } finally {
      setLoadingPatient(false);
    }
  };

  const handleVerify = () => {
    if (!requestRef) setRequestRef(`BIO${dayjs().format("YYMMDDHHmmss")}`);
      const newRequestRef = requestRef || `BIO${dayjs().format("YYMMDDHHmmss")}`;
      if (!requestRef) setRequestRef(newRequestRef);
      setSnack({ open: true, message: `Request verified (${newRequestRef})`, severity: "info" });
  };

  const handleUpdate = async () => {
    console.log("🔄 handleUpdate called, patientId:", patientId, "requestId:", requestId, "selectedTests:", selectedTests.length);
    if (!patientId) return setSnack({ open: true, message: "No patient selected to update. Search and select a patient first.", severity: "warning" });

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");
      const headers = { Authorization: `Bearer ${token}` };

      // 1️⃣ Update patient info
      console.log("📤 Updating patient info for ID:", patientId);
      await axios.put(
        `${API_URL}/patients/${patientId}`,
        {
          first_name: patient.firstName,
          last_name: patient.lastName,
          dob: patient.dob || null,
          gender: patient.gender || null,
          phone: patient.phone || null,
          email: patient.email || null,
          address: patient.address || null,
          funding: patient.funding || null,
          member_number: patient.memberNumber || null,
          member_suffix: patient.memberSuffix || null,
          relationship: patient.relationship || null,
          principal: patient.principal ?? true,
          facility: patient.facility || null,
          doctor_name: patient.doctorName || null,
          ah_foz: patient.ahFoz || null,
          clinical_data: patient.clinicalData || null,
        },
        { headers }
      );
      console.log("✅ Patient info updated");

      // 2️⃣ Update lab request with selected tests (create/update lab results for all selected tests)
      if (requestId && selectedTests.length > 0) {
        console.log("📤 Updating lab results for", selectedTests.length, "selected tests");
        await Promise.all(
          selectedTests.map((test) =>
            axios.post(
              `${API_URL}/lab-results/`,
              {
                patient_id: patientId,
                lab_request_id: requestId,
                lab_test_id: Number(test.id),
                test_name: test.name,
                results: String(test.result ?? ""),
                unit: test.unit ?? "",
                ref_range: test.refRange ?? "",
                flag: test.flag ?? "",
                comment: test.comment ?? "",
              },
              { headers }
            )
          )
        );
        console.log("✅ Lab results updated for all selected tests");
      }

      setSnack({ open: true, message: "Patient and lab results updated successfully ✅", severity: "success" });
    } catch (err) {
      console.error("Update failed:", err.response?.data || err.message);
      setSnack({ open: true, message: `Update failed ❌: ${err.response?.data?.detail || err.message}`, severity: "error" });
    }
  };

  return (
    <Box sx={{ minHeight: "calc(100vh - 64px)" }}>
      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, boxShadow: 3 }}>
        <RequestToolbar
          onNewRequest={handleNewRequest}
          onNewPatient={handleNewPatient}
          onSave={handleSave}
          onSearch={handleSearch}
          onUpdate={handleUpdate}
          onDrop={handleNewRequest}
          onVerify={handleVerify}
          saving={saving}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searching={searching}
        />
      </Paper>

      {/* Tabs + Logout */}
      <Paper sx={{ borderRadius: 2, boxShadow: 2, display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Tabs
            value={tab}
            onChange={handleTabChange}
            textColor="primary"
            indicatorColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Personal Details" />
            <Tab label="Test Request" />
            <Tab label="Test Results" />
            <Tab label="View Results" />
            <Tab label="Authorise ▾" />
          </Tabs>

          <Button variant="outlined" color="error" sx={{ mr: 2 }} onClick={handleLogout}>
            Logout
          </Button>
        </Box>

        <Divider />

        <Box sx={{ p: 3 }}>
          {tab === 0 && (
            <Paper sx={{ p: 2, borderRadius: 2, mb: 2, boxShadow: 1 }}>
                <Grid container spacing={2} alignItems="center">
                  {/* Personal Details Form */}
                  <Grid item xs={12} md={3}>
                    <TextField label="Last Name" name="lastName" value={patient.lastName} onChange={handlePatientChange} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField label="First Name" name="firstName" value={patient.firstName} onChange={handlePatientChange} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField label="Date of Birth" name="dob" type="date" value={patient.dob} onChange={handlePatientChange} InputLabelProps={{ shrink: true }} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={1.5}>
                    <TextField label="Age" value={age} InputProps={{ readOnly: true }} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth>
                      <InputLabel id="gender-label">Gender</InputLabel>
                      <Select labelId="gender-label" name="gender" value={patient.gender} onChange={handlePatientChange}>
                        <MenuItem value="">--</MenuItem>
                        <MenuItem value="Male">Male</MenuItem>
                        <MenuItem value="Female">Female</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField label="Phone" name="phone" value={patient.phone} onChange={handlePatientChange} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField label="Email" name="email" value={patient.email} onChange={handlePatientChange} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField label="Address" name="address" value={patient.address} onChange={handlePatientChange} fullWidth />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel id="funding-label">Funding</InputLabel>
                      <Select labelId="funding-label" name="funding" value={patient.funding} onChange={handlePatientChange} fullWidth>
                        {fundingOptions.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField label="Member #" name="memberNumber" value={patient.memberNumber} onChange={handlePatientChange} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={1.5}>
                    <TextField label="Suffix" name="memberSuffix" value={patient.memberSuffix} onChange={handlePatientChange} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel id="rel-label">Relationship</InputLabel>
                      <Select labelId="rel-label" name="relationship" value={patient.relationship} onChange={handlePatientChange}>
                        <MenuItem value="Self">Self</MenuItem>
                        <MenuItem value="Spouse">Spouse</MenuItem>
                        <MenuItem value="Child">Child</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControlLabel control={<Checkbox checked={patient.principal} name="principal" onChange={handlePatientChange} />} label="Principal Member" />
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  <Grid item xs={12} md={4}>
                    <TextField label="Facility" name="facility" value={patient.facility} onChange={handlePatientChange} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField label="Doctor Name" name="doctorName" value={patient.doctorName} onChange={handlePatientChange} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField label="AHFoz #" name="ahFoz" value={patient.ahFoz} onChange={handlePatientChange} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField label="Clinical Data" name="clinicalData" value={patient.clinicalData} onChange={handlePatientChange} fullWidth />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">
                      Request ID: <strong>{requestRef || requestId || "— not created —"}</strong>
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sx={{ display: "flex", gap: 2, mt: 2 }}>
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={handleUpdate}
                      disabled={!patientId}
                    >
                      Update Patient Info
                    </Button>
                    <Typography variant="caption" sx={{ alignSelf: "center", color: "textSecondary" }}>
                      {!patientId ? "Search and select a patient first" : ""}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {tab === 1 && <LabTestRequest selectedTests={selectedTests} setSelectedTests={setSelectedTests} />}
            {tab === 2 && <TestResultsTab selectedTests={selectedTests} setSelectedTests={setSelectedTests} labResults={labResults} patient={patient} selectedRequest={selectedRequest} setSelectedRequest={setSelectedRequest} onSave={handleSave} />}
            {tab === 3 && <ViewResults patient={patient} selectedTests={selectedTests} labResults={labResults} requestId={requestId} sampleDate={sampleDate} />}
            {tab === 4 && (
              <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                <Button variant="contained" startIcon={<VerifiedIcon />} onClick={() => setSnack({ open: true, message: "Authorise as Doctor (not implemented)", severity: "info" })}>
                  Authorise (Doctor)
                </Button>
                <Button variant="outlined" onClick={() => setSnack({ open: true, message: "Authorise as Lab Admin (not implemented)", severity: "info" })}>
                  Authorise (Lab Admin)
                </Button>
              </Box>
            )}
          </Box>
      </Paper>

      <Dialog
        open={searchDialogOpen}
        onClose={() => !loadingPatient && setSearchDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Choose the patient and visit to review</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Matching names can belong to different people. Check the patient ID and details,
            then choose the visit by its date and request ID.
          </Typography>
          <Stack spacing={2}>
            {searchMatches.map((match) => {
              const visits = [...(match.lab_requests || [])].sort(
                (a, b) => new Date(b.created_at) - new Date(a.created_at)
              );
              return (
                <Paper key={match.id} variant="outlined" sx={{ p: 2, boxShadow: "none" }}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    alignItems={{ sm: "center" }}
                    justifyContent="space-between"
                  >
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {match.first_name} {match.last_name}
                      </Typography>
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 0.5 }}>
                        <Chip size="small" variant="outlined" label={`Patient #${match.id}`} />
                        {match.dob && (
                          <Chip size="small" variant="outlined" label={`DOB: ${match.dob}`} />
                        )}
                        {match.gender && (
                          <Chip size="small" variant="outlined" label={match.gender} />
                        )}
                        {match.facility && (
                          <Chip size="small" variant="outlined" label={match.facility} />
                        )}
                        {match.member_number && (
                          <Chip size="small" variant="outlined" label={`Member #${match.member_number}`} />
                        )}
                      </Stack>
                    </Box>
                    {visits.length === 0 && (
                      <Button
                        variant="outlined"
                        disabled={loadingPatient}
                        onClick={() => handleSelectPatientVisit(match)}
                      >
                        Select patient
                      </Button>
                    )}
                  </Stack>
                  {visits.length > 0 && (
                    <Box sx={{ mt: 1.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {visits.length} {visits.length === 1 ? "visit" : "visits"} — select the record to review
                      </Typography>
                      <Stack spacing={1} sx={{ mt: 1 }}>
                        {visits.map((visit) => (
                          <Paper
                            key={visit.id}
                            variant="outlined"
                            sx={{
                              p: 1.25,
                              boxShadow: "none",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 1,
                              flexWrap: "wrap",
                            }}
                          >
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {dayjs(visit.created_at).isValid()
                                  ? dayjs(visit.created_at).format("DD MMM YYYY, HH:mm")
                                  : "Visit date unavailable"}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Request #{visit.id}
                                {visit.status ? ` · ${visit.status}` : ""}
                              </Typography>
                            </Box>
                            <Button
                              size="small"
                              variant="contained"
                              disabled={loadingPatient}
                              onClick={() => handleSelectPatientVisit(match, visit)}
                            >
                              Review this record
                            </Button>
                          </Paper>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Paper>
              );
            })}
          </Stack>
        </DialogContent>
        <DialogActions>
          {loadingPatient && <CircularProgress size={22} sx={{ mr: 1 }} />}
          <Button onClick={() => setSearchDialogOpen(false)} disabled={loadingPatient}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NewRequestPage;
