import React, { useEffect, useState, useRef } from "react";
import { useAuth, useUser, useSession } from "@clerk/clerk-react";
import { useChat } from "../contexts/ChatContext";

const ChatWindow = ({ userEmail }) => {
  const [newMsg, setNewMsg] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [userStatus, setUserStatus] = useState({ online: false, lastSeen: null });
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  
  const { getChatMessages, sendMessage, joinChatRoom, checkUserStatus, markChatAsRead, isConnected } = useChat();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { session } = useSession();
  
  // Get messages for this specific user from the context
  const messages = getChatMessages(userEmail) || [];
  
  // Format timestamp for display
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
  
  // Format last seen time
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return "Unknown";
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Join chat room when component mounts
  useEffect(() => {
    if (userEmail && isSignedIn && session) {
      joinChatRoom(userEmail);
      markChatAsRead(userEmail);
      
      // Check user status
      const checkStatus = async () => {
        const status = await checkUserStatus(userEmail);
        setUserStatus(status);
      };
      
      checkStatus();
      
      // Set up interval to periodically check status
      const statusInterval = setInterval(checkStatus, 30000); // Every 30 seconds
      
      // Focus input field when chat window opens
      inputRef.current?.focus();
      
      return () => {
        clearInterval(statusInterval);
      };
    }
  }, [userEmail, joinChatRoom, markChatAsRead, checkUserStatus, isSignedIn, session]);

  const handleSend = async () => {
    if (!newMsg.trim() || !isSignedIn || !session) return;
    
    // Send message
    await sendMessage(userEmail, newMsg);
    setNewMsg("");
    
    // Clear typing indicator
    clearTimeout(typingTimeoutRef.current);
    setIsTyping(false);
    
    // Focus back on input field
    inputRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleTyping = (e) => {
    setNewMsg(e.target.value);
    
    // Set typing indicator
    setIsTyping(true);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to clear typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 3000);
  };

  // Generate display name
  const displayName = userEmail.split('@')[0].charAt(0).toUpperCase() + userEmail.split('@')[0].slice(1);
  
  // Generate user avatar color
  const generateColor = (email) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
      'bg-red-500', 'bg-yellow-500', 'bg-pink-500',
      'bg-indigo-500', 'bg-teal-500'
    ];
    
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };
  
  const userColor = generateColor(userEmail);
  
  // Group messages by date
  const groupMessagesByDate = (messages) => {
    const groups = {};
    
    messages.forEach(msg => {
      const date = new Date(msg.time);
      const dateStr = date.toDateString();
      
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      
      groups[dateStr].push(msg);
    });
    
    return groups;
  };
  
  const messageGroups = groupMessagesByDate(messages);
  
  // Format date for message groups
  const formatGroupDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return "Today";
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    
    return date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">Authentication Required</h3>
        <p className="text-sm text-gray-500 max-w-xs">
          Please sign in to view and send messages.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <header className="flex items-center p-3 border-b border-gray-200 bg-white shadow-sm">
        <div className={`w-10 h-10 ${userColor} rounded-full flex items-center justify-center text-white font-bold`}>
          {displayName.charAt(0)}
        </div>
        
        <div className="ml-3 flex flex-col">
          <h5 className="text-lg font-semibold text-gray-800 mb-0">{displayName}</h5>
          <div className="flex items-center">
            <span className={`w-2 h-2 rounded-full mr-1.5 ${userStatus.online ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            <p className="text-xs text-gray-500 mb-0">
              {userStatus.online ? 'Online' : `Last seen ${formatLastSeen(userStatus.lastSeen)}`}
            </p>
          </div>
        </div>
        
        <div className="ml-auto flex items-center space-x-2">
          {!isConnected && (
            <div className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Offline
            </div>
          )}
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className={`w-16 h-16 ${userColor} rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4`}>
              {displayName.charAt(0)}
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Start chatting with {displayName}</h3>
            <p className="text-sm text-gray-500 max-w-xs">
              This is the beginning of your conversation with {displayName}. Say hello!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.keys(messageGroups).map(dateStr => (
              <div key={dateStr}>
                <div className="flex justify-center mb-3">
                  <span className="text-xs bg-gray-200 text-gray-600 px-3 py-1 rounded-full">
                    {formatGroupDate(dateStr)}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {messageGroups[dateStr].map((msg, idx) => {
                    const isCurrentUser = msg.sender === 'SELF';
                    const isConsecutive = idx > 0 && messageGroups[dateStr][idx - 1].sender === msg.sender;
                    
                    return (
                      <div 
                        key={msg.id || idx} 
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mt-1' : 'mt-3'}`}
                      >
                        {!isCurrentUser && !isConsecutive && (
                          <div className={`w-8 h-8 ${userColor} rounded-full flex items-center justify-center text-white text-xs font-bold mr-2`}>
                            {displayName.charAt(0)}
                          </div>
                        )}
                        
                        {!isCurrentUser && isConsecutive && <div className="w-8 mr-2"></div>}
                        
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 break-words ${
                          isCurrentUser 
                            ? 'bg-blue-500 text-white rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-lg' 
                            : 'bg-white text-gray-800 rounded-tl-sm rounded-tr-lg rounded-br-lg rounded-bl-lg shadow-sm'
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                          <div className={`text-xs mt-1 flex items-center justify-end ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'}`}>
                            {formatTimestamp(msg.time)}
                            {isCurrentUser && (
                              <span className="ml-1">
                                {msg.pending ? (
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                ) : msg.failed ? (
                                  <svg className="w-3 h-3 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                ) : msg.read ? (
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                                  </svg>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Message Input */}
      <footer className="p-3 border-t border-gray-200 bg-white">
        {isTyping && (
          <div className="text-xs text-gray-500 mb-1 ml-2">
            Typing...
          </div>
        )}
        
        <div className="flex items-center bg-gray-100 rounded-lg p-2">
          {/* Emoji Button */}
          <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          
          {/* Text Input */}
          <textarea
            ref={inputRef}
            value={newMsg}
            onChange={handleTyping}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            className="ml-2 block w-full bg-transparent border-0 resize-none focus:ring-0 text-gray-700 placeholder-gray-500 py-2 max-h-20"
            rows="1"
            disabled={!isSignedIn || !session}
          />
          
          {/* Send Button */}
          <button 
            onClick={handleSend}
            disabled={!newMsg.trim() || !isConnected || !isSignedIn || !session}
            className={`ml-2 p-2 rounded-full ${
              newMsg.trim() && isConnected && isSignedIn && session ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500'
            } transition-colors`}
          >
            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1 text-center">Press Enter to send, Shift+Enter for new line</p>
      </footer>
    </div>
  );
};

export default ChatWindow;
