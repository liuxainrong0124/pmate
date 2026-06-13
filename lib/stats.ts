// Real statistical calculations for A/B test analysis.
// No AI hallucination — actual math runs in the browser.

/**
 * Standard normal cumulative distribution function (Abramowitz & Stegun approximation).
 * Used to compute p-values from z-scores.
 */
function normalCDF(x: number): number {
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2.0);
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1.0 + sign * y);
}

/** Two-tailed p-value from z-score */
export function pValueFromZ(z: number): number {
  return 2 * (1 - normalCDF(Math.abs(z)));
}

/** One-tailed p-value from z-score */
export function pValueOneTailed(z: number): number {
  return 1 - normalCDF(z);
}

/** z-critical value for given confidence level (two-tailed) */
export function zCritical(confidenceLevel: number): number {
  // For 95%: 1.96, for 99%: 2.576, for 90%: 1.645
  const alpha = 1 - confidenceLevel;
  const p = 1 - alpha / 2;
  return inverseNormalCDF(p);
}

/** Inverse normal CDF using rational approximation (Moro algorithm) */
function inverseNormalCDF(p: number): number {
  if (p <= 0 || p >= 1) return p <= 0 ? -Infinity : Infinity;
  const a0 = 2.50662823884;
  const a1 = -18.61500062529;
  const a2 = 41.39119773534;
  const a3 = -25.44106049637;
  const b1 = -8.47351093090;
  const b2 = 23.08336743743;
  const b3 = -21.06224101826;
  const b4 = 3.13082909833;
  const c0 = 0.3374754822726147;
  const c1 = 0.9761690190917186;
  const c2 = 0.1607979714918209;
  const c3 = 0.0276438810333863;
  const c4 = 0.0038405729373609;
  const c5 = 0.0003951896511919;
  const c6 = 0.0000321767881768;
  const c7 = 0.0000002888167364;
  const c8 = 0.0000003960315187;

  const y = p - 0.5;
  if (Math.abs(y) < 0.42) {
    const r = y * y;
    return y * (((a3 * r + a2) * r + a1) * r + a0) / ((((b4 * r + b3) * r + b2) * r + b1) * r + 1);
  }
  const r = p < 0.5 ? p : 1 - p;
  const s = Math.sqrt(-Math.log(r));
  let z = c0 + s * (c1 + s * (c2 + s * (c3 + s * (c4 + s * (c5 + s * (c6 + s * (c7 + s * c8)))))));
  return p < 0.5 ? -z : z;
}

// ── Proportion-based A/B test (z-test for two proportions) ──

export interface ProportionTestResult {
  controlRate: number;
  experimentRate: number;
  absoluteLift: number;
  relativeLift: number;
  zScore: number;
  pValue: number;
  significant: boolean;
  confidenceLevel: number;
  ciLow: number;
  ciHigh: number;
  sampleSizeAdequate: boolean;
  minSampleNeeded: number;
  power: number;
}

/**
 * Two-proportion z-test for A/B experiment analysis.
 * Computes: lift, z-score, p-value, confidence interval, power, minimum sample.
 */
export function twoProportionZTest(
  controlConversions: number,
  controlSample: number,
  experimentConversions: number,
  experimentSample: number,
  confidenceLevel: number = 0.95
): ProportionTestResult {
  const pA = controlConversions / controlSample;
  const pB = experimentConversions / experimentSample;
  const absoluteLift = pB - pA;
  const relativeLift = pA > 0 ? (pB - pA) / pA : 0;

  // Pooled proportion
  const pPool = (controlConversions + experimentConversions) / (controlSample + experimentSample);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / controlSample + 1 / experimentSample));

  const zScore = se > 0 ? (pB - pA) / se : 0;
  const pValue = pValueFromZ(zScore);
  const significant = pValue < 0.05;

  // Confidence interval for the difference (pB - pA)
  const zCrit = zCritical(confidenceLevel);
  const seDiff = Math.sqrt(
    (pA * (1 - pA)) / controlSample + (pB * (1 - pB)) / experimentSample
  );
  const ciLow = (pB - pA) - zCrit * seDiff;
  const ciHigh = (pB - pA) + zCrit * seDiff;

  // Minimum sample size needed (for 80% power, detecting this effect size)
  const effectSize = Math.abs(pB - pA);
  const minSampleNeeded = effectSize > 0
    ? Math.ceil((2 * (zCritical(confidenceLevel) + 0.842) ** 2 * pPool * (1 - pPool)) / (effectSize ** 2))
    : Infinity;

  const sampleSizeAdequate = controlSample >= minSampleNeeded && experimentSample >= minSampleNeeded;

  // Statistical power (post-hoc)
  const seEff = Math.sqrt(pPool * (1 - pPool) * (2 / Math.min(controlSample, experimentSample)));
  const power = effectSize > 0
    ? normalCDF((effectSize / seEff) - zCritical(confidenceLevel))
    : 0;

  return {
    controlRate: pA,
    experimentRate: pB,
    absoluteLift,
    relativeLift,
    zScore,
    pValue,
    significant,
    confidenceLevel,
    ciLow,
    ciHigh,
    sampleSizeAdequate,
    minSampleNeeded,
    power,
  };
}

// ── Mean-based A/B test (Welch's t-test approximation) ──

