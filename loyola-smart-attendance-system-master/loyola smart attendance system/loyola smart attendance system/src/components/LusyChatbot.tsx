import { useState, useRef, useEffect } from "react";
import { Bot, Send, X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export const LusyChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm Lusy, your Loyola Smart Attendance assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getBotResponse = (userMessage: string): string => {
    const lowerMsg = userMessage.toLowerCase();
    
    // Attendance related queries
    if (lowerMsg.includes('attendance') || lowerMsg.includes('present') || lowerMsg.includes('absent')) {
      return "I can help with attendance! 📊 Faculty can take attendance using facial recognition in the 'Take Attendance' section. Students can view their attendance records and export them as Excel files. Would you like to know more about any specific feature?";
    }
    
    // Student management
    if (lowerMsg.includes('student') || lowerMsg.includes('add student') || lowerMsg.includes('manage')) {
      return "Student management is available for faculty members! 👨‍🎓 You can add new students with their complete details including name, PIN, photo, and contact information in the 'Add Students' section. Each student gets a unique profile for facial recognition.";
    }
    
    // Face recognition
    if (lowerMsg.includes('face') || lowerMsg.includes('recognition') || lowerMsg.includes('camera')) {
      return "Our facial recognition system is powered by advanced AI! 📸 It can process up to 120 students in under 10 minutes with 99.5% accuracy. The system works with your device's camera and supports both morning and afternoon sessions.";
    }
    
    // Export and reports
    if (lowerMsg.includes('export') || lowerMsg.includes('excel') || lowerMsg.includes('download') || lowerMsg.includes('report')) {
      return "You can export attendance data easily! 📁 Both faculty and students can generate Excel reports with QR codes for easy sharing. Faculty can export class-wide data, while students can export their personal attendance history.";
    }
    
    // Login and access
    if (lowerMsg.includes('login') || lowerMsg.includes('access') || lowerMsg.includes('password') || lowerMsg.includes('account')) {
      return "Access to the system is role-based! 🔐 Faculty members have access to student management, attendance recording, and reports. Students can view their attendance and export personal data. Contact your administrator if you need login credentials.";
    }
    
    // Technical issues
    if (lowerMsg.includes('error') || lowerMsg.includes('problem') || lowerMsg.includes('issue') || lowerMsg.includes('bug')) {
      return "I'm sorry to hear you're experiencing issues! 🔧 Please try refreshing the page first. If the problem persists, check your camera permissions for facial recognition features. For persistent issues, contact the system administrator.";
    }
    
    // How to use
    if (lowerMsg.includes('how') || lowerMsg.includes('use') || lowerMsg.includes('tutorial') || lowerMsg.includes('guide')) {
      return "Here's how to use the system! 📚 Faculty: Login → Add Students → Take Attendance via Camera → Export Reports. Students: Login → View Attendance → Export Personal Data. Each section has intuitive interfaces to guide you through the process.";
    }
    
    // Features
    if (lowerMsg.includes('feature') || lowerMsg.includes('what can') || lowerMsg.includes('capabilities')) {
      return "Loyola Smart Attendance offers amazing features! ✨ AI-powered facial recognition, batch processing for 120+ students, real-time attendance tracking, Excel exports with QR codes, secure role-based access, and 24/7 AI assistance (that's me!).";
    }
    
    // Greetings
    if (lowerMsg.includes('hi') || lowerMsg.includes('hello') || lowerMsg.includes('hey') || lowerMsg.includes('good')) {
      return "Hello there! 👋 Welcome to Loyola Smart Attendance System! I'm here to help you navigate the system, answer questions about attendance, and provide assistance with any features. What would you like to know?";
    }
    
    // Thanks
    if (lowerMsg.includes('thank') || lowerMsg.includes('thanks')) {
      return "You're very welcome! 😊 I'm always here to help with your attendance system needs. Feel free to ask me anything about facial recognition, student management, exports, or any other features!";
    }
    
    // Help
    if (lowerMsg.includes('help') || lowerMsg.includes('support') || lowerMsg.includes('assist')) {
      return "I'm here to help! 🆘 I can assist with: 📊 Attendance queries, 👨‍🎓 Student management, 📸 Facial recognition, 📁 Export features, 🔐 Login issues, 🔧 Technical problems, and 📚 System tutorials. What do you need help with?";
    }
    
    // Default responses
    const defaultResponses = [
      "I'm specialized in helping with the Loyola Smart Attendance System! 🎓 Could you ask me something about attendance, students, facial recognition, or system features?",
      "That's interesting! Let me know if you have any questions about taking attendance, managing students, or using our facial recognition features! 📸",
      "I'm here to help with attendance system queries! 📊 Feel free to ask about student management, face recognition, exports, or any system features.",
      "Great question! I specialize in helping with Loyola's attendance system. What would you like to know about attendance tracking, student profiles, or our AI features? 🤖"
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate bot thinking time
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(inputMessage),
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="loyola-chat-bot">
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-full loyola-btn-secondary shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
        >
          <MessageCircle className="w-8 h-8" />
        </Button>
      )}

      {isOpen && (
        <Card className="w-96 h-[600px] flex flex-col shadow-xl">
          <CardHeader className="loyola-gradient-bg text-primary-foreground rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">Lusy Assistant</CardTitle>
                  <p className="text-sm text-primary-foreground/80">Always here to help! 🎓</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px] scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted text-foreground shadow-sm'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.text}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-muted text-foreground p-3 rounded-lg shadow-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about attendance..."
                  className="flex-1 loyola-input"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="loyola-btn-primary"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="text-xs cursor-pointer" onClick={() => setInputMessage("How do I take attendance?")}>
                  How to take attendance?
                </Badge>
                <Badge variant="outline" className="text-xs cursor-pointer" onClick={() => setInputMessage("Export reports")}>
                  Export reports
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};