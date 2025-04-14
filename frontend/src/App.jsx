import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SkillExchangeNavbar from "./components/Navbar";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import ProfileForm from "./components/form";
import { ClerkLoaded, ClerkLoading } from "@clerk/clerk-react";

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <ClerkLoading>
          <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-white z-50">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </ClerkLoading>
        
        <ClerkLoaded>
          <SkillExchangeNavbar />
          <main className="flex-1 pt-16">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/profile" element={<ProfileForm />} /> 
              <Route path="/chat/:userEmail?" element={<Chat />} />
            </Routes>
          </main>
        </ClerkLoaded>
      </div>
    </Router>
  );
}

export default App;
