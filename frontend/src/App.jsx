import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SkillExchangeNavbar from "./components/Navbar";
import Home from "./pages/Home";
// If you need a profile form:
import ProfileForm from "./components/form"; // Ensure the file exists

function App() {
  return (
    <Router>
      <SkillExchangeNavbar />
      <Routes>
        <Route path="/" element={<Home />} />
      
        <Route path="/profile" element={<ProfileForm />} /> 
      </Routes>
    </Router>
  );
}

export default App;
