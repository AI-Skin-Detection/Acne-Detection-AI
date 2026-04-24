import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Survey = () => {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    age: "",
    skinType: "",
    acneFrequency: "",
    acneLocation: "",
    painfulAcne: "",
    water: "",
    sleep: "",
    stress: "",
    skincare: "",
    sunscreen: ""
  });

  const handleChange = (e: any) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = () => {

    // Save answers
    localStorage.setItem("survey", JSON.stringify(form));

    // Redirect to detector
    navigate("/");
  };

  return (

<div className="min-h-screen bg-black text-white p-10">

<h1 className="text-4xl font-bold text-center mb-10 text-green-400">
Skin Health Survey
</h1>

<div className="max-w-3xl mx-auto space-y-6">

{/* Age */}

<div>
<label className="block mb-2">Age</label>
<input
type="number"
name="age"
onChange={handleChange}
className="w-full p-3 bg-black border border-gray-700 rounded"
/>
</div>

{/* Skin Type */}

<div>
<label className="block mb-2">Skin Type</label>
<select
name="skinType"
onChange={handleChange}
className="w-full p-3 bg-black border border-gray-700 rounded"
>
<option value="">Select</option>
<option>Oily</option>
<option>Dry</option>
<option>Combination</option>
<option>Sensitive</option>
</select>
</div>

{/* Acne Frequency */}

<div>
<label className="block mb-2">
How often do you get acne?
</label>

<select
name="acneFrequency"
onChange={handleChange}
className="w-full p-3 bg-black border border-gray-700 rounded"
>
<option value="">Select</option>
<option>Rarely</option>
<option>Sometimes</option>
<option>Frequently</option>
</select>
</div>

{/* Acne Location */}

<div>
<label className="block mb-2">
Where does acne usually appear?
</label>

<select
name="acneLocation"
onChange={handleChange}
className="w-full p-3 bg-black border border-gray-700 rounded"
>
<option value="">Select</option>
<option>Forehead</option>
<option>Nose</option>
<option>Cheeks</option>
<option>Chin</option>
<option>Back</option>
</select>
</div>

{/* Painful Acne */}

<div>
<label className="block mb-2">
Do you experience painful acne?
</label>

<select
name="painfulAcne"
onChange={handleChange}
className="w-full p-3 bg-black border border-gray-700 rounded"
>
<option value="">Select</option>
<option>Yes</option>
<option>No</option>
</select>
</div>

{/* Water Intake */}

<div>
<label className="block mb-2">
Daily Water Intake
</label>

<select
name="water"
onChange={handleChange}
className="w-full p-3 bg-black border border-gray-700 rounded"
>
<option value="">Select</option>
<option>&lt; 1L</option>
<option>1–2L</option>
<option>2L+</option>
</select>
</div>

{/* Sleep */}

<div>
<label className="block mb-2">
Sleep Duration
</label>

<select
name="sleep"
onChange={handleChange}
className="w-full p-3 bg-black border border-gray-700 rounded"
>
<option value="">Select</option>
<option>&lt; 5 hours</option>
<option>6–7 hours</option>
<option>8+ hours</option>
</select>
</div>

{/* Stress */}

<div>
<label className="block mb-2">
Stress Level
</label>

<select
name="stress"
onChange={handleChange}
className="w-full p-3 bg-black border border-gray-700 rounded"
>
<option value="">Select</option>
<option>Low</option>
<option>Medium</option>
<option>High</option>
</select>
</div>

{/* Skincare */}

<div>
<label className="block mb-2">
Do you use skincare products?
</label>

<select
name="skincare"
onChange={handleChange}
className="w-full p-3 bg-black border border-gray-700 rounded"
>
<option value="">Select</option>
<option>Yes</option>
<option>No</option>
</select>
</div>

{/* Sunscreen */}

<div>
<label className="block mb-2">
Do you use sunscreen?
</label>

<select
name="sunscreen"
onChange={handleChange}
className="w-full p-3 bg-black border border-gray-700 rounded"
>
<option value="">Select</option>
<option>Yes</option>
<option>No</option>
</select>
</div>

{/* Submit */}

<button
onClick={handleSubmit}
className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold py-3 rounded mt-6"
>
Continue to AI Detection
</button>

</div>

</div>

  );
};

export default Survey;