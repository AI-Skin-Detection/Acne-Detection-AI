import { useState } from "react";

const API = "http://127.0.0.1:8000";

export default function AcneDetector() {

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = (e: any) => {
    const file = e.target.files[0];

    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const analyzeImage = async () => {

    if (!selectedFile) {
      alert("Upload an image first");
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
        body: formData
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

<section className="py-20 bg-black">

<div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">

{/* LEFT SIDE */}

<div className="border border-gray-800 p-6 rounded-lg">

{preview ? (

<div>

<img src={preview} className="w-full rounded"/>

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

<div className="border border-dashed border-gray-700 p-16 text-center">

<p className="text-gray-400 mb-4">
Upload acne image
</p>

<input
type="file"
accept="image/*"
onChange={handleUpload}
/>

</div>

)}

<button
onClick={analyzeImage}
disabled={loading}
className="mt-6 w-full bg-green-500 hover:bg-green-600 text-black font-semibold py-3 rounded"
>

{loading ? "Analyzing..." : "Analyze Image"}

</button>

</div>

{/* RIGHT PANEL */}

<div className="border border-gray-800 p-10 rounded-lg flex items-center justify-center">

{result ? (

<div className="text-center">

<h2 className="text-3xl text-green-400 font-bold mb-3">
{result.prediction}
</h2>

<p className="text-gray-300">
Confidence: {result?.confidence ? result.confidence.toFixed(2) : "0"}%
</p>

</div>

) : (

<p className="text-gray-500">
Awaiting Input
</p>

)}

</div>

</div>

</section>

  );
}