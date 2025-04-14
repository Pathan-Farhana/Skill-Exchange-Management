import React from "react";
import { useParams, Navigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import ChatList from "../components/ChatList";
import ChatWindow from "../components/ChatWindow";

const Chat = () => {
  const { userEmail } = useParams();
  const { isSignedIn, isLoaded } = useAuth();

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100" style={{ height: "calc(100vh - 56px)" }}>
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="w-full h-full flex bg-gray-100" style={{ height: "calc(100vh - 56px)" }}>
      <div className={`${userEmail ? "hidden md:block md:w-1/3 lg:w-1/4" : "w-full"} border-r border-gray-200`}>
        <ChatList />
      </div>
      <div className={`${userEmail ? "w-full md:w-2/3 lg:w-3/4" : "hidden"}`}>
        {userEmail && <ChatWindow userEmail={userEmail} />}
      </div>
    </div>
  );
};

export default Chat;
