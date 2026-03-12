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

        {/* Main Landing Page */}
        <Route path="/" element={<Index />} />

        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Survey */}
        <Route path="/survey" element={<Survey />} />

        {/* History */}
        <Route path="/history" element={<History />} />

        {/* Catch all */}
        <Route path="*" element={<NotFound />} />

      </Routes>

    </BrowserRouter>
  );
}

export default App;