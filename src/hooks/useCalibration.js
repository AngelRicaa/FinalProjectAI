import { useEffect, useRef, useState } from "react";
import {
  createCalibrationSession,
  addCalibrationSample,
  summarizeCalibrationSession,
} from "../calibration/calibrationEngine";

const CONDITIONS = [
  "neutral",
  "eyesOpen",
  "eyesSquinting",
  "eyesClosed",
  "headLeft",
  "headRight",
  "headDown",
];

const MIN_SAMPLES = 30;
const SAMPLE_INTERVAL = 200;

export default function useCalibration(faceFeatures) {
  const sessionRef = useRef(createCalibrationSession());
  const lastSampleTimeRef = useRef(0);

  const [conditionIndex, setConditionIndex] = useState(0);
  const [sampleCount, setSampleCount] = useState(0);
  const [isCollecting, setIsCollecting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const currentCondition = CONDITIONS[conditionIndex];

  useEffect(() => {
    if (!isCollecting || !faceFeatures) return;

    const now = performance.now();

    if (now - lastSampleTimeRef.current < SAMPLE_INTERVAL) return;

    const added = addCalibrationSample(
      sessionRef.current,
      currentCondition,
      faceFeatures,
    );

    if (!added) return;

    lastSampleTimeRef.current = now;

    const count = sessionRef.current.conditions[currentCondition].length;

    setSampleCount(count);

    if (count >= MIN_SAMPLES) {
      setIsCollecting(false);
    }
  }, [faceFeatures, isCollecting, currentCondition]);

  function startCollection() {
    if (!faceFeatures) {
      setError("Wajah belum terdeteksi. Pastikan wajah terlihat jelas.");
      return;
    }

    if (sampleCount >= MIN_SAMPLES) return;

    setError("");
    lastSampleTimeRef.current = 0;
    setIsCollecting(true);
  }

  function nextCondition() {
    if (sampleCount < MIN_SAMPLES || isCollecting) return;

    if (conditionIndex < CONDITIONS.length - 1) {
      setConditionIndex((index) => index + 1);
      setSampleCount(0);
      setError("");
      return;
    }

    const calibrationResult = summarizeCalibrationSession(sessionRef.current);

    setResult(calibrationResult);
  }

  function resetCalibration() {
    sessionRef.current = createCalibrationSession();
    lastSampleTimeRef.current = 0;
    setConditionIndex(0);
    setSampleCount(0);
    setIsCollecting(false);
    setResult(null);
    setError("");
  }

  return {
    currentCondition,
    conditionIndex,
    totalConditions: CONDITIONS.length,
    sampleCount,
    minimumSamples: MIN_SAMPLES,
    isCollecting,
    result,
    error,
    startCollection,
    nextCondition,
    resetCalibration,
  };
}
