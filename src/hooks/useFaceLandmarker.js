import { extractFaceFeatures } from "../features/extractFaceFeatures";
import { useEffect, useRef, useState } from "react";
import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";
import { calculateBothEyesEAR } from "../features/eyeFeatures";

export default function useFaceLandmarker({
  videoRef,
  canvasRef,
  stageRef,
  cameraOn,
}) {
  const landmarkerRef = useRef(null);
  const animationRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);
  const matrixLoggedRef = useRef(false);

  const [modelReady, setModelReady] = useState(false);
  const [faceStatus, setFaceStatus] = useState("Model sedang dimuat...");
  const [eyeMetrics, setEyeMetrics] = useState({
    rightEAR: null,
    leftEAR: null,
    averageEAR: null,
  });

  const [faceFeatures, setFaceFeatures] = useState(null);

  // 1. Memuat model MediaPipe
  useEffect(() => {
    let cancelled = false;

    async function loadModel() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm",
        );

        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "/models/face_landmarker.task",
            delegate: "CPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFacialTransformationMatrixes: true,
        });

        if (cancelled) {
          landmarker.close();
          return;
        }

        landmarkerRef.current = landmarker;
        setModelReady(true);
        setFaceStatus("MediaPipe siap digunakan");
      } catch (error) {
        console.error("MediaPipe error:", error);

        if (!cancelled) {
          setFaceStatus("Gagal memuat model MediaPipe");
        }
      }
    }

    loadModel();

    return () => {
      cancelled = true;

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      landmarkerRef.current?.close();
      landmarkerRef.current = null;
    };
  }, []);

  // 2. Membersihkan canvas ketika kamera mati
  useEffect(() => {
    if (cameraOn) return;

    const canvas = canvasRef.current;

    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    lastVideoTimeRef.current = -1;
    setEyeMetrics({
      rightEAR: null,
      leftEAR: null,
      averageEAR: null,
    });
    setFaceStatus(
      modelReady ? "Wajah belum terdeteksi" : "Model sedang dimuat...",
    );
  }, [cameraOn, modelReady, canvasRef]);

  // 3. Mendeteksi wajah dan menggambar landmark
  useEffect(() => {
    if (!cameraOn || !modelReady) return;

    let active = true;

    function detectFace() {
      if (!active) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const stage = stageRef.current;
      const landmarker = landmarkerRef.current;

      if (video && canvas && stage && landmarker && video.readyState >= 2) {
        if (video.currentTime !== lastVideoTimeRef.current) {
          try {
            const result = landmarker.detectForVideo(video, performance.now());
            if (!matrixLoggedRef.current) {
              console.log(
                "Facial transformation matrix:",
                result.facialTransformationMatrixes,
              );
              matrixLoggedRef.current = true;
            }

            const videoWidth = video.videoWidth;
            const videoHeight = video.videoHeight;

            if (videoWidth > 0 && videoHeight > 0) {
              const width = stage.clientWidth;
              const height = stage.clientHeight;

              if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
              }

              const ctx = canvas.getContext("2d");
              ctx.clearRect(0, 0, width, height);

              // Menyesuaikan object-fit: cover
              const scale = Math.max(width / videoWidth, height / videoHeight);

              const renderedWidth = videoWidth * scale;
              const renderedHeight = videoHeight * scale;

              const offsetX = (renderedWidth - width) / 2;
              const offsetY = (renderedHeight - height) / 2;

              const faces = result.faceLandmarks;

              if (faces && faces.length > 0) {
                setFaceStatus("Wajah berhasil terdeteksi");

                const transformationMatrix =
                  result.facialTransformationMatrixes?.[0] ?? null;

                const features = extractFaceFeatures(
                  faces[0],
                  transformationMatrix,
                );

                setFaceFeatures(features);

                setEyeMetrics(
                  features
                    ? {
                        rightEAR: features.rightEAR,
                        leftEAR: features.leftEAR,
                        averageEAR: features.averageEAR,
                      }
                    : {
                        rightEAR: null,
                        leftEAR: null,
                        averageEAR: null,
                      },
                );
                faces[0].forEach((point) => {
                  // Koordinat horizontal dicerminkan
                  const originalX = point.x * renderedWidth - offsetX;

                  const x = width - originalX;

                  // Koordinat vertikal
                  const y = point.y * renderedHeight - offsetY;

                  ctx.beginPath();
                  ctx.arc(x, y, 2, 0, 2 * Math.PI);
                  ctx.fillStyle = "#22c55e";
                  ctx.fill();
                });
              } else {
                setFaceStatus("Wajah belum terdeteksi");
                setFaceFeatures(null);

                setEyeMetrics({
                  rightEAR: null,
                  leftEAR: null,
                  averageEAR: null,
                });
              }
            }

            lastVideoTimeRef.current = video.currentTime;
          } catch (error) {
            console.error("Deteksi wajah error:", error);
          }
        }
      }

      if (active) {
        animationRef.current = requestAnimationFrame(detectFace);
      }
    }

    detectFace();

    return () => {
      active = false;

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [cameraOn, modelReady, videoRef, canvasRef, stageRef]);

  return {
    faceStatus,
    eyeMetrics,
    faceFeatures,
  };
}
