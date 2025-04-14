import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth, useUser, useSession } from "@clerk/clerk-react";
import { io } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const ChatProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState({});
  const [chatList, setChatList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const { session } = useSession();
  
  // Load messages from localStorage on initial load
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error('Error parsing saved messages:', e);
      }
    }
    
    if (isLoaded && !isSignedIn) {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn]);
  
  // Initialize socket connection when user is signed in
  useEffect(() => {
    if (isSignedIn && session) {
      const initSocket = async () => {
        try {
          const token = await session.getToken();
          console.log('Got Clerk token for socket connection');
          
          const newSocket = io(API_URL, {
            auth: { token },
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000
          });
          
          setSocket(newSocket);
          
          return () => {
            newSocket.disconnect();
          };
        } catch (error) {
          console.error("Error initializing socket:", error);
        }
      };
      
      initSocket();
    }
  }, [isSignedIn, session]);
  
  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;
    
    socket.on('connect', () => {
      console.log('Socket connected with ID:', socket.id);
      setIsConnected(true);
      setLoading(false);
      
      // Fetch unread messages via REST API
      fetchUnreadMessages();
    });
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected. Reason:', socket.disconnected);
      setIsConnected(false);
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    
    socket.on('unread-messages', (unreadMessages) => {
      console.log('Received unread messages via socket:', unreadMessages);
      processUnreadMessages(unreadMessages);
    });
    
    socket.on('new-message', (msg) => {
      console.log('Received new message:', msg);
      
      if (!user) return;
      
      const userEmail = user.emailAddresses[0].emailAddress;
      
      setMessages(prevMessages => {
        const chatId = msg.sender === userEmail ? msg.receiver : msg.sender;
        const newMessages = { ...prevMessages };
        
        if (!newMessages[chatId]) {
          newMessages[chatId] = [];
        }
        
        // Add message if it doesn't already exist
        if (!newMessages[chatId].some(m => m.id === msg.id)) {
          newMessages[chatId].push({
            ...msg,
            sender: msg.sender === userEmail ? 'SELF' : msg.sender
          });
        }
        
        // Update localStorage
        localStorage.setItem('chatMessages', JSON.stringify(newMessages));
        
        // Update chat list
        updateChatList(newMessages);
        
        return newMessages;
      });
      
      // If the message is from someone else, mark it as read
      if (msg.sender !== user?.emailAddresses[0].emailAddress) {
        socket.emit('mark-read', { messageId: msg.id });
      }
    });
    
    socket.on('message-read', ({ messageId }) => {
      console.log('Message read:', messageId);
      
      setMessages(prevMessages => {
        const newMessages = { ...prevMessages };
        
        // Find and update the message
        Object.keys(newMessages).forEach(chatId => {
          newMessages[chatId] = newMessages[chatId].map(msg => 
            msg.id === messageId ? { ...msg, read: true } : msg
          );
        });
        
        // Update localStorage
        localStorage.setItem('chatMessages', JSON.stringify(newMessages));
        
        return newMessages;
      });
    });
    
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
    
    // Clean up on unmount
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('unread-messages');
      socket.off('new-message');
      socket.off('message-read');
      socket.off('error');
    };
  }, [socket, user]);
  
  // Fetch unread messages from the server
  const fetchUnreadMessages = useCallback(async () => {
    if (!isSignedIn || !session) return;
    
    try {
      const token = await session.getToken();
      
      const response = await fetch(`${API_URL}/api/messages/unread`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched unread messages via API:', data.messages);
        processUnreadMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching unread messages:', error);
    }
  }, [isSignedIn, session]);
  
  // Process unread messages
  const processUnreadMessages = useCallback((unreadMessages) => {
    if (!unreadMessages || unreadMessages.length === 0 || !user) return;
    
    setMessages(prevMessages => {
      const newMessages = { ...prevMessages };
      
      unreadMessages.forEach(msg => {
        const chatId = msg.sender;
        
        if (!newMessages[chatId]) {
          newMessages[chatId] = [];
        }
        
        // Add message if it doesn't already exist
        if (!newMessages[chatId].some(m => m.id === msg.id)) {
          newMessages[chatId].push({
            ...msg,
            sender: msg.sender // Keep original sender
          });
        }
      });
      
      // Update localStorage
      localStorage.setItem('chatMessages', JSON.stringify(newMessages));
      
      // Update chat list
      updateChatList(newMessages);
      
      return newMessages;
    });
    
    // Mark messages as read
    unreadMessages.forEach(msg => {
      if (socket) {
        socket.emit('mark-read', { messageId: msg.id });
      }
    });
  }, [socket, user]);
  
  // Update chat list based on messages
  const updateChatList = useCallback((messagesObj) => {
    if (!user) return;
    
    const userEmail = user.emailAddresses[0].emailAddress;
    const list = [];
    
    // Process each chat
    Object.keys(messagesObj).forEach(chatId => {
      const chatMessages = messagesObj[chatId];
      if (chatMessages.length === 0) return;
      
      // Sort messages by time
      const sortedMessages = [...chatMessages].sort((a, b) => b.time - a.time);
      const lastMessage = sortedMessages[0];
      
      // Count unread messages
      const unreadCount = sortedMessages.filter(
        msg => msg.sender !== 'SELF' && !msg.read
      ).length;
      
      // Generate display name
      const displayName = chatId.split('@')[0].charAt(0).toUpperCase() + chatId.split('@')[0].slice(1);
      
      // Generate color based on email
      const colors = [
        'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
        'bg-red-500', 'bg-yellow-500', 'bg-pink-500',
        'bg-indigo-500', 'bg-teal-500'
      ];
      
      let hash = 0;
      for (let i = 0; i < chatId.length; i++) {
        hash = chatId.charCodeAt(i) + ((hash << 5) - hash);
      }
      
      const colorIndex = Math.abs(hash) % colors.length;
      
      list.push({
        id: chatId,
        name: displayName,
        lastMessage: lastMessage.message,
        timestamp: lastMessage.time,
        unread: unreadCount,
        avatar: displayName.charAt(0),
        color: colors[colorIndex]
      });
    });
    
    // Sort by latest message
    list.sort((a, b) => b.timestamp - a.timestamp);
    
    setChatList(list);
  }, [user]);
  
  // Join a chat room
  const joinChatRoom = useCallback((receiverEmail) => {
    if (socket && isConnected) {
      console.log(`Joining chat room with ${receiverEmail}`);
      socket.emit('join-chat', receiverEmail);
    }
  }, [socket, isConnected]);
  
  // Send a message
  const sendMessage = useCallback(async (receiverEmail, messageText) => {
    if (!isSignedIn || !user || !messageText.trim()) return false;
    
    const messageId = uuidv4();
    const timestamp = Date.now();
    
    // Optimistically add message to state
    setMessages(prevMessages => {
      const newMessages = { ...prevMessages };
      
      if (!newMessages[receiverEmail]) {
        newMessages[receiverEmail] = [];
      }
      
      newMessages[receiverEmail].push({
        id: messageId,
        sender: 'SELF',
        receiver: receiverEmail,
        message: messageText,
        time: timestamp,
        read: false,
        pending: true
      });
      
      // Update localStorage
      localStorage.setItem('chatMessages', JSON.stringify(newMessages));
      
      // Update chat list
      updateChatList(newMessages);
      
      return newMessages;
    });
    
    const updateMessageStatus = (id, status, serverMsgId = null, serverTime = null) => {
      setMessages(prevMessages => {
        const newMessages = { ...prevMessages };
        
        if (newMessages[receiverEmail]) {
          newMessages[receiverEmail] = newMessages[receiverEmail].map(msg => {
            if (msg.id === id) {
              const updatedMsg = { 
                ...msg, 
                pending: false
              };
              
              if (status === 'sent') {
                // If server returned a new ID or time, use those
                if (serverMsgId) updatedMsg.id = serverMsgId;
                if (serverTime) updatedMsg.time = serverTime;
              } else if (status === 'failed') {
                updatedMsg.failed = true;
              }
              
              return updatedMsg;
            }
            return msg;
          });
        }
        
        // Update localStorage
        localStorage.setItem('chatMessages', JSON.stringify(newMessages));
        
        return newMessages;
      });
    };
    
    // Send via socket if connected
    if (socket && isConnected) {
      console.log(`Sending message to ${receiverEmail} via socket`);
      
      // Set a timeout in case the server doesn't respond
      const timeoutId = setTimeout(() => {
        console.error('Message send timeout - no server response');
        updateMessageStatus(messageId, 'failed');
      }, 10000);
      
      socket.emit('send-message', {
        receiver: receiverEmail,
        message: messageText
      }, (response) => {
        clearTimeout(timeoutId);
        
        if (response && response.success) {
          console.log('Message sent successfully:', response);
          updateMessageStatus(
            messageId, 
            'sent', 
            response.messageDetails?.id, 
            response.messageDetails?.time
          );
        } else {
          console.error('Failed to send message:', response?.error || 'Unknown error');
          updateMessageStatus(messageId, 'failed');
        }
      });
      
      return true;
    }
    
    // Fallback to REST API if socket is not connected
    try {
      console.log(`Socket not connected, sending message to ${receiverEmail} via REST API`);
      const token = await session.getToken();
      
      const response = await fetch(`${API_URL}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiver: receiverEmail,
          message: messageText
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Message sent successfully via REST API:', data);
        
        // Update the message with the server-generated ID
        updateMessageStatus(
          messageId, 
          'sent', 
          data.messageDetails?.id, 
          data.messageDetails?.time
        );
        
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message via REST API:', error);
      
      // Mark message as failed
      updateMessageStatus(messageId, 'failed');
      
      return false;
    }
  }, [isSignedIn, user, socket, isConnected, session, updateChatList]);
  
  // Check user status
  const checkUserStatus = useCallback(async (email) => {
    if (!isSignedIn || !session) {
      return { online: false, lastSeen: null };
    }
    
    try {
      const token = await session.getToken();
      
      const response = await fetch(`${API_URL}/api/messages/user-status/${email}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      return { online: false, lastSeen: null };
    } catch (error) {
      console.error('Error checking user status:', error);
      return { online: false, lastSeen: null };
    }
  }, [isSignedIn, session]);
  
  // Mark chat as read
  const markChatAsRead = useCallback((chatId) => {
    if (!socket || !isConnected) return;
    
    setMessages(prevMessages => {
      const newMessages = { ...prevMessages };
      
      if (newMessages[chatId]) {
        // Find unread messages
        const unreadMessages = newMessages[chatId].filter(
          msg => msg.sender !== 'SELF' && !msg.read
        );
        
        // Mark messages as read
        newMessages[chatId] = newMessages[chatId].map(msg => 
          msg.sender !== 'SELF' && !msg.read ? { ...msg, read: true } : msg
        );
        
        // Notify server about read messages
        unreadMessages.forEach(msg => {
          socket.emit('mark-read', { messageId: msg.id });
        });
        
        // Update localStorage
        localStorage.setItem('chatMessages', JSON.stringify(newMessages));
        
        // Update chat list
        updateChatList(newMessages);
      }
      
      return newMessages;
    });
  }, [socket, isConnected, updateChatList]);
  
  // Get chat messages for a specific user
  const getChatMessages = useCallback((chatId) => {
    return messages[chatId] || [];
  }, [messages]);
  
  // Get chat list
  const getChatList = useCallback(() => {
    return chatList;
  }, [chatList]);
  
  const value = {
    isConnected,
    loading,
    joinChatRoom,
    sendMessage,
    getChatMessages,
    getChatList,
    checkUserStatus,
    markChatAsRead
  };
  
  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatProvider;
