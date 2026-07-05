import React, { useRef, useEffect } from "react";
import { Box, Typography, Divider, Stack } from "@mui/material";
import { QRCodeSVG } from "qrcode.react";

const ViewResults = ({
  selectedTests = [],
  labResults = [],
  patient = {},
  labScientist = "Mr B. Chonzi",
  requestId,
  sampleDate,
  onCancel = () => {},
}) => {
  const componentRef = useRef(null);

  const getAuthorizedByName = () => {
    try {
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        const user = JSON.parse(rawUser);
        const username = user?.username?.toLowerCase();
        if (username === "cbvumbi") return "Chido Bvumbi";
        if (username === "bchonzi") return "Basil Chonzi";
        if (username) return user.username;
      }
    } catch (error) {

      console.error("Failed to parse logged-in user for authorization label", error);
    }
    return labScientist || "Mr B. Chonzi";
  };

  const authorisedBy = getAuthorizedByName();

  const microCategories = [
     "Fluid M/C/S",
      "Rectal Swab M/C/S",
    "Urine Microscopy",
    "Swab M/C/S",
    "Sputum M/C/S",
    "Stool M/C/S",
  ];

  const normalizeViewResult = (entry) => ({
    id: entry.id ?? entry.lab_test_id ?? entry.test_name ?? `${entry.test_name}-${Math.random()}`,
    name: entry.test_name || entry.name || "Unknown Test",
    result: entry.results ?? entry.test_result ?? entry.result ?? "",
    unit: entry.unit ?? entry.test_unit ?? "",
    refRange: entry.ref_range ?? entry.refRange ?? "",
    flag: entry.flag ?? "",
    comment: entry.comment ?? "",
    incubation: entry.incubation ?? "",
    category: entry.category ?? entry.lab_test?.category ?? "Other",
    labTestId: entry.lab_test_id ?? entry.labTest?.id ?? entry.id,
  });

  const displayTests = selectedTests
    .map((test) => ({
      ...test,
      result: test.result || test.results || "",
      unit: test.unit || test.test_unit || "",
      refRange: test.refRange || test.ref_range || "",
      flag: test.flag || "",
      comment: test.comment || "",
      incubation: test.incubation || "",
      category: test.category || test.lab_test?.category || "Other",
      labTestId: test.labTestId ?? test.id,
    }))
    .filter((test) => {
      const isMicro = microCategories.includes(test.category);
      // Remove parent micro category placeholders that do not belong to a sub-tab
      return !(isMicro && !test.subTab);
    });

  const uniqueTests = displayTests.reduce((acc, test) => {
    const key = `${test.category || "Other"}::${test.subTab || "microscopy"}::${test.name}`;
    if (!acc.seen.has(key)) {
      acc.seen.add(key);
      acc.tests.push(test);
    }
    return acc;
  }, { seen: new Set(), tests: [] }).tests;

  const groupedTests = uniqueTests.reduce((acc, test) => {
    const category = test.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(test);
    return acc;
  }, {});

  const requestedTestCategories = Object.keys(groupedTests).join(", ");

  const qrPayload = {
    requestId: requestId || "N/A",
    patient: {
      firstName: patient.firstName || "",
      lastName: patient.lastName || "",
      dob: patient.dob || "",
      gender: patient.gender || "",
    },
    sampleDate: sampleDate || "N/A",
    results: uniqueTests.map((test) => ({
      name: test.name,
      result: test.result || "",
      unit: test.unit || "",
      flag: test.flag || "",
    })),
  };

  const qrValue = JSON.stringify(qrPayload);

  const getMicroSectionHeading = (subTab) => {
    if (subTab === "culture") return "Culture Results";
    if (subTab === "drugs") return "Sensitivity Results";
    return "Microscopy Results";
  };

  const renderTestTable = (tests, options = { showHeader: true, isCulture: false, isMicro: false, isDrugGrid: false }) => {
    const { showHeader, isCulture, isMicro, isDrugGrid } = options;
    return (
      <table>
        {showHeader && (
          <thead>
            <tr>
              <th>{isCulture ? "Culture" : "Test"}</th>
              <th>{isCulture ? "Organism Identified" : "Result"}</th>
              {(isCulture || !isDrugGrid) && <th>{isCulture ? "Growth Density" : "Unit"}</th>}
              {(isCulture || !isDrugGrid) && <th>{isCulture ? "Incubation Period" : "Reference"}</th>}
              {!isCulture && !isMicro && !isDrugGrid && <th>Flag</th>}
            </tr>
          </thead>
        )}
        <tbody>
          {tests.map((test) => (
            <tr key={test.id}>
              <td className="left">{test.name}</td>
              <td className="center">
                {test.result || ""}
              </td>
              {(isCulture || !isDrugGrid) && <td className="center">{isCulture ? (test.unit || "") : (test.unit || "")}</td>}
              {(isCulture || !isDrugGrid) && <td className="center">{isCulture ? (test.incubation || "") : (test.refRange || "")}</td>}
              {!isCulture && !isMicro && !isDrugGrid && <td className="center">{test.flag || ""}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const handlePrint = () => {
    if (!componentRef.current) return;

    const printContent = componentRef.current.innerHTML;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>Lab Report - ${patient.firstName || "Patient"}</title>
  <style>
    @page { size: A4; margin: 15mm; }

    body {
      font-family: "Courier New", monospace;
      font-size: 12px;
      color: #000;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      font-weight: bold;
      color: #227029;
    }

    .header img {
    max-width:220px}

    .divider {
      border-top: 1px solid #000;
      margin: 10px 0 15px;
    }

    .patient-info-grid {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 10px;
      margin-top: 10px;
    }

    .patient-details {
      display: grid;
      gap: 4px;
      line-height: 1.6;
    }

    .label {
      display: inline-block;
      width: 120px;
    }

    .info {
      font-weight: bold;
      
    }

    .right-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }

    .patient-qr {
      text-align: center;
    }

    .qr-caption {
      font-size: 11px;
      margin-top: 4px;
    }

    .lab-meta {
      width: 100%;
      font-size: 11px;
    }

    .lab-meta div {
      margin-bottom: 4px;
    }

    .clinical-text {
      font-weight: bold;
      white-space: pre-wrap;
    }

    .divider {
      border-top: 1px solid #000;
      margin: 10px 0 15px;
    }


    .results-header {
  margin-top: 1px;
  margin-bottom: 1px;
  font-weight: bold;
  font-size: 14px;
  text-transform: uppercase;
}

    .micro-section-header {
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      margin: 15px 0 5px 0;
      color: #227029;
      border-bottom: 1px solid #ccc;
      padding-bottom: 3px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
    }

    th, td {
      border: 1px solid #ccc;
      padding: 8px;
    }

    th {
      background: #f5f5f5;
    }

    .left {
  text-align: left;
}

.center {
  text-align: center;
  vertical-align: middle; /* vertically centers multi-line content */
}
.comments {
  background-color: #f9f9f9;  /* Light gray background */
  padding: 12px 16px;
  border-radius: 6px;
  margin-top: 16px;
}

.comments h6 {
  font-weight: bold;
  font-size: 14px;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.comments p {
  margin: 4px 0;
  font-size: 0.95rem;
  color: #333;
}
  
 .divider {
      border-top: 1px solid #000;
      margin: 10px 0 15px;
    }

    .footer {
      margin-top: 0px;
      font-size: 14px;
    }

    .end {
      text-align: center;
      font-style: italic;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  ${printContent}
</body>
</html>
`);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();

    onCancel();
  };

  useEffect(() => {
    if (selectedTests.length) {
      handlePrint();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!selectedTests.length) {
    return <Typography>No tests selected.</Typography>;
  }

  return (
    <Box ref={componentRef} sx={{ position: "relative", width: "100%" }}>
      {Object.entries(groupedTests).map(([category, tests]) => (
        <div key={category} style={{ position: "relative", marginBottom: "50px" }}>
          {/* HEADER */}
          <div className="header">
            <img
              src="https://d24naddg1rhy2p.cloudfront.net/67005/127/0/biotechinst_logo_new_2020-03-05_v4.png"
              alt="Biotech Logo"
            />
            <div className="contact">
              <div>217 Herbert Chitepo Ave</div>
              <div>Harare,Zimbabwe</div>
              <div>Tel: 0785 665 046;0716 402 536/8</div>
              <div>diagnostics@biotechinst.com</div>
              <div>www.biotechinst.com</div>
            </div>
          </div>

          <div className="divider" />

          {/* PATIENT INFO GRID */}
<div className="patient-info-grid">

  {/* LEFT: Patient Demographics */}
  <div className="patient-details">
    <div><span className="label">Facility:</span> <span className="info">{patient.facility || "-"}</span></div>
    <div><span className="label">Doctor:</span> <span className="info">{patient.doctorName || "-"}</span></div>
    <div>
      <span className="label">Client/Patient:</span>
      <span className="info">
        {`${patient.firstName || ""} ${patient.lastName || ""}`.trim() || "-"}
      </span>
    </div>
    <div><span className="label">DOB:</span> <span className="info">{patient.dob || "-"}</span></div>
    <div><span className="label">Sex:</span> <span className="info">{patient.gender || "-"}</span></div>
    <div><span className="label">Funding:</span> <span className="info">{patient.funding || "-"}</span></div>
    <div><span className="label">Requested Tests:</span> <span className="info">{requestedTestCategories || category || "-"}</span></div>
    <div><span className="label">Clinical Data:</span></div>
      <div className="info">{patient.clinicalData || "-"}</div>
  </div>

  {/* RIGHT: QR + Lab Metadata */}
  <div className="right-panel">
    <div className="lab-meta">
      <div><span className="label">Lab Ref #:</span> <span className="info">{requestId || "-"}</span></div>
       <div><span className="label">Sample Date:</span> <span className="info">{sampleDate || "-"}</span></div>
      
    </div>
    <div className="patient-qr">
      <QRCodeSVG
        value={qrValue}
        size={140}
        bgColor="#ffffff"
        fgColor="#000000"
        level="M"
        includeMargin={true}
      />
      <div className="qr-caption">Scan to view patient results</div>
    </div>

    
  </div>
</div>

      <div className="divider" />

          {/* RESULTS TABLE */}
          <h3 className="results-header">
  Test Results: {category || "—"}
</h3>

          {/* LBC (Cytology) block replaces the Cytology table when LBC is present */}
          {category === "Cytology" && tests.some((t) => t.name === "LBC") ? (
            (() => {
              const lbc = tests.find((t) => t.name === "LBC") || {};
              return (
                <Box sx={{ mb: 2, p: 2, border: "1px solid #e0e0e0", borderRadius: 2, bgcolor: "#fafafa" }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                    LBC Report (Cytology)
                  </Typography>

                  <Stack direction="column" spacing={1}>
                    <Typography><b>Clinical Data:</b> {lbc.clinicai_data || lbc.clinicaiData || ""}</Typography>
                    <Typography><b>Nature of Specimen:</b> {lbc.nature_of_specimen || ""}</Typography>
                    <Typography><b>Specimen Adequacy:</b> {lbc.specimen_adequacy || ""}</Typography>
                    <Typography><b>Epithelial Abnormalities:</b> {lbc.epithelial_abnormalities || ""}</Typography>
                    <Typography><b>Diagnosis:</b> {lbc.diagnosis || ""}</Typography>
                    <Typography><b>Recommendation:</b> {lbc.recommendation || ""}</Typography>
                    <Typography><b>Comment:</b> {lbc.comment || ""}</Typography>
                  </Stack>
                </Box>
              );
            })()
          ) : microCategories.includes(category) ? (
            // Special handling for microbiology categories
            (() => {
              const subTabGroups = tests.reduce((acc, test) => {
                const subTab = test.subTab || "microscopy";
                if (!acc[subTab]) acc[subTab] = [];
                acc[subTab].push(test);
                return acc;
              }, {});

              return Object.entries(subTabGroups).map(([subTab, subTests]) => {
                const isCulture = subTab === "culture";
                return (
                  <div key={subTab} style={{ marginBottom: "20px" }}>
                    <h4 className="micro-section-header">
                      {getMicroSectionHeading(subTab)}
                    </h4>
                    {renderTestTable(subTests, { showHeader: true, isCulture, isMicro: !isCulture && subTab !== "drugs", isDrugGrid: subTab === "drugs" })}
                  </div>
                );
              });
            })()
          ) : (
            // Standard table for non-microbiology categories
            renderTestTable(tests)
          )}

          {/* COMMENTS */}
{tests.some((t) => t.comment) && (
  <Box className="comments" sx={{ mt: 2 }}>
    <Typography variant="h6" sx={{ mb: 1 }}>
      Comments
    </Typography>
    {tests
      .filter((t) => t.comment)
      .map((t, i) => (
        <Typography key={i} sx={{ mt: 1 }}>
          • {t.comment}
        </Typography>
      ))}
   
  </Box>
)}
 
      <div className="divider" />
          {/* FOOTER */}
          <div className="footer">
            <div className="end">— END OF {category} REPORT —</div>

            <div className="divider" />
            <div>
              <strong className="authorised-label">Authorised by:</strong>{" "}
              <span className="authorised-value">
                {authorisedBy} ({new Date().toLocaleDateString()})
              </span>
            </div>


            <div
  style={{
    marginTop: "40px",
    borderTop: "1px solid #ccc",
    paddingTop: "20px",
  }}
>
  <p>
    <strong>Reviewed By:</strong> ______________________
  </p>

 
</div>
          </div>

          <div style={{ pageBreakAfter: "always" }} />
        </div>
      ))}
    </Box>
  );
};

export default ViewResults;