import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RickleMainPage from "./pages/rickle/index";
import RicklePrivacyPolicyPage from "./pages/privacy/index";
import RickleTermsAndConditionsPage from "./pages/terms/index";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/terms-conditions" element={<RickleTermsAndConditionsPage />} />
        <Route path="/privacy-policy" element={<RicklePrivacyPolicyPage />} />
        <Route path="/" element={<RickleMainPage />} />
        <Route path="*" element={<Navigate to={"/"} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
