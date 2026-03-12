import { useEffect, useRef, useState } from "react";

const API = "http://127.0.0.1:8000";

export default function AcneDetector() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const predictionLabel = result?.prediction ?? result?.predicted_class;

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
    setIsCameraReady(false);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
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
      setResult(null);
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
      setResult(null);
      stopCamera();
    }, "image/png");
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const analyzeImage = async () => {
    if (!selectedFile) {
      alert("Upload or capture an image first");
      return;
    }

    const storedId = localStorage.getItem("user_id");

    if (!storedId) {
      alert("Please login first");
      return;
    }

    // FastAPI expects integer user_id
    const user_id = Number(storedId);

    const formData = new FormData();

    // MUST match backend parameters in main.py
    formData.append("file", selectedFile);
    formData.append("user_id", user_id.toString());

    try {
      setLoading(true);

      const response = await fetch(`${API}/predict`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Backend error:", data);
        alert("Prediction failed");
        setLoading(false);
        return;
      }

      // Handle backend error responses safely
      if (data.error) {
        console.error("Backend error:", data.error);
        alert(data.error);
        setLoading(false);
        return;
      }

      setResult(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      alert("Server error");
      setLoading(false);
    }
  };

  return (
    <section id="detector" className="py-20 bg-black">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* LEFT SIDE */}
        <div className="border border-gray-800 p-6 rounded-lg">
          {preview ? (
            <div>
              <img src={preview} className="w-full rounded" />
              <button
                onClick={() => {
                  setPreview(null);
                  setSelectedFile(null);
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
                  className="text-gray-300"
                />
              </div>

              <div className="flex flex-col items-center gap-3">
                <p className="text-gray-500 text-sm">or</p>
                <button
                  type="button"
                  onClick={openCamera}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-black font-semibold rounded"
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
                    <span className="text-gray-300 text-sm">
                      Starting camera...
                    </span>
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
              {/* Hidden canvas used for capturing a frame from the video */}
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

        {/* RIGHT PANEL */}
        <div className="border border-gray-800 p-10 rounded-lg flex items-center justify-center">
          {result ? (
            <div className="text-center">
              {result.heatmap ? (
                <div className="mb-6">
                  <p className="text-gray-300 mb-3">Acne Heatmap (Grad-CAM)</p>
                  <img
                    src={result.heatmap}
                    className="w-full rounded"
                    alt="Grad-CAM heatmap overlay"
                  />
                </div>
              ) : null}

              <h2 className="text-3xl text-green-400 font-bold mb-3">
                {predictionLabel}
              </h2>

              <p className="text-gray-300">
                Confidence:{" "}
                {result?.confidence ? result.confidence.toFixed(2) : "0"}%
              </p>
            </div>
          ) : (
            <p className="text-gray-500">Awaiting Input</p>
          )}
        </div>
      </div>
    </section>
  );
}