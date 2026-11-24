import React, { useEffect, useState } from "react";
import { DATASET_CLASSES } from "../dataset/datasetConfig";
import {
  getAllDatasetSessions,
  deleteAllDatasetSessions,
} from "../dataset/datasetStore";
import { downloadDatasetCsv } from "../dataset/exportDatasetCsv";

export default function DatasetCollectionPanel({
  monitoring,
  faceReady,
  collector,
}) {
  const [selectedClass, setSelectedClass] = useState("focused");
  const [participantId, setParticipantId] = useState("P001");
  const [sessions, setSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [storageError, setStorageError] = useState("");
  const [exportMessage, setExportMessage] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const activeClass = DATASET_CLASSES.find((item) => item.id === selectedClass);

  const validParticipantId = /^P\d{3}$/.test(participantId);

  async function loadSessions() {
    setIsLoadingSessions(true);
    setStorageError("");

    try {
      const storedSessions = await getAllDatasetSessions();
      setSessions(storedSessions);
    } catch (err) {
      setStorageError(`Gagal membaca dataset: ${err.message}`);
    } finally {
      setIsLoadingSessions(false);
    }
  }

  useEffect(() => {
    loadSessions();
  }, [collector.saveStatus]);

  function handleStart() {
    setExportMessage("");
    setDeleteMessage("");
    collector.startCollection(selectedClass, participantId);
  }

  function handleStop() {
    collector.stopCollection();
  }

  function handleParticipantChange(event) {
    setParticipantId(event.target.value.toUpperCase());
  }

  function handleExport() {
    try {
      const result = downloadDatasetCsv(sessions);

      setExportMessage(
        `Berhasil mengekspor ${result.sessionCount} sesi dan ${result.sampleCount} sampel ke ${result.filename}.`,
      );
    } catch (err) {
      setExportMessage(`Ekspor gagal: ${err.message}`);
    }
  }

  async function handleDeleteAll() {
    const confirmed = window.confirm(
      "Apakah kamu yakin ingin menghapus SELURUH dataset yang tersimpan di perangkat ini? Data yang dihapus tidak dapat dikembalikan.",
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setDeleteMessage("");
    setStorageError("");

    try {
      await deleteAllDatasetSessions();
      setSessions([]);
      setDeleteMessage("Seluruh dataset berhasil dihapus dari perangkat ini.");
      setExportMessage("");
    } catch (err) {
      setStorageError(`Gagal menghapus dataset: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  }

  const totalSamples = sessions.reduce(
    (total, session) => total + session.samples.length,
    0,
  );

  const participantCount = new Set(
    sessions.map((session) => session.participantId),
  ).size;

  const saveStatusText = {
    saving: "Sedang menyimpan sesi ke penyimpanan lokal...",
    saved: "Sesi berhasil disimpan di perangkat ini.",
    failed: "Penyimpanan gagal. Sesi masih tersedia untuk dicoba kembali.",
  };

  return (
    <div className="panel">
      <div className="panel-heading compact">
        <div>
          <h2>Dataset Collection</h2>
          <p>Pengumpulan data aktivitas wajah</p>
        </div>
      </div>

      <div className="stat-card">
        <span>Participant ID</span>
        <input
          type="text"
          value={participantId}
          onChange={handleParticipantChange}
          placeholder="Contoh: P001"
          maxLength={4}
          disabled={collector.isCollecting || collector.isSaving}
        />
        <small>Gunakan ID anonim dengan format P001 sampai P999.</small>
        {!validParticipantId && (
          <small>Format Participant ID belum valid.</small>
        )}
      </div>

      <div className="stat-card">
        <span>Pilih aktivitas</span>
        <select
          value={selectedClass}
          onChange={(event) => setSelectedClass(event.target.value)}
          disabled={collector.isCollecting || collector.isSaving}
        >
          {DATASET_CLASSES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div className="stat-card">
        <span>Instruksi aktivitas</span>
        <strong>{activeClass.name}</strong>
        <small>{activeClass.instruction}</small>
      </div>

      <div className="stat-card">
        <span>Status pengumpulan</span>
        <strong>
          {collector.isCollecting
            ? "Sedang mengumpulkan"
            : collector.isSaving
              ? "Sedang menyimpan"
              : "Tidak aktif"}
        </strong>
        <small>Jumlah sampel sesi aktif: {collector.sampleCount}</small>
      </div>

      {collector.saveStatus && (
        <div className="info-note">
          <span>{saveStatusText[collector.saveStatus]}</span>
        </div>
      )}

      {collector.error && (
        <div className="info-note">
          <span>{collector.error}</span>
        </div>
      )}

      {storageError && (
        <div className="info-note">
          <span>{storageError}</span>
        </div>
      )}

      {deleteMessage && (
        <div className="info-note">
          <span>{deleteMessage}</span>
        </div>
      )}

      {!monitoring && (
        <div className="info-note">
          <span>Aktifkan monitoring sebelum mengumpulkan dataset.</span>
        </div>
      )}

      {monitoring && !faceReady && (
        <div className="info-note">
          <span>Menunggu fitur wajah yang valid.</span>
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={handleStart}
          disabled={
            !monitoring ||
            !faceReady ||
            !validParticipantId ||
            collector.isCollecting ||
            collector.isSaving ||
            collector.saveStatus === "failed" ||
            isDeleting
          }
        >
          Mulai pengumpulan
        </button>

        <button
          type="button"
          onClick={handleStop}
          disabled={!collector.isCollecting}
        >
          Hentikan pengumpulan
        </button>

        {collector.saveStatus === "failed" && (
          <button
            type="button"
            onClick={collector.retrySave}
            disabled={collector.isSaving}
          >
            Coba simpan ulang
          </button>
        )}
      </div>

      {collector.completedSession && (
        <div className="stat-card">
          <span>Sesi terakhir berhasil disimpan</span>
          <strong>
            {collector.completedSession.participantId} -{" "}
            {collector.completedSession.classId}
          </strong>
          <small>
            {collector.completedSession.sampleCount} sampel berhasil direkam.
          </small>
        </div>
      )}

      <div className="stat-card">
        <span>Dataset tersimpan di perangkat ini</span>
        <strong>{isLoadingSessions ? "Memuat..." : sessions.length}</strong>
        <small>Jumlah sesi tersimpan</small>
        <small>Jumlah peserta: {participantCount}</small>
        <small>Total sampel: {totalSamples}</small>
      </div>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={handleExport}
          disabled={
            isLoadingSessions ||
            sessions.length === 0 ||
            collector.isCollecting ||
            collector.isSaving ||
            isDeleting
          }
        >
          Ekspor dataset CSV
        </button>

        <button
          type="button"
          onClick={handleDeleteAll}
          disabled={
            isLoadingSessions ||
            sessions.length === 0 ||
            collector.isCollecting ||
            collector.isSaving ||
            isDeleting
          }
        >
          {isDeleting ? "Menghapus..." : "Hapus seluruh dataset"}
        </button>
      </div>

      {exportMessage && (
        <div className="info-note">
          <span>{exportMessage}</span>
        </div>
      )}
    </div>
  );
}
