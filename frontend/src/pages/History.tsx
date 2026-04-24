import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

interface HistoryItem {
  image_name: string;
  prediction: string;
  created_at?: string | null;
  heatmap?: string | null;
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

  const formatDateTime = (value?: string | null) => {
    if (!value) return "-";
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return value;
      return d.toLocaleString();
    } catch {
      return value;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <h1 className="text-3xl font-bold mb-8 text-green-400">
        Prediction History
      </h1>

      {loading ? (
        <p className="text-gray-400">Loading history...</p>
      ) : history.length === 0 ? (
        <p className="text-gray-400">No previous predictions found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-700 text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="p-3 border border-gray-700">Analyzed Image</th>
                <th className="p-3 border border-gray-700">Image Name</th>
                <th className="p-3 border border-gray-700">Prediction</th>
                <th className="p-3 border border-gray-700">Date &amp; Time</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, index) => (
                <tr key={index} className="text-center">
                  <td className="p-3 border border-gray-700">
                    {item.heatmap ? (
                      <img
                        src={item.heatmap}
                        alt={item.prediction}
                        className="w-24 h-24 object-cover rounded mx-auto"
                      />
                    ) : (
                      <span className="text-gray-500 text-xs">
                        No image available
                      </span>
                    )}
                  </td>
                  <td className="p-3 border border-gray-700">
                    {item.image_name}
                  </td>
                  <td className="p-3 border border-gray-700 text-green-400 font-semibold">
                    {item.prediction}
                  </td>
                  <td className="p-3 border border-gray-700">
                    {formatDateTime(item.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default History;