const CONDITIONS = {
  neutral: "neutral",
  eyesOpen: "eyesOpen",
  eyesSquinting: "eyesSquinting",
  eyesClosed: "eyesClosed",
  headLeft: "headLeft",
  headRight: "headRight",
  headDown: "headDown",
};

const MIN_SAMPLES = 30;
const MAX_EAR_IQR = 0.05;
const MAX_HEAD_IQR = 10;
const MIN_EAR_GAP = 0.01;
const MIN_HEAD_MOVEMENT = 12;

const EYE_KEYS = ["averageEAR"];
const HEAD_KEYS = ["headYaw", "headPitch", "headRoll"];

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function quantile(values, proportion) {
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * proportion;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);

  if (lower === upper) return sorted[lower];

  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

function isValidNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function getValidSamples(samples, keys) {
  return samples.filter(
    (sample) => sample && keys.every((key) => isValidNumber(sample[key])),
  );
}

function summarizeSamples(samples, keys) {
  const validSamples = getValidSamples(samples, keys);

  if (validSamples.length < MIN_SAMPLES) {
    return null;
  }

  const result = {};

  for (const key of keys) {
    const values = validSamples.map((sample) => sample[key]);
    const center = median(values);
    const deviations = values.map((value) => Math.abs(value - center));

    const q1 = quantile(values, 0.25);
    const q3 = quantile(values, 0.75);
    const iqr = q3 - q1;

    result[key] = {
      median: center,
      q1,
      q3,
      iqr,
      mad: median(deviations),
      min: Math.min(...values),
      max: Math.max(...values),
      sampleCount: values.length,
      stable: key === "averageEAR" ? iqr <= MAX_EAR_IQR : iqr <= MAX_HEAD_IQR,
    };
  }

  return result;
}

function addError(errors, message) {
  errors.push(message);
}

export function createCalibrationSession() {
  return {
    conditions: {
      neutral: [],
      eyesOpen: [],
      eyesSquinting: [],
      eyesClosed: [],
      headLeft: [],
      headRight: [],
      headDown: [],
    },
  };
}

export function addCalibrationSample(session, condition, features) {
  if (
    !session ||
    !session.conditions ||
    !Array.isArray(session.conditions[condition]) ||
    !features
  ) {
    return false;
  }

  const eyeConditions = [
    CONDITIONS.eyesOpen,
    CONDITIONS.eyesSquinting,
    CONDITIONS.eyesClosed,
  ];

  const headConditions = [
    CONDITIONS.neutral,
    CONDITIONS.headLeft,
    CONDITIONS.headRight,
    CONDITIONS.headDown,
  ];

  const keys = eyeConditions.includes(condition)
    ? EYE_KEYS
    : headConditions.includes(condition)
      ? HEAD_KEYS
      : [];

  if (keys.length === 0 || !keys.every((key) => isValidNumber(features[key]))) {
    return false;
  }

  session.conditions[condition].push(
    Object.fromEntries(keys.map((key) => [key, features[key]])),
  );

  return true;
}

export function summarizeCalibrationSession(session) {
  if (!session || !session.conditions) {
    return null;
  }

  const summaries = {
    neutral: summarizeSamples(session.conditions.neutral, HEAD_KEYS),
    eyesOpen: summarizeSamples(session.conditions.eyesOpen, EYE_KEYS),
    eyesSquinting: summarizeSamples(session.conditions.eyesSquinting, EYE_KEYS),
    eyesClosed: summarizeSamples(session.conditions.eyesClosed, EYE_KEYS),
    headLeft: summarizeSamples(session.conditions.headLeft, HEAD_KEYS),
    headRight: summarizeSamples(session.conditions.headRight, HEAD_KEYS),
    headDown: summarizeSamples(session.conditions.headDown, HEAD_KEYS),
  };

  const complete = Object.values(summaries).every(Boolean);
  const errors = [];

  if (!complete) {
    for (const [condition, summary] of Object.entries(summaries)) {
      if (!summary) {
        addError(errors, `Sampel kondisi ${condition} belum mencukupi.`);
      }
    }
  }

  if (complete) {
    for (const condition of ["eyesOpen", "eyesSquinting", "eyesClosed"]) {
      if (!summaries[condition].averageEAR.stable) {
        addError(errors, `Sampel ${condition} tidak stabil.`);
      }
    }

    for (const condition of ["neutral", "headLeft", "headRight", "headDown"]) {
      for (const key of HEAD_KEYS) {
        if (!summaries[condition][key].stable) {
          addError(errors, `Sampel ${condition} tidak stabil pada ${key}.`);
        }
      }
    }

    const openEAR = summaries.eyesOpen.averageEAR.median;
    const squintEAR = summaries.eyesSquinting.averageEAR.median;
    const closedEAR = summaries.eyesClosed.averageEAR.median;

    if (
      openEAR - squintEAR < MIN_EAR_GAP ||
      squintEAR - closedEAR < MIN_EAR_GAP
    ) {
      addError(
        errors,
        "Pemisahan EAR mata terbuka, menyipit, dan tertutup belum memadai.",
      );
    }

    const neutralYaw = summaries.neutral.headYaw.median;
    const leftYaw = summaries.headLeft.headYaw.median - neutralYaw;
    const rightYaw = summaries.headRight.headYaw.median - neutralYaw;

    if (
      Math.abs(leftYaw) < MIN_HEAD_MOVEMENT ||
      Math.abs(rightYaw) < MIN_HEAD_MOVEMENT
    ) {
      addError(
        errors,
        "Gerakan menoleh belum cukup berbeda dari posisi netral.",
      );
    } else if (leftYaw * rightYaw >= 0) {
      addError(errors, "Arah yaw menoleh kiri dan kanan belum berlawanan.");
    }

    const neutralPitch = summaries.neutral.headPitch.median;
    const downPitch = summaries.headDown.headPitch.median - neutralPitch;

    if (downPitch <= MIN_HEAD_MOVEMENT) {
      addError(
        errors,
        "Arah gerakan menunduk tidak sesuai atau belum cukup berbeda dari posisi netral.",
      );
    }
  }

  return {
    complete,
    valid: complete && errors.length === 0,
    minimumSamplesPerCondition: MIN_SAMPLES,
    errors,
    conditions: summaries,
  };
}
