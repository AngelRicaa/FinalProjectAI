import React, { useEffect, useMemo, useRef, useState } from "react";
import CameraView from "./components/CameraView";
import DatasetCollectionPanel from "./components/DatasetCollectionPanel";
import { buildDatasetFeatures } from "./dataset/buildDatasetFeatures";
import useDatasetCollector from "./hooks/useDatasetCollector";
import useFaceLandmarker from "./hooks/useFaceLandmarker";
import useCalibration from "./hooks/useCalibration";
import { classifyFaceState } from "./features/classifyFaceState";
import {
  createTemporalTracker,
  updateTemporalTracker,
  resetTemporalTracker,
} from "./features/temporalTracker";

import {
  Activity,
  Camera,
  Clock3,
  Eye,
  ShieldCheck,
  ScanFace,
  CircleHelp,
} from "lucide-react";

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function App() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const temporalTrackerRef = useRef(createTemporalTracker());

  const [cameraOn, setCameraOn] = useState(false);
  const [monitoring, setMonitoring] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [cameraError, setCameraError] = useState("");
  const [temporalState, setTemporalState] = useState(null);

  const { faceStatus, eyeMetrics, faceFeatures } = useFaceLandmarker({
    videoRef,
    canvasRef,
    stageRef,
    cameraOn,
  });

  const calibration = useCalibration(faceFeatures);
  const faceState = classifyFaceState(faceFeatures, calibration.result);

  const datasetFeatures = useMemo(() => {
    const currentFaceState = classifyFaceState(
      faceFeatures,
      calibration.result,
    );

    return buildDatasetFeatures(faceFeatures, currentFaceState, temporalState);
  }, [faceFeatures, calibration.result, temporalState]);

  const datasetCollector = useDatasetCollector(datasetFeatures);

  const conditionLabels = {
    neutral: {
      title: "Posisi kepala netral",
      instruction:
        "Hadapkan wajah lurus ke kamera dan pertahankan posisi kepala secara alami.",
    },
    eyesOpen: {
      title: "Mata terbuka",
      instruction:
        "Buka mata secara normal seperti ketika membaca atau bekerja.",
    },
    eyesSquinting: {
      title: "Mata menyipit",
      instruction:
        "Sipitkan mata secara ringan dan pertahankan posisi tersebut.",
    },
    eyesClosed: {
      title: "Mata tertutup",
      instruction: "Tutup kedua mata secara normal.",
    },
    headLeft: {
      title: "Menoleh ke kiri",
      instruction: "Putar kepala ke kiri tanpa menundukkan kepala.",
    },
    headRight: {
      title: "Menoleh ke kanan",
      instruction: "Putar kepala ke kanan tanpa menundukkan kepala.",
    },
    headDown: {
      title: "Menundukkan kepala",
      instruction: "Arahkan kepala ke bawah secara alami.",
    },
  };

  const currentCalibration = conditionLabels[calibration.currentCondition];
  const calibrationValid = calibration.result?.valid === true;

  useEffect(() => {
    if (!monitoring) {
      resetTemporalTracker(temporalTrackerRef.current);
      setTemporalState(null);
      return;
    }

    const result = updateTemporalTracker(
      temporalTrackerRef.current,
      faceState,
      performance.now(),
    );

    setTemporalState(result);
  }, [faceFeatures, monitoring, calibration.result]);

  useEffect(() => {
    if (!monitoring && datasetCollector.isCollecting) {
      datasetCollector.stopCollection();
    }
  }, [
    monitoring,
    datasetCollector.isCollecting,
    datasetCollector.stopCollection,
  ]);

  useEffect(() => {
    if (!monitoring) return;

    const timer = window.setInterval(
      () => setElapsed((value) => value + 1),
      1000,
    );

    return () => window.clearInterval(timer);
  }, [monitoring]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startCamera() {
    setCameraError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        "Browser tidak mendukung akses kamera. Coba buka melalui localhost atau HTTPS.",
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraOn(true);
    } catch (error) {
      setCameraError(
        error.name === "NotAllowedError"
          ? "Izin kamera ditolak. Izinkan akses kamera melalui pengaturan browser."
          : "Kamera tidak dapat diakses. Pastikan kamera tersedia dan tidak sedang dipakai aplikasi lain.",
      );
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    resetTemporalTracker(temporalTrackerRef.current);
    setTemporalState(null);
    setCameraOn(false);
    setMonitoring(false);
  }

  function startMonitoring() {
    if (!cameraOn || !calibrationValid) return;

    resetTemporalTracker(temporalTrackerRef.current);
    setTemporalState(null);
    setElapsed(0);
    setMonitoring(true);
  }

  function stopMonitoring() {
    setMonitoring(false);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Focusly beranda">
          <span className="brand-mark">
            <Eye size={21} strokeWidth={2.5} />
          </span>
          <span>focusly</span>
        </a>

        <div className="topbar-right">
          <span className="privacy">
            <ShieldCheck size={15} /> Pemrosesan lokal
          </span>
          <span className="avatar">FM</span>
        </div>
      </header>

      <main className="main-content">
        <section className="intro">
          <div>
            <p className="eyebrow">FOCUS MONITOR</p>
            <h1>
              Stay present.
              <br />
              <span>Stay productive.</span>
            </h1>
            <p className="intro-copy">
              Pantau indikasi distraksi selama belajar atau bekerja melalui
              kamera perangkat.
            </p>
          </div>

          <div className="intro-icon">
            <Activity size={30} />
          </div>
        </section>

        <section className="dashboard">
          <CameraView
            videoRef={videoRef}
            canvasRef={canvasRef}
            stageRef={stageRef}
            cameraOn={cameraOn}
            monitoring={monitoring}
            cameraError={cameraError}
            startCamera={startCamera}
            stopCamera={stopCamera}
            startMonitoring={startMonitoring}
            stopMonitoring={stopMonitoring}
          />

          <aside className="side-column">
            <div className="panel status-panel">
              <div className="panel-heading compact">
                <div>
                  <h2>Status sistem</h2>
                  <p>{faceStatus}</p>
                </div>

                <span className="status-icon">
                  <ScanFace size={20} />
                </span>
              </div>

              <div className="status-row">
                <span className="status-indicator" />

                <div>
                  <strong>
                    {monitoring
                      ? "Monitoring aktif"
                      : cameraOn
                        ? "Kamera siap"
                        : "Menunggu kamera"}
                  </strong>

                  <small>
                    {monitoring
                      ? "Sesi sedang berjalan"
                      : calibrationValid
                        ? "Kalibrasi berhasil"
                        : cameraOn
                          ? "Menunggu kalibrasi"
                          : "Kamera belum aktif"}
                  </small>
                </div>
              </div>

              <div className="info-note">
                <CircleHelp size={16} />
                <span>
                  {calibrationValid
                    ? "Klasifikasi kondisi mata dan posisi kepala menggunakan referensi kalibrasi personal."
                    : "Selesaikan kalibrasi personal sebelum menggunakan klasifikasi wajah."}
                </span>
              </div>
            </div>

            <div className="panel">
              <div className="panel-heading compact">
                <div>
                  <h2>Kalibrasi personal</h2>
                  <p>
                    {calibrationValid
                      ? "Kalibrasi berhasil"
                      : "Sesuaikan pengukuran dengan wajah kamu"}
                  </p>
                </div>

                <span className="status-icon">
                  <ScanFace size={20} />
                </span>
              </div>

              {!cameraOn && (
                <div className="info-note">
                  <CircleHelp size={16} />
                  <span>Aktifkan kamera untuk memulai kalibrasi.</span>
                </div>
              )}

              {cameraOn && !calibration.result && (
                <>
                  <div className="stat-card">
                    <span>
                      Tahap {calibration.conditionIndex + 1} dari{" "}
                      {calibration.totalConditions}
                    </span>

                    <strong>{currentCalibration.title}</strong>
                    <small>{currentCalibration.instruction}</small>
                  </div>

                  <div className="stat-card">
                    <span>Jumlah sampel terkumpul</span>

                    <strong>
                      {calibration.sampleCount} / {calibration.minimumSamples}
                    </strong>

                    <small>
                      Diperlukan minimal 30 sampel valid pada setiap tahap.
                    </small>
                  </div>

                  {calibration.error && (
                    <div className="info-note">
                      <CircleHelp size={16} />
                      <span>{calibration.error}</span>
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="button"
                      onClick={calibration.startCollection}
                      disabled={
                        calibration.isCollecting ||
                        calibration.sampleCount >= calibration.minimumSamples
                      }
                    >
                      {calibration.isCollecting
                        ? "Mengumpulkan sampel..."
                        : "Mulai pengambilan sampel"}
                    </button>

                    <button
                      type="button"
                      onClick={calibration.nextCondition}
                      disabled={
                        calibration.isCollecting ||
                        calibration.sampleCount < calibration.minimumSamples
                      }
                    >
                      {calibration.conditionIndex ===
                      calibration.totalConditions - 1
                        ? "Selesaikan kalibrasi"
                        : "Tahap berikutnya"}
                    </button>
                  </div>
                </>
              )}

              {calibration.result && (
                <>
                  <div className="stat-card">
                    <span>Hasil kalibrasi</span>

                    <strong>
                      {calibration.result.valid
                        ? "Kalibrasi valid"
                        : "Kalibrasi belum valid"}
                    </strong>

                    <small>
                      {calibration.result.valid
                        ? "Kamu sudah dapat memulai monitoring."
                        : "Beberapa kondisi perlu diperbaiki."}
                    </small>
                  </div>

                  {calibration.result.errors.map((message, index) => (
                    <div className="info-note" key={index}>
                      <CircleHelp size={16} />
                      <span>{message}</span>
                    </div>
                  ))}

                  <button type="button" onClick={calibration.resetCalibration}>
                    Ulangi kalibrasi
                  </button>
                </>
              )}
            </div>

            <div className="panel">
              <div className="panel-heading compact">
                <div>
                  <h2>Face State Classification</h2>
                  <p>Klasifikasi fitur wajah secara real-time</p>
                </div>

                <span className="status-icon">
                  <Eye size={20} />
                </span>
              </div>

              <div className="stat-card">
                <span>Eye State</span>
                <strong>{faceState?.eyeState ?? "Menunggu data"}</strong>
              </div>

              <div className="stat-card">
                <span>Head Direction (Yaw)</span>
                <strong>
                  {faceState?.headDirection.yaw ?? "Menunggu data"}
                </strong>
              </div>

              <div className="stat-card">
                <span>Head Direction (Pitch)</span>
                <strong>
                  {faceState?.headDirection.pitch ?? "Menunggu data"}
                </strong>
              </div>

              <div className="stat-card">
                <span>Head Deviation</span>
                <strong>
                  {faceState
                    ? `Yaw: ${faceState.headDeviation.yaw.toFixed(2)}° | Pitch: ${faceState.headDeviation.pitch.toFixed(2)}° | Roll: ${faceState.headDeviation.roll.toFixed(2)}°`
                    : "Menunggu data"}
                </strong>
              </div>

              <div className="info-note">
                <CircleHelp size={16} />
                <span>
                  Hasil ini menunjukkan kondisi mata dan posisi kepala, bukan
                  penilaian fokus atau distraksi secara langsung.
                </span>
              </div>
            </div>

            <div className="panel">
              <div className="panel-heading compact">
                <div>
                  <h2>Temporal Tracking</h2>
                  <p>Durasi kondisi wajah secara real-time</p>
                </div>

                <span className="status-icon">
                  <Clock3 size={20} />
                </span>
              </div>

              <div className="stat-card">
                <span>Durasi mata</span>
                <strong>
                  {temporalState?.eyeState.value ?? "Menunggu data"}
                </strong>
                <small>
                  {temporalState
                    ? `${(temporalState.eyeState.durationMs / 1000).toFixed(1)} detik`
                    : "Belum tersedia"}
                </small>
              </div>

              <div className="stat-card">
                <span>Durasi arah kepala (Yaw)</span>
                <strong>
                  {temporalState?.yawDirection.value ?? "Menunggu data"}
                </strong>
                <small>
                  {temporalState
                    ? `${(temporalState.yawDirection.durationMs / 1000).toFixed(1)} detik`
                    : "Belum tersedia"}
                </small>
              </div>

              <div className="stat-card">
                <span>Durasi arah kepala (Pitch)</span>
                <strong>
                  {temporalState?.pitchDirection.value ?? "Menunggu data"}
                </strong>
                <small>
                  {temporalState
                    ? `${(temporalState.pitchDirection.durationMs / 1000).toFixed(1)} detik`
                    : "Belum tersedia"}
                </small>
              </div>

              <div className="info-note">
                <CircleHelp size={16} />
                <span>
                  Durasi dihitung selama monitoring aktif. Jeda deteksi lebih
                  dari satu detik akan memulai ulang penghitung.
                </span>
              </div>
            </div>

            <div className="panel stats-panel">
              <div className="panel-heading compact">
                <div>
                  <h2>Ringkasan sesi</h2>
                  <p>Informasi sesi saat ini</p>
                </div>

                <Clock3 size={19} className="muted-icon" />
              </div>

              <div className="stat-card">
                <span>Durasi sesi</span>
                <strong>{formatTime(elapsed)}</strong>
              </div>

              <div className="stat-card">
                <span>Indikasi distraksi</span>
                <strong className="stat-pending">—</strong>
                <small>Menunggu pengembangan klasifikasi perilaku</small>
              </div>

              <div className="stat-card">
                <span>Eye Aspect Ratio (EAR)</span>

                <strong>
                  {eyeMetrics.averageEAR !== null
                    ? eyeMetrics.averageEAR.toFixed(3)
                    : "—"}
                </strong>

                <small>
                  Mata kanan:{" "}
                  {eyeMetrics.rightEAR !== null
                    ? eyeMetrics.rightEAR.toFixed(3)
                    : "—"}
                  {" | "}
                  Mata kiri:{" "}
                  {eyeMetrics.leftEAR !== null
                    ? eyeMetrics.leftEAR.toFixed(3)
                    : "—"}
                </small>
              </div>

              <div className="stat-card">
                <span>Indikator posisi kepala</span>

                <small>
                  Head yaw:{" "}
                  {Number.isFinite(faceFeatures?.headYaw)
                    ? faceFeatures.headYaw.toFixed(3)
                    : "—"}
                </small>

                <small>
                  Head pitch:{" "}
                  {Number.isFinite(faceFeatures?.headPitch)
                    ? faceFeatures.headPitch.toFixed(3)
                    : "—"}
                </small>

                <small>
                  Head roll:{" "}
                  {Number.isFinite(faceFeatures?.headRoll)
                    ? faceFeatures.headRoll.toFixed(2)
                    : "—"}
                </small>
              </div>
            </div>

            <DatasetCollectionPanel
              monitoring={monitoring}
              faceReady={datasetFeatures !== null}
              collector={datasetCollector}
            />
            <div className="tip-card">
              <div className="tip-icon">
                <ShieldCheck size={18} />
              </div>

              <div>
                <strong>Privasi kamu penting</strong>
                <p>
                  Kamera hanya digunakan setelah kamu memberi izin. Versi ini
                  belum menyimpan rekaman.
                </p>
              </div>
            </div>
          </aside>
        </section>

        <section className="how-section">
          <div className="section-title">
            <div>
              <p className="eyebrow">CARA KERJA</p>
              <h2>Tiga langkah sederhana</h2>
            </div>
          </div>

          <div className="steps-grid">
            <article className="step-card">
              <span className="step-number">01</span>
              <div className="step-icon">
                <Camera size={20} />
              </div>
              <h3>Aktifkan kamera</h3>
              <p>Izinkan browser mengakses webcam agar wajah terlihat.</p>
            </article>

            <article className="step-card">
              <span className="step-number">02</span>
              <div className="step-icon">
                <ScanFace size={20} />
              </div>
              <h3>Analisis wajah</h3>
              <p>
                MediaPipe akan membaca landmark wajah dan memperkirakan arah
                kepala serta tatapan.
              </p>
            </article>

            <article className="step-card">
              <span className="step-number">03</span>
              <div className="step-icon">
                <Activity size={20} />
              </div>
              <h3>Terima pengingat</h3>
              <p>
                Sistem dapat memberi peringatan jika indikasi distraksi melewati
                batas durasi.
              </p>
            </article>
          </div>
        </section>

        <footer>
          FOCUSLY <span>•</span> Prototype aplikasi pemantauan indikasi fokus
        </footer>
      </main>
    </div>
  );
}
