import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Survey from "./pages/Survey";
import History from "./pages/History";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/survey" element={<Survey />} />
        <Route path="/history" element={<History />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      <div className="text-center text-xs text-gray-400 py-4">
        ⚠ This tool is for educational purposes only and should not be considered medical advice. Consult a dermatologist.
      </div>
    </BrowserRouter>
  );
}

export default App;