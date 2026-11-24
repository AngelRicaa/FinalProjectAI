import React from "react";
import { Camera, CameraOff, Play, Square, AlertTriangle } from "lucide-react";

export default function CameraView({
  videoRef,
  canvasRef,
  stageRef,
  cameraOn,
  monitoring,
  cameraError,
  startCamera,
  stopCamera,
  startMonitoring,
  stopMonitoring,
}) {
  return (
    <div className="camera-panel panel">
      <div className="panel-heading">
        <div>
          <h2>Live monitoring</h2>
          <p>Pastikan wajah terlihat jelas di dalam frame.</p>
        </div>

        <span className={`live-pill ${cameraOn ? "is-live" : ""}`}>
          <span className="status-dot" />
          {cameraOn ? "CAMERA ON" : "CAMERA OFF"}
        </span>
      </div>

      <div
        ref={stageRef}
        className={`camera-stage ${cameraOn ? "camera-active" : ""}`}
      >
        <video
          ref={videoRef}
          className="camera-video"
          autoPlay
          muted
          playsInline
        />

        <canvas ref={canvasRef} className="landmark-canvas" />

        {!cameraOn && (
          <div className="camera-placeholder">
            <div className="camera-placeholder-icon">
              <Camera size={28} />
            </div>
            <strong>Kamera belum aktif</strong>
            <span>Aktifkan kamera untuk memulai pemantauan.</span>
          </div>
        )}
      </div>

      {cameraError && (
        <div className="error-message">
          <AlertTriangle size={16} />
          {cameraError}
        </div>
      )}

      <div className="camera-actions">
        {!cameraOn ? (
          <button className="button button-primary" onClick={startCamera}>
            <Camera size={17} />
            Aktifkan kamera
          </button>
        ) : (
          <>
            {!monitoring ? (
              <button
                className="button button-primary"
                onClick={startMonitoring}
              >
                <Play size={17} fill="currentColor" />
                Mulai monitoring
              </button>
            ) : (
              <button className="button button-stop" onClick={stopMonitoring}>
                <Square size={16} fill="currentColor" />
                Akhiri monitoring
              </button>
            )}

            <button className="button button-ghost" onClick={stopCamera}>
              <CameraOff size={17} />
              Matikan kamera
            </button>
          </>
        )}
      </div>
    </div>
  );
}
