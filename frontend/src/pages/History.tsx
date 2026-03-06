import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

interface HistoryItem {
  image_name: string;
  prediction: string;
}

const History = () => {

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const fetchHistory = async () => {

      const userId = localStorage.getItem("user_id");

      if (!userId) {
        alert("Please login first");
        return;
      }

      try {

        const response = await fetch(`${API}/history/${userId}`);

        const data = await response.json();

        setHistory(data);
        setLoading(false);

      } catch (error) {

        console.error("History fetch error:", error);
        alert("Failed to load history");

      }

    };

    fetchHistory();

  }, []);

  return (

<div className="min-h-screen bg-black text-white p-10">

<h1 className="text-3xl font-bold mb-8 text-green-400">
Prediction History
</h1>

{loading ? (

<p className="text-gray-400">Loading history...</p>

) : history.length === 0 ? (

<p className="text-gray-400">
No previous predictions found.
</p>

) : (

<table className="w-full border border-gray-700">

<thead className="bg-gray-900">

<tr>

<th className="p-3 border border-gray-700">
Image Name
</th>

<th className="p-3 border border-gray-700">
Prediction
</th>

</tr>

</thead>

<tbody>

{history.map((item, index) => (

<tr key={index} className="text-center">

<td className="p-3 border border-gray-700">
{item.image_name}
</td>

<td className="p-3 border border-gray-700 text-green-400 font-semibold">
{item.prediction}
</td>

</tr>

))}

</tbody>

</table>

)}

</div>

  );

};

export default History;