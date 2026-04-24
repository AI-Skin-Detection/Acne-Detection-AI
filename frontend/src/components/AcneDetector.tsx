import { useEffect, useRef, useState } from "react";

const API = "http://127.0.0.1:8000";

type Detection = {
  class: string;
  confidence: number;
  bbox: [number, number, number, number];
};

type ApiResult = {
  prediction?: string;
  predicted_class?: string;
  confidence?: number;
  detections?: Detection[];
  yolo_image?: string;
  severity?: string;
  severity_score?: number;
  recommendation?: string;
  disclaimer?: string;
  error?: string;
};

type PreviewMetrics = {
  displayWidth: number;
  displayHeight: number;
  naturalWidth: number;
  naturalHeight: number;
};

export default function AcneDetector() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewMetrics, setPreviewMetrics] = useState<PreviewMetrics | null>(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewImageRef = useRef<HTMLImageElement | null>(null);

  const predictionLabel = result?.prediction ?? result?.predicted_class;
  const isClearSkinResult = (predictionLabel ?? "").toLowerCase() === "clear skin";
  const userId = localStorage.getItem("user_id");

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
    setIsCameraReady(false);
  };

  const resetAnalysis = () => {
    setResult(null);
    setDetections([]);
    setPreviewMetrics(null);
  };

  const syncPreviewMetrics = () => {
    const image = previewImageRef.current;

    if (!image) return;

    const rect = image.getBoundingClientRect();

    if (!rect.width || !rect.height || !image.naturalWidth || !image.naturalHeight) {
      return;
    }

    setPreviewMetrics({
      displayWidth: rect.width,
      displayHeight: rect.height,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
    });
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      resetAnalysis();
      stopCamera();
    }
  };

  const openCamera = async () => {
    try {
      setIsCameraOpen(true);
      setIsCameraReady(false);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      resetAnalysis();
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check browser permissions.");
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], "captured-image.png", {
        type: "image/png",
      });

      setSelectedFile(file);
      setPreview(canvas.toDataURL("image/png"));
      resetAnalysis();
      stopCamera();
    }, "image/png");
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (!preview) return;

    const handleResize = () => {
      syncPreviewMetrics();
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [preview]);

  const analyzeImage = async () => {
    if (!userId) {
      alert("Please login first to analyze images");
      window.location.href = "/login";
      return;
    }

    if (!selectedFile) {
      alert("Upload or capture an image first");
      return;
    }

    const user_id = Number(userId);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("user_id", user_id.toString());

    try {
      setLoading(true);

      const response = await fetch(`${API}/predict`, {
        method: "POST",
        body: formData,
      });

      const data: ApiResult = await response.json();

      if (!response.ok) {
        console.error("Backend error:", data);
        alert("Prediction failed");
        setLoading(false);
        return;
      }

      if (data.error) {
        console.error("Backend error:", data.error);
        alert(data.error);
        setLoading(false);
        return;
      }

      setResult(data);
      setDetections(data.detections ?? []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      alert("Server error");
      setLoading(false);
    }
  };

  const renderDetectionOverlay = () => {
    if (!previewMetrics || detections.length === 0) return null;

    const { displayWidth, displayHeight, naturalWidth, naturalHeight } = previewMetrics;
    if (!displayWidth || !displayHeight || !naturalWidth || !naturalHeight) return null;

    const scaleX = displayWidth / naturalWidth;
    const scaleY = displayHeight / naturalHeight;

    return (
      <div className="absolute inset-0 pointer-events-none">
        {detections.map((detection, index) => {
          const [x1, y1, x2, y2] = detection.bbox;
          const left = x1 * scaleX;
          const top = y1 * scaleY;
          const width = Math.max((x2 - x1) * scaleX, 1);
          const height = Math.max((y2 - y1) * scaleY, 1);

          return (
            <div
              key={`${detection.class}-${index}`}
              className="absolute border-2 border-green-400 bg-green-400/10"
              style={{ left, top, width, height }}
            >
              <div className="absolute -top-7 left-0 bg-green-400 text-black text-[10px] font-semibold px-2 py-1 rounded-sm whitespace-nowrap shadow-md">
                {detection.class} {detection.confidence.toFixed(1)}%
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <section id="detector" className="py-20 bg-black">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="border border-gray-800 p-6 rounded-lg">
          {preview ? (
            <div>
              <div className="relative w-full overflow-hidden rounded">
                <img
                  ref={previewImageRef}
                  src={preview}
                  className="block w-full rounded"
                  alt="Uploaded acne preview"
                  onLoad={syncPreviewMetrics}
                />
                {renderDetectionOverlay()}
              </div>
              <button
                onClick={() => {
                  setPreview(null);
                  setSelectedFile(null);
                  resetAnalysis();
                }}
                className="text-gray-400 mt-3"
              >
                Remove Image
              </button>
            </div>
          ) : (
            <div className="border border-dashed border-gray-700 p-16 text-center space-y-4">
              <div>
                <p className="text-gray-400 mb-2">Upload acne image</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="hidden"
                  id="fileUpload"
                />
                <label
                  htmlFor="fileUpload"
                  className="inline-block px-4 py-2 border border-green-500 text-green-500 rounded hover:bg-green-500 hover:text-black transition cursor-pointer"
                >
                  Choose File
                </label>
              </div>

              <div className="flex flex-col items-center gap-3">
                <p className="text-gray-500 text-sm">or</p>
                <button
                  type="button"
                  onClick={openCamera}
                  className="px-4 py-2 border border-green-500 text-green-500 rounded hover:bg-green-500 hover:text-black transition"
                >
                  Capture Live Photo
                </button>
              </div>
            </div>
          )}

          {isCameraOpen && (
            <div className="mt-6 space-y-3">
              <div className="aspect-video bg-black border border-gray-700 rounded overflow-hidden flex items-center justify-center relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  onCanPlay={() => setIsCameraReady(true)}
                  className="w-full h-full object-cover"
                />
                {!isCameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <span className="text-gray-300 text-sm">Starting camera...</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-black font-semibold py-2 rounded"
                >
                  Capture
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-100 font-semibold py-2 rounded"
                >
                  Close Camera
                </button>
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          <button
            onClick={analyzeImage}
            disabled={loading}
            className="mt-6 w-full bg-green-500 hover:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold py-3 rounded"
          >
            {loading ? "Analyzing..." : "Analyze Image"}
          </button>
        </div>

        <div className="border border-gray-800 p-10 rounded-lg flex items-center justify-center">
          {result ? (
            <div className="text-center w-full">
              {!isClearSkinResult && result.yolo_image ? (
                <div className="mb-6">
                  <p className="text-gray-300 mb-3 font-semibold">YOLO Detection — Acne Localization</p>
                  <img
                    src={result.yolo_image}
                    className="w-full rounded border border-green-700"
                    alt="YOLO bounding box detection"
                  />
                </div>
              ) : null}

              <h2 className="text-3xl text-green-400 font-bold mb-3">
                {predictionLabel}
              </h2>

              {isClearSkinResult && (
                <p className="text-gray-300 mb-2">
                  Skin appears clear in this image.
                </p>
              )}

              <p className="text-gray-300">
                Confidence: {result?.confidence ? result.confidence.toFixed(2) : "0"}%
              </p>

              {/* Severity */}
              {!isClearSkinResult && result.severity && (
                <>
                  {
                    // Severity color helper and usage
                  }
                  {(() => {
                    const getSeverityStyles = (severity?: string) => {
                      switch (severity) {
                        case "No Acne":
                          return { bar: "bg-green-500", text: "text-green-400" };
                        case "Mild":
                          return { bar: "bg-green-400", text: "text-green-300" };
                        case "Moderate":
                          return { bar: "bg-yellow-400", text: "text-yellow-400" };
                        case "Severe":
                          return { bar: "bg-red-500", text: "text-red-500" };
                        default:
                          return { bar: "bg-gray-500", text: "text-gray-400" };
                      }
                    };
                    const styles = getSeverityStyles(result.severity);
                    return (
                      <div className="mt-4">
                        <p className="text-gray-300 mb-1">Severity</p>
                        <div className="w-full bg-gray-700 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${styles.bar}`}
                            style={{ width: `${result.severity_score ?? 0}%` }}
                          ></div>
                        </div>
                        <p className={`text-sm mt-1 ${styles.text}`}>
                          {result.severity}
                        </p>
                      </div>
                    );
                  })()}
                </>
              )}

              {/* Recommendation */}
              {!isClearSkinResult && result.recommendation && (
                <p className="mt-4 text-gray-300">
                  Recommendation: {result.recommendation}
                </p>
              )}

              {/* Disclaimer */}
              {result.disclaimer && (
                <p className="text-yellow-400 text-xs mt-2">
                  ⚠ {result.disclaimer}
                </p>
              )}

              <button
                onClick={async () => {
                  if (!predictionLabel || result?.confidence == null) {
                    alert("Run analysis first");
                    return;
                  }

                  const res = await fetch(`${API}/generate-pdf`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      prediction: predictionLabel,
                      confidence: result.confidence,
                      severity: result.severity,
                      severity_score: result.severity_score,
                      recommendation: result.recommendation,
                      disclaimer: result.disclaimer,
                    }),
                  });

                  if (!res.ok) {
                    alert("Failed to generate PDF report");
                    return;
                  }

                  const blob = await res.blob();
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = "report.pdf";
                  a.click();
                  URL.revokeObjectURL(a.href);
                }}
                className="mt-4 px-4 py-2 bg-green-500 text-black rounded hover:bg-green-600 transition"
              >
                Download Report
              </button>
            </div>
          ) : (
            <p className="text-gray-500">Awaiting Input</p>
          )}
        </div>
      </div>
    </section>
  );
}