import { Route, Routes } from "react-router-dom";

import Header from "./components/common/Header.jsx";
import Feedback from "./pages/Feedback.jsx";
import Home from "./pages/Home.jsx";
import Interview from "./pages/Interview.jsx";

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/interview/:sessionId" element={<Interview />} />
          <Route path="/feedback/:sessionId" element={<Feedback />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
