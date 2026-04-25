import { useEffect, useRef, useState } from "react";

const API = "http://127.0.0.1:8000";

export default function AcneDetector() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const predictionLabel = result?.prediction;

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const openCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      alert("Camera permission denied");
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (ctx) {
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const file = new File([blob], "captured.png", { type: "image/png" });
        setSelectedFile(file);
        setPreview(canvas.toDataURL("image/png"));
        setResult(null);
        stopCamera();
      });
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const analyzeImage = async () => {
    if (!selectedFile) return;

    const user_id = Number(localStorage.getItem("user_id"));

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("user_id", user_id.toString());

    try {
      setLoading(true);
      const res = await fetch(`${API}/predict`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setResult(data);
      setLoading(false);
    } catch {
      alert("Server error");
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    if (!result) return;

    const res = await fetch(`${API}/report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(result),
    });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "report.pdf";
    a.click();
  };

  return (
    <section className="py-20 bg-black">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10">

        {/* LEFT */}
        <div className="border border-gray-800 p-6 rounded-lg">
          {preview ? (
            <div className="space-y-4">
              <img src={preview} className="w-full rounded" />

              <button
                onClick={() => {
                  setPreview(null);
                  setSelectedFile(null);
                  setResult(null);
                }}
                className="w-full bg-red-500 text-white py-2 rounded font-semibold hover:scale-105 transition"
              >
                Remove Image
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="w-full block border border-green-500 text-green-400 py-2 rounded-lg text-center cursor-pointer font-semibold hover:bg-green-500 hover:text-black transition duration-200">
                Choose Image
                <input
                  type="file"
                  onChange={handleUpload}
                  className="hidden"
                />
              </label>

              <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                <div className="flex-1 h-px bg-gray-700"></div>
                OR
                <div className="flex-1 h-px bg-gray-700"></div>
              </div>

              <button
                onClick={openCamera}
                className="w-full border border-green-500 text-green-400 py-2 rounded-lg font-semibold hover:bg-green-500 hover:text-black transition duration-200"
              >
                Open Camera
              </button>
            </div>
          )}

          {isCameraOpen && (
            <div className="mt-4 space-y-3">
              <video ref={videoRef} className="w-full rounded" />

              <div className="flex gap-2">
                <button
                  onClick={capturePhoto}
                  className="flex-1 bg-green-500 text-black py-2 rounded"
                >
                  Capture
                </button>

                <button
                  onClick={stopCamera}
                  className="flex-1 bg-gray-700 text-white py-2 rounded"
                >
                  Close
                </button>
              </div>

              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          <button
            onClick={analyzeImage}
            disabled={loading}
            className="mt-6 w-full bg-green-500 text-black py-2 rounded"
          >
            {loading ? "Analyzing..." : "Analyze Image"}
          </button>
        </div>

        {/* RIGHT */}
        <div className="border border-gray-800 p-6 rounded-lg text-center">
          {result ? (
            <>
              {result.heatmap && (
                <img src={result.heatmap} className="mb-4 rounded" />
              )}

              <h2 className="text-2xl text-green-400 font-bold">
                {predictionLabel}
              </h2>

              <p className="text-gray-300 mt-2">
                Confidence: {result.confidence?.toFixed(2)}%
              </p>

              {result.severity && (
                <div className="mt-4">
                  <div className="w-full bg-gray-700 h-3 rounded">
                    <div
                      className={`h-3 rounded ${
                        result.severity === "Mild Acne"
                          ? "bg-green-400"
                          : result.severity === "Moderate Acne"
                          ? "bg-yellow-400"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${result.severity_score}%` }}
                    />
                  </div>
                  <p className="text-white mt-1">{result.severity}</p>
                </div>
              )}

              {result.recommendation && (
                <p className="mt-4 text-gray-300">
                  <span className="text-green-400 font-semibold">
                    Recommendation:
                  </span>{" "}
                  {result.recommendation}
                </p>
              )}

              {/* BRIGHT DISCLAIMER */}
              {result.disclaimer && (
                <p className="mt-4 text-sm text-yellow-400 font-medium">
                  ⚠ {result.disclaimer}
                </p>
              )}

              <button
                onClick={downloadReport}
                className="mt-6 bg-blue-500 text-black px-4 py-2 rounded"
              >
                Download Report
              </button>
            </>
          ) : (
            <p className="text-gray-500">Awaiting Input</p>
          )}
        </div>

      </div>
    </section>
  );
}