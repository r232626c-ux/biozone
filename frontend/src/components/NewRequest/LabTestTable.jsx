import React, { useState } from "react";
import { Table, TableHead, TableRow, TableCell, TableBody, Typography, Paper } from "@mui/material";

const LabTestTable = () => {
  const [tests, setTests] = useState([
    { parameter: "HPV 16", result: "Positive" },
    { parameter: "HPV 18", result: "Negative" },
    { parameter: "HPV 31", result: "Negative" },
    { parameter: "HPV 33", result: "Negative" },
    { parameter: "HPV 35", result: "Negative" },
    { parameter: "HPV 39", result: "Negative" },
    { parameter: "HPV 45", result: "Negative" },
    { parameter: "HPV 52", result: "Negative" },
    { parameter: "HPV 56", result: "Negative" },
    { parameter: "HPV 59", result: "Negative" },
    { parameter: "HPV 66", result: "Negative" },
    { parameter: "HPV 68", result: "Negative" },
    { parameter: "HPV 51", result: "Negative" },
  ]);

  return (
    <Paper elevation={1} className="p-4">
      <Typography variant="h6" className="mb-3 font-semibold text-gray-700">
        HPV PCR HR Genotyping Results
      </Typography>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell><strong>#</strong></TableCell>
            <TableCell><strong>Parameter</strong></TableCell>
            <TableCell><strong>Result</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tests.map((test, index) => (
            <TableRow key={index}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{test.parameter}</TableCell>
              <TableCell
                style={{
                  color: test.result === "Positive" ? "red" : "green",
                  fontWeight: 600,
                }}
              >
                {test.result}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default LabTestTable;

