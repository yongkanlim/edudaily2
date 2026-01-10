// src/components/AiChatbot.jsx
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import chatbotIcon from "../assets/chatbot.png";
import ReactMarkdown from 'react-markdown';
import chefIcon from "../assets/chatbot.png";

export default function AiChatbot({ apiKey, buttonImage = chatbotIcon, position = "bottom-right" }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [viewingHistory, setViewingHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll chat to bottom
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(scrollToBottom, [messages]);

  // Get logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        // Initialize with welcome message
        if (messages.length === 0) {
          setMessages([
            {
              type: "bot",
              text: "**Hello! I'm your AI Cooking Assistant!**\n\nI can help you with:\n\n• **Recipes** and cooking instructions\n\n• **Ingredient substitutions**\n\n• **Cooking techniques**\n\n• **Meal planning**\n\n• **Cooking tips & tricks**\n\nAsk me anything about cooking!",
              timestamp: new Date().toISOString()
            }
          ]);
        }
      }
    };
    fetchUser();
  }, []);

  // Format bot response with beautiful markdown
  const formatBotResponse = (text) => {
    // Convert markdown to beautiful HTML with cooking emojis
    return text
      .replace(/###\s*(.+)/g, '🎯 **$1**')
      .replace(/##\s*(.+)/g, '📌 **$1**')
      .replace(/#\s*(.+)/g, '✨ **$1**')
      .replace(/\*\*(.+?)\*\*/g, '**$1**')
      .replace(/\*(.+?)\*/g, '*$1*')
      .replace(/Ingredients:/gi, '🥦 **Ingredients:**')
      .replace(/Instructions:/gi, '📝 **Instructions:**')
      .replace(/Step \d+:/gi, '👨‍🍳 **$&**')
      .replace(/Note:/gi, '💡 **Note:**')
      .replace(/Tip:/gi, '🌟 **Tip:**')
      .replace(/\n-/g, '\n•')
      .replace(/\d+\.\s/g, '➡️ ');
  };

  // Load chat history from Supabase
  const loadChatHistory = async () => {
    if (!userId) return;
    
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("chatboxhistory")
        .select("*")
        .eq("userid", userId)
        .order("timestamp", { ascending: false });

      if (!error && data) {
        setChatHistory(data);
      }
    } catch (err) {
      console.error("Error loading history:", err);
    }
    setLoadingHistory(false);
  };

  // Toggle history view
  const toggleHistoryView = async () => {
    if (!viewingHistory) {
      await loadChatHistory();
    }
    setViewingHistory(!viewingHistory);
  };

  // Load a specific chat from history
  const loadChatFromHistory = async (chatId) => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("chatboxhistory")
        .select("*")
        .eq("chatid", chatId)
        .single();

      if (!error && data) {
        setMessages([
          { type: "user", text: data.usermessage, timestamp: data.timestamp },
          { type: "bot", text: formatBotResponse(data.botresponse), timestamp: data.timestamp }
        ]);
        setViewingHistory(false);
      }
    } catch (err) {
      console.error("Error loading chat:", err);
    }
    setLoadingHistory(false);
  };

  // Clear chat history
  const clearChatHistory = async () => {
    if (!userId || !window.confirm("Are you sure you want to clear all chat history?")) return;
    
    try {
      const { error } = await supabase
        .from("chatboxhistory")
        .delete()
        .eq("userid", userId);

      if (!error) {
        setChatHistory([]);
        setMessages([
          {
            type: "bot",
            text: "🧹 **Chat history cleared!**\n\nHow can I help you with cooking today?",
            timestamp: new Date().toISOString()
          }
        ]);
      }
    } catch (err) {
      console.error("Error clearing history:", err);
    }
  };

  const toggleChat = () => {
    setOpen((prev) => !prev);
    if (open) {
      setViewingHistory(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !userId) return;

    const userMessage = { 
      type: "user", 
      text: input,
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = input;
    setInput("");
    setLoading(true);

    try {
      // Prepare conversation history for API
      const conversationHistory = messages
        .filter(msg => msg.text && !msg.text.includes("👋") && !msg.text.includes("🧹"))
        .map(msg => ({
          role: msg.type === "user" ? "user" : "assistant",
          content: msg.text
        }));

      // 1️⃣ Call OpenRouter API
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "Recipe Website",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat",
          messages: [
            {
              role: "system",
              content: `You are a friendly and enthusiastic cooking assistant named "Chef AI". You help users with recipes, cooking techniques, ingredient substitutions, and meal planning. 
              Format your responses beautifully with markdown:
              - Use headers with emojis for sections
              - Use bullet points with food emojis
              - Bold important terms
              - Add helpful tips and notes
              - Be encouraging and warm
              - Keep responses detailed but organized
              - Use cooking-related emojis where appropriate
              `
            },
            ...conversationHistory,
            {
              role: "user",
              content: messageToSend
            }
          ],
          max_tokens: 1500,
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      // Extract and format bot response
      const botText = data.choices?.[0]?.message?.content || "Sorry, I didn't understand.";
      const formattedBotText = formatBotResponse(botText);
      const botMessage = { 
        type: "bot", 
        text: formattedBotText,
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, botMessage]);

      // 2️⃣ Save to Supabase
      const { data: savedData, error } = await supabase
        .from("chatboxhistory")
        .insert({
          userid: userId,
          usermessage: messageToSend,
          botresponse: botText,
          timestamp: new Date().toISOString()
        })
        .select()
        .single();

      if (!error && savedData) {
        // Add to local history state
        setChatHistory(prev => [savedData, ...prev]);
      }

    } catch (err) {
      console.error("Chatbot error:", err);
      const botMessage = { 
        type: "bot", 
        text: "❌ **Oops! Something went wrong.**\n\nPlease try again or check your internet connection.",
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, botMessage]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Render message with markdown
  const renderMessage = (msg, idx) => {
    if (msg.type === "user") {
      return (
        <div key={idx} className="flex justify-end mb-3">
          <div className="max-w-[80%]">
            <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-br-none shadow-md">
              <p className="whitespace-pre-wrap break-words">{msg.text}</p>
            </div>
            {msg.timestamp && (
              <p className="text-xs text-gray-500 text-right mt-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>
      );
    }

    return (
      <div key={idx} className="flex justify-start mb-3">
        <div className="max-w-[80%]">
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-100 p-3 rounded-2xl rounded-bl-none shadow-sm">
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({node, ...props}) => <h1 className="text-lg font-bold text-orange-700 mt-2 mb-2" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-md font-bold text-orange-600 mt-3 mb-2" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-sm font-bold text-orange-500 mt-2 mb-1" {...props} />,
                  p: ({node, ...props}) => <p className="text-gray-700 mb-2" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2 text-gray-700" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2 text-gray-700" {...props} />,
                  li: ({node, ...props}) => <li className="mb-1" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-bold text-orange-600" {...props} />,
                  em: ({node, ...props}) => <em className="italic text-gray-600" {...props} />
                }}
              >
                {msg.text}
              </ReactMarkdown>
            </div>
          </div>
          {msg.timestamp && (
            <p className="text-xs text-gray-500 mt-1">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Floating button */}
      <button
        onClick={toggleChat}
        style={{ position: "fixed", zIndex: 1000, ...getPosition(position) }}
        className="hover:scale-110 transition-transform duration-300"
      >
        <div className="relative">
          <img src={buttonImage} alt="Chatbot" className="w-16 h-16 rounded-full shadow-xl cursor-pointer border-2 border-white" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      </button>

      {/* Chatbox */}
      {open && (
        <div
          className="fixed w-96 h-[600px] bg-white shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-slide-up"
          style={{ ...getPosition(position, true), zIndex: 1000 }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white p-4 font-semibold flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden">
                    <img 
                        src={chefIcon} 
                        alt="Chef" 
                        className="w-full h-full object-cover"
                    />
                    </div>
              <div>
                <h2 className="text-lg font-bold">Chef AI Assistant</h2>
                <p className="text-xs text-orange-100">Your personal cooking helper</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleHistoryView}
                className="text-sm bg-orange-700 hover:bg-orange-800 px-3 py-1 rounded-full transition-colors"
                title="View History"
              >
                {viewingHistory ? "Back to Chat" : "History"}
              </button>
              <button onClick={toggleChat} className="text-2xl hover:text-gray-200 transition-colors">
                ×
              </button>
            </div>
          </div>

          {/* History View */}
          {viewingHistory ? (
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-700">Chat History</h3>
                {chatHistory.length > 0 && (
                  <button
                    onClick={clearChatHistory}
                    className="text-sm text-red-600 hover:text-red-800 px-3 py-1 border border-red-200 rounded-full transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>
              
              {loadingHistory ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                </div>
              ) : chatHistory.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <div className="text-4xl mb-3">📝</div>
                  <p className="font-medium">No chat history yet</p>
                  <p className="text-sm mt-1">Start chatting to save conversations!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {chatHistory.map((chat) => (
                    <div
                      key={chat.chatid}
                      onClick={() => loadChatFromHistory(chat.chatid)}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-orange-50 cursor-pointer transition-colors group"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800 truncate group-hover:text-orange-600">
                            {chat.usermessage}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {chat.botresponse.substring(0, 100)}...
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 ml-2">
                          {new Date(chat.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">User</span>
                        <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded-full">AI</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-b from-white to-orange-50">
                {messages.map((msg, idx) => renderMessage(msg, idx))}
                
                {loading && (
                  <div className="flex justify-start mb-3">
                    <div className="max-w-[80%]">
                      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-100 p-4 rounded-2xl rounded-bl-none shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                            <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                          </div>
                          <span className="text-sm text-gray-600">Chef AI is cooking up a response...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about recipes, cooking tips, or ingredients..."
                    className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none resize-none transition-all"
                    rows="1"
                    style={{ minHeight: "50px", maxHeight: "120px" }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-5 rounded-xl hover:from-orange-700 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px] shadow-md"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        Send
                      </>
                    )}
                  </button>
                </div>
                <div className="flex justify-between mt-2">
                  <p className="text-xs text-gray-500">
                    Powered by DeepSeek AI • Cooking Assistant
                  </p>
                  <button
                    onClick={toggleHistoryView}
                    className="text-xs text-orange-600 hover:text-orange-800 flex items-center gap-1"
                  >
                     View History
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Helper to get position for button/chatbox
function getPosition(position, isChatbox = false) {
  const offset = 20;
  const buttonOffset = isChatbox ? 90 : 0;
  
  const pos = {};
  if (position.includes("bottom")) pos.bottom = offset + (isChatbox ? buttonOffset : 0);
  if (position.includes("top")) pos.top = offset;
  if (position.includes("right")) pos.right = offset;
  if (position.includes("left")) pos.left = offset;

  return pos;
}