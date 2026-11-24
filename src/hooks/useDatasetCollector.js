import { useCallback, useEffect, useRef, useState } from "react";
import {
  createDatasetSession,
  addDatasetSample,
  finishDatasetSession,
} from "../dataset/datasetEngine.js";
import { saveDatasetSession } from "../dataset/datasetStore.js";

export default function useDatasetCollector(features) {
  const sessionRef = useRef(null);
  const pendingSessionRef = useRef(null);
  const savingRef = useRef(false);

  const [isCollecting, setIsCollecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sampleCount, setSampleCount] = useState(0);
  const [completedSession, setCompletedSession] = useState(null);
  const [saveStatus, setSaveStatus] = useState("");
  const [error, setError] = useState("");

  const startCollection = useCallback((classId, participantId) => {
    if (sessionRef.current || pendingSessionRef.current || savingRef.current) {
      setError("Sesi sebelumnya masih berjalan atau belum berhasil disimpan.");
      return false;
    }

    try {
      const session = createDatasetSession(classId, participantId);

      sessionRef.current = session;
      setSampleCount(0);
      setCompletedSession(null);
      setSaveStatus("");
      setError("");
      setIsCollecting(true);

      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  const savePendingSession = useCallback(async () => {
    if (!pendingSessionRef.current || savingRef.current) {
      return null;
    }

    savingRef.current = true;
    setIsSaving(true);
    setSaveStatus("saving");
    setError("");

    try {
      const session = pendingSessionRef.current;

      await saveDatasetSession(session);

      pendingSessionRef.current = null;
      setCompletedSession(session);
      setSaveStatus("saved");

      return session;
    } catch (err) {
      setSaveStatus("failed");
      setError(`Gagal menyimpan sesi: ${err.message}`);

      return null;
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }, []);

  const stopCollection = useCallback(async () => {
    if (!sessionRef.current) {
      setIsCollecting(false);
      return null;
    }

    const result = finishDatasetSession(sessionRef.current);

    sessionRef.current = null;
    setIsCollecting(false);

    if (!result) {
      setCompletedSession(null);
      setSaveStatus("");
      setError("Sesi tidak memiliki sampel valid dan tidak disimpan.");
      return null;
    }

    pendingSessionRef.current = result;

    return savePendingSession();
  }, [savePendingSession]);

  const retrySave = useCallback(() => {
    return savePendingSession();
  }, [savePendingSession]);

  useEffect(() => {
    if (!isCollecting || !sessionRef.current || !features) {
      return;
    }

    const added = addDatasetSample(sessionRef.current, features, Date.now());

    if (added) {
      setSampleCount(sessionRef.current.samples.length);
    }
  }, [features, isCollecting]);

  return {
    isCollecting,
    isSaving,
    sampleCount,
    completedSession,
    saveStatus,
    error,
    startCollection,
    stopCollection,
    retrySave,
  };
}
