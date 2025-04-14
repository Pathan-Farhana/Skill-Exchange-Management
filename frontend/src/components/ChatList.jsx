import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useChat } from "../contexts/ChatContext";
import { useAuth, useUser } from "@clerk/clerk-react";

// Format timestamp from Date.now()
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = new Date(now - 86400000).toDateString() === date.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (isYesterday) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString();
  }
};

const EmptyChats = () => {
  const { user } = useUser();
  
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-32 h-32 mb-6 bg-blue-100 rounded-full flex items-center justify-center">
        <svg className="w-16 h-16 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">Welcome, {user?.firstName || user?.username || user?.emailAddresses[0]?.emailAddress?.split('@')[0]}!</h3>
      <p className="text-gray-600 mb-6 max-w-xs">
        You don't have any conversations yet. Start a new chat to connect with someone.
      </p>
      <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
        Start a new chat
      </button>
    </div>
  );
};

const ChatList = () => {
  const navigate = useNavigate();
  const { userEmail } = useParams();
  const [filteredChatList, setFilteredChatList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { getChatList, loading: isLoading } = useChat();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn) {
      // Get the chat list from context and apply search filter if needed
      const chatList = getChatList();
      
      if (searchQuery.trim() === "") {
        setFilteredChatList(chatList);
      } else {
        const query = searchQuery.toLowerCase();
        const filtered = chatList.filter(chat => 
          chat.name.toLowerCase().includes(query) || 
          chat.lastMessage.toLowerCase().includes(query)
        );
        setFilteredChatList(filtered);
      }
    }
  }, [getChatList, searchQuery, isSignedIn]);

  if (!isLoaded) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 bg-white shadow">
          <h5 className="text-xl font-bold text-gray-500">Messages</h5>
        </div>
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Please sign in to view your chats.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 bg-white shadow">
        <h5 className="text-xl font-bold text-gray-500">Messages</h5>
      </div>
      
      {filteredChatList.length > 0 || searchQuery ? (
        <>
          <div className="p-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full py-2 pl-10 pr-4 text-gray-700 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg className="absolute w-5 h-5 text-gray-400 left-3 top-2.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {filteredChatList.length > 0 ? (
              filteredChatList.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => navigate(`/chat/${chat.id}`)}
                  className={`flex items-center p-2 hover:bg-gray-50 cursor-pointer transition-colors ${
                    userEmail === chat.id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className={`flex-shrink-0 w-12 h-12 ${chat.color} rounded-full flex items-center justify-center text-white font-bold`}>
                    {chat.avatar}
                  </div>
                  <div className="ml-4 flex-1 border-b border-gray-100 pb-2">
                    <div className="flex justify-between items-baseline">
                      <h5 className="font-medium text-gray-900">{chat.name}</h5>
                      <span className="text-xs text-gray-500">{formatTimestamp(chat.timestamp)}</span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                  </div>
                  {chat.unread > 0 && (
                    <div className="ml-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {chat.unread}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No matching conversations found
              </div>
            )}
          </div>
        </>
      ) : (
        <EmptyChats />
      )}
    </div>
  );
};

export default ChatList;
