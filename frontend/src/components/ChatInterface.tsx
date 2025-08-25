import { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import axios from "axios";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  suggestions?: string[];
}

const suggestedPrompts = [
  "How are you feeling today?",
  "I'd like to start a behavioral assessment",
  "Help me understand my emotions",
  "What challenges can I try today?"
];

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Robust personalized username
  const [userId] = useState(() => localStorage.getItem("userId"));
  const [username] = useState(() => {
    const ln = localStorage.getItem("fullname");
    if (ln && ln.trim()) return ln;
    try {
      const u = JSON.parse(localStorage.getItem("user") || '{}');
      if (u.fullname && u.fullname.trim()) return u.fullname;
      if (u.username && u.username.trim()) return u.username;
      if (u.email) return u.email.split('@')[0];
    } catch {}
    const em = localStorage.getItem("email");
    if (em && em.includes("@")) return em.split('@');
    return " ";
  });

  useEffect(() => {
    if (messages.length > 0)
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  },  [messages, isTyping]);


  const chatStarted = messages.length > 0;

  const handleSend = async (message: string = input) => {
    if (!message.trim()) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      isUser: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const chatHistory = messages.map(m => ({
        user: m.isUser ? m.content : undefined,
        ai: !m.isUser ? m.content : undefined,
      })).filter(m => m.user || m.ai);

      const guestId = userId || "guest";
      const resp = await axios.post("/api/chatbot", {
      userId: guestId,
      message,
      history: chatHistory,
      });

      // const resp = await axios.post("/api/chatbot", {
      //   userId,
      //   message,
      //   history: chatHistory,
      // });

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: resp.data.reply,
          isUser: false,
          timestamp: new Date()
        }
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          content: "Sorry, there was an error getting a response.",
          isUser: false,
          timestamp: new Date()
        }
      ]);
    }
    setIsTyping(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  return (
    <div className="flex flex-col flex-1 w-full h-full min-h-0 min-w-0">
      {/* Header Section, visible only if chat is empty (first load) */}
      {!chatStarted && (
        <div className="flex-1 flex flex-col items-center justify-center w-full text-center px-6">
          <div className="mb-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-hero flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-foreground">MantraMinds</h1>
            </div>
            <p className="text-xl text-muted-foreground mb-8">
              Hello {userId ? (username || "User") : "Guest User"},<br />
              Your AI companion for behavioral assessment and mental wellness.<br />
              Ask me anything to get started.
            </p>
          </div>
          {/* Input Area - Centered */}
          <div className="w-full mb-8">
            <div className="relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about behavioral assessment, emotions, or mental wellness..."
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                className="h-14 text-lg pl-6 pr-14 rounded-2xl border-2 border-border/20 focus:border-primary/50 bg-background/50 backdrop-blur-sm shadow-lg"
                disabled={isTyping}
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                className="absolute right-2 top-2 h-10 w-10 rounded-xl bg-gradient-hero hover:shadow-glow transition-all duration-200"
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {/* Suggestions grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
            {suggestedPrompts.map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => handleSuggestionClick(prompt)}
                className="h-auto p-4 text-left justify-start hover:bg-accent/50 border-border/50 rounded-xl text-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>{prompt}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${message.isUser ? 'order-last' : 'order-first'}`}>
              <Card className={`p-4 ${
                message.isUser
                  ? 'bg-primary text-primary-foreground shadow-glow'
                  : 'bg-card shadow-soft border border-border/50'
              }`}>
                <p className="text-sm leading-relaxed">{message.content}</p>
                <div className="text-xs opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </Card>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.isUser ? 'ml-3 bg-primary' : 'mr-3 bg-gradient-hero'}`}>
              {message.isUser ? (
                <span className="text-xs font-semibold text-primary-foreground">U</span>
              ) : (
                <Sparkles className="w-4 h-4 text-white" />
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="mr-3 w-8 h-8 rounded-full bg-gradient-hero flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <Card className="p-4 bg-card shadow-soft">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
      {/* Input Area (when chat has messages) */}
      {chatStarted && (
        <div className="border-t border-border/50 pt-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Continue the conversation..."
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                className="min-h-[3rem] resize-none bg-muted/50 border-border/50 focus:bg-background"
                disabled={isTyping}
              />
            </div>
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="h-12 w-12 rounded-xl bg-gradient-hero hover:shadow-glow transition-all duration-200"
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