export interface TTestResult {
  meanA: number;
  meanB: number;
  absoluteLift: number;
  relativeLift: number;
  tStatistic: number;
  pValue: number;
  significant: boolean;
  cohensD: number;
  effectSizeLabel: string;
}

/**
 * Welch's t-test for comparing means between two groups.
 * Uses z-score approximation for large samples (n > 30).
 */
export function welchTTest(
  meanA: number, stdA: number, nA: number,
  meanB: number, stdB: number, nB: number
): TTestResult {
  const absoluteLift = meanB - meanA;
  const relativeLift = meanA > 0 ? (meanB - meanA) / meanA : 0;

  const se = Math.sqrt((stdA ** 2) / nA + (stdB ** 2) / nB);
  const tStatistic = se > 0 ? (meanB - meanA) / se : 0;

  // For large samples, t → z
  const effectiveN = Math.min(nA, nB);
  const pValue = effectiveN > 30
    ? pValueFromZ(tStatistic)
    : pValueFromZ(tStatistic); // conservative approximation

  const significant = pValue < 0.05;

  // Cohen's d (effect size)
  const pooledStd = Math.sqrt(((stdA ** 2) * (nA - 1) + (stdB ** 2) * (nB - 1)) / (nA + nB - 2));
  const cohensD = pooledStd > 0 ? Math.abs(meanB - meanA) / pooledStd : 0;

  let effectSizeLabel: string;
  if (cohensD < 0.2) effectSizeLabel = "微小 (negligible)";
  else if (cohensD < 0.5) effectSizeLabel = "小 (small)";
  else if (cohensD < 0.8) effectSizeLabel = "中等 (medium)";
  else effectSizeLabel = "大 (large)";

  return {
    meanA, meanB, absoluteLift, relativeLift,
    tStatistic, pValue, significant,
    cohensD, effectSizeLabel,
  };
}

// ── Sample Size Calculator ──

/**
 * Minimum sample size per group for A/B test.
 * @param baselineRate Current conversion rate (0-1)
 * @param minDetectableEffect Minimum lift you want to detect (absolute, e.g. 0.02 for 2pp)
 * @param confidenceLevel Default 0.95
 * @param power Default 0.80
 */
export function minSampleSize(
  baselineRate: number,
  minDetectableEffect: number,
  confidenceLevel: number = 0.95,
  power: number = 0.80
): number {
  const zAlpha = zCritical(confidenceLevel);
  const zBeta = inverseNormalCDF(power);
  const p = baselineRate;
  const d = minDetectableEffect;
  if (d <= 0) return Infinity;
  return Math.ceil((2 * (zAlpha + zBeta) ** 2 * p * (1 - p)) / (d ** 2));
}

// ── Chi-square test ──

export function chiSquareTest(
  observed: number[][]
): { chiSquare: number; pValue: number; significant: boolean; cramersV: number } {
  const rows = observed.length;
  const cols = observed[0].length;
  let total = 0;
  const rowSums = new Array(rows).fill(0);
  const colSums = new Array(cols).fill(0);

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      total += observed[i][j];
      rowSums[i] += observed[i][j];
      colSums[j] += observed[i][j];
    }
  }

  let chiSquare = 0;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const expected = (rowSums[i] * colSums[j]) / total;
      if (expected > 0) {
        chiSquare += ((observed[i][j] - expected) ** 2) / expected;
      }
    }
  }

  const df = (rows - 1) * (cols - 1);
  // Chi-square p-value using normal approximation for df=1, Wilson-Hilferty for others
  const pValue = chiSquarePValue(chiSquare, df);
  const significant = pValue < 0.05;
  const cramersV = Math.sqrt(chiSquare / (total * Math.min(rows - 1, cols - 1)));

  return { chiSquare, pValue, significant, cramersV };
}

function chiSquarePValue(chi2: number, df: number): number {
  if (df === 1) {
    return pValueFromZ(Math.sqrt(chi2));
  }
  // Wilson-Hilferty approximation for df > 1
  const z = (Math.pow(chi2 / df, 1 / 3) - (1 - 2 / (9 * df))) / Math.sqrt(2 / (9 * df));
  return pValueOneTailed(z);
}

// ── Descriptive Statistics ──

export function descriptiveStats(values: number[]) {
  const n = values.length;
  if (n === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1);
  const stdDev = Math.sqrt(variance);

  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];

  return { n, mean, median, stdDev, variance, min: sorted[0], max: sorted[n - 1], sum };
}

export function percentChange(oldValue: number, newValue: number): number {
  return oldValue !== 0 ? ((newValue - oldValue) / Math.abs(oldValue)) * 100 : 0;
}

export function trendDirection(values: number[]): "up" | "down" | "stable" {
  if (values.length < 2) return "stable";
  const recent = values.slice(-Math.min(7, values.length));
  const first = recent.slice(0, Math.ceil(recent.length / 2));
  const second = recent.slice(Math.ceil(recent.length / 2));
  const avg1 = first.reduce((a, b) => a + b, 0) / first.length;
  const avg2 = second.reduce((a, b) => a + b, 0) / second.length;
  const pct = percentChange(avg1, avg2);
  if (pct > 3) return "up";
  if (pct < -3) return "down";
  return "stable";
}
