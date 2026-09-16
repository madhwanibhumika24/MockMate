import { Route, Routes } from "react-router-dom";

import Feedback from "./pages/Feedback.jsx";
import Home from "./pages/Home.jsx";
import Interview from "./pages/Interview.jsx";

function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/interview/:sessionId" element={<Interview />} />
        <Route path="/feedback/:sessionId" element={<Feedback />} />
      </Routes>
    </div>
  );
}

export default App;
