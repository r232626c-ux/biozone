/* ============================================================
   AGE & SEX–SPECIFIC REFERENCE RANGE RESOLUTION
   ============================================================ */

export function getReferenceRange(reference, age, sex) {
  if (!reference) return null;

  const sexKey =
    sex?.toLowerCase() === "male"
      ? "male"
      : sex?.toLowerCase() === "female"
      ? "female"
      : null;

  // Priority: sex → adult → all
  let ranges =
    (sexKey && reference[sexKey]) ||
    reference.adult ||
    reference.all;

  if (!ranges) return null;

  // Age-stratified object
  if (typeof ranges === "object" && !Array.isArray(ranges)) {
    for (const key of Object.keys(ranges)) {
      const [min, max] = ranges[key];

      if (key === "all") return { reference_min: min, reference_max: max };

      if (key.startsWith("<")) {
        const limit = parseInt(key.replace("<", ""));
        if (age < limit) return { reference_min: min, reference_max: max };
      }

      if (key.includes("-")) {
        const [a, b] = key.split("-").map(Number);
        if (age >= a && age <= b)
          return { reference_min: min, reference_max: max };
      }

      if (key.endsWith("+")) {
        const a = parseInt(key.replace("+", ""));
        if (age >= a) return { reference_min: min, reference_max: max };
      }
    }
    return null;
  }

  // Simple numeric range
  if (Array.isArray(ranges)) {
    return { reference_min: ranges[0], reference_max: ranges[1] };
  }

  return null;
}


/* ============================================================
   RESULT FLAGGING
   ============================================================ */

export function evaluateResult(value, range) {
  if (!range || value === null || value === undefined) return "";

  const { reference_min, reference_max } = range;

  if (reference_min !== null && value < reference_min) return "L";
  if (reference_max !== null && value > reference_max) return "H";

  return "N";
}

export function qualitativeFlag(result) {
  if (!result) return "INDETERMINATE";

  const r = String(result).toLowerCase();

  if (["positive", "reactive", "detected", "yes"].includes(r))
    return "POSITIVE";

  if (["negative", "non-reactive", "not detected", "no"].includes(r))
    return "NEGATIVE";

  return "INDETERMINATE";
}


/* ============================================================
   CALCULATED LAB FORMULAS
   ============================================================ */

// LDL (Friedewald)
export function calculateLDL(tc, hdl, tg) {
  if ([tc, hdl, tg].some(v => v === null || v === undefined)) return null;
  return +(tc - hdl - tg / 5).toFixed(2);
}

// Transferrin Saturation
export function calculateTSAT(iron, tibc) {
  if (!iron || !tibc) return null;
  return +((iron / tibc) * 100).toFixed(2);
}

// CKD-EPI 2021 (race-free)
export function calculateEGFR(scr, age, sex) {
  if (!scr || !age || !sex) return null;

  const isFemale = sex.toLowerCase() === "female";
  const kappa = isFemale ? 0.7 : 0.9;
  const alpha = isFemale ? -0.241 : -0.302;

  const ratio = scr / kappa;

  const egfr =
    142 *
    Math.pow(Math.min(ratio, 1), alpha) *
    Math.pow(Math.max(ratio, 1), -1.2) *
    Math.pow(0.9938, age) *
    (isFemale ? 1.012 : 1);

  return Math.round(egfr);
}

// Cockcroft–Gault CrCl
export function calculateCrCl(age, weight, scr, sex) {
  if (!age || !weight || !scr) return null;

  const factor = sex?.toLowerCase() === "female" ? 0.85 : 1;

  return +(((140 - age) * weight * factor) / (72 * scr)).toFixed(2);
}

// Anion Gap
export function calculateAnionGap(na, cl, hco3) {
  if ([na, cl, hco3].some(v => v === null || v === undefined)) return null;
  return na - (cl + hco3);
}


/* ============================================================
   UNIFIED LAB INTERPRETATION ENGINE
   ============================================================ */

export function interpretLabTest({
  testName,
  value,
  age,
  sex,
  referenceInfo,
}) {
  const numeric = !isNaN(parseFloat(value));

  // ----------------------
  // Quantitative
  // ----------------------
  if (numeric) {
    const numValue = parseFloat(value);

    const range = getReferenceRange(
      referenceInfo?.reference,
      age,
      sex
    );

    const flag = evaluateResult(numValue, range);

    return {
      type: "quantitative",
      value: numValue,
      refMin: range?.reference_min ?? null,
      refMax: range?.reference_max ?? null,
      unit: referenceInfo?.unit || "",
      flag,
      comment: referenceInfo?.comment || "",
    };
  }

  // ----------------------
  // Qualitative
  // ----------------------
  return {
    type: "qualitative",
    value,
    refMin: null,
    refMax: null,
    unit: "",
    flag: "",
    qualitative: qualitativeFlag(value),
    comment: referenceInfo?.comment || "",
  };
}
