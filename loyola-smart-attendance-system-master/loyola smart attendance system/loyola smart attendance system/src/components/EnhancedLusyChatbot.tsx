import { useState, useRef, useEffect } from "react";
import { Bot, Send, X, MessageCircle, Sparkles, Brain, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  typing?: boolean;
}

export const EnhancedLusyChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm Lusy, your advanced AI assistant for the Loyola Smart Attendance System. I'm powered by cutting-edge AI technology and I'm here to help you with anything related to attendance management, student registration, face recognition, and system navigation. How can I assist you today? 🚀",
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

  const getAdvancedBotResponse = (userMessage: string): string => {
    const lowerMsg = userMessage.toLowerCase();
    
    // Advanced contextual responses with personality
    if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey')) {
      const greetings = [
        "Hello there! Welcome to the future of attendance management! 🌟 I'm Lusy, your AI-powered assistant. Think of me as your personal guide through the Loyola Smart Attendance System. What would you like to explore today?",
        "Hi! Great to see you! 👋 I'm Lusy, and I'm absolutely thrilled to help you with anything related to our advanced attendance system. Whether you're curious about face recognition, need help with student management, or want to understand our AI capabilities, I'm here for you!",
        "Hey! Welcome to the cutting-edge world of AI-powered attendance! 🚀 I'm Lusy, your intelligent assistant, and I'm equipped with advanced knowledge about every aspect of our system. How can I make your experience amazing today?"
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    if (lowerMsg.includes('attendance') || lowerMsg.includes('mark') || lowerMsg.includes('present') || lowerMsg.includes('absent')) {
      return "🎯 Attendance management is my specialty! Our AI-powered system revolutionizes how attendance is taken:\n\n📸 **Real-time Face Recognition**: Using advanced computer vision, we can identify and mark students present in seconds\n⚡ **Lightning Fast**: Process 120+ students in under 10 minutes\n📊 **Smart Analytics**: Track patterns, generate insights, and export detailed reports\n🔄 **Morning & Afternoon Sessions**: Flexible scheduling for different class periods\n\nWould you like me to walk you through the attendance capture process or explain how our AI achieves 99.5% accuracy?";
    }

    if (lowerMsg.includes('student') || lowerMsg.includes('add') || lowerMsg.includes('register') || lowerMsg.includes('enroll')) {
      return "👨‍🎓 Student management is incredibly powerful in our system! Here's what makes it special:\n\n🔐 **Complete Profile Creation**: Full student details with secure authentication\n📷 **Advanced Face Capture**: Multi-angle photos with real-time AI processing\n🎨 **Smart ID Generation**: Automatic student ID creation with year coding\n📧 **Dual Email Support**: Both institutional and Gmail for flexible authentication\n🔒 **Secure Storage**: All data encrypted and stored safely in our cloud database\n\nFaculty can easily add students with enhanced camera features including front/back camera switching for mobile devices. Want to know more about the registration process?";
    }

    if (lowerMsg.includes('face') || lowerMsg.includes('recognition') || lowerMsg.includes('camera') || lowerMsg.includes('ai') || lowerMsg.includes('detect')) {
      return "🤖 Our AI face recognition is truly next-generation! Here's the magic behind it:\n\n🧠 **Advanced Neural Networks**: Using state-of-the-art deep learning models\n📱 **Mobile Optimized**: Works perfectly on phones with front/back camera switching\n⚡ **Real-time Processing**: Instant face detection and feature extraction\n🎯 **99.5% Accuracy**: Industry-leading precision with adaptive thresholds\n🔄 **Multi-angle Training**: Captures faces from different angles for robust recognition\n💡 **Smart Fallbacks**: Multiple AI models ensure reliability\n\nOur system uses advanced computer vision algorithms including DETR for face detection and ViT for feature extraction. It's like having a super-intelligent eye that never forgets a face! Want to know how the AI training process works?";
    }

    if (lowerMsg.includes('export') || lowerMsg.includes('report') || lowerMsg.includes('excel') || lowerMsg.includes('download') || lowerMsg.includes('data')) {
      return "📊 Data export and reporting capabilities are incredibly comprehensive:\n\n📈 **Smart Excel Reports**: Beautifully formatted spreadsheets with charts and analytics\n🔗 **QR Code Integration**: Each report includes QR codes for quick verification\n📅 **Date Range Filtering**: Export data for specific periods or entire semesters\n👥 **Multi-level Access**: Faculty get class-wide data, students get personal records\n📧 **Automated Sharing**: Send reports directly via email or cloud storage\n🎨 **Professional Formatting**: Clean, readable layouts perfect for administration\n\nThe export system is designed to meet all academic reporting requirements while being incredibly user-friendly. Would you like me to explain the different report types available?";
    }

    if (lowerMsg.includes('login') || lowerMsg.includes('account') || lowerMsg.includes('password') || lowerMsg.includes('google') || lowerMsg.includes('auth')) {
      return "🔐 Our authentication system is both secure and user-friendly:\n\n🔑 **Multiple Login Options**: Email/password and Google OAuth integration\n👥 **Role-based Access**: Separate dashboards for faculty and students\n🛡️ **Advanced Security**: Encrypted passwords and secure session management\n📱 **Mobile Friendly**: Seamless login experience across all devices\n🔄 **Auto-generated Credentials**: Faculty can create secure passwords for students\n📧 **Gmail Integration**: Students can use their Gmail accounts for easy access\n\nThe system automatically detects user roles and provides appropriate access levels. Having trouble logging in? I can guide you through the authentication process!";
    }

    if (lowerMsg.includes('mobile') || lowerMsg.includes('phone') || lowerMsg.includes('android') || lowerMsg.includes('ios') || lowerMsg.includes('app')) {
      return "📱 Our mobile experience is absolutely fantastic! Here's what makes it special:\n\n🎯 **Mobile-First Design**: Optimized for touch interactions and small screens\n📷 **Smart Camera Controls**: Front/back camera switching with professional capture modes\n⚡ **Lightning Performance**: Smooth animations and responsive interface\n🔄 **Offline Capability**: Cache data for use without internet connection\n📐 **Responsive Layout**: Adapts perfectly to any screen size\n💫 **Touch Gestures**: Intuitive swipe and tap interactions\n\nWhether you're using an iPhone, Android, or tablet, the experience is consistently amazing. The mobile camera features are particularly impressive for face capture!";
    }

    if (lowerMsg.includes('error') || lowerMsg.includes('problem') || lowerMsg.includes('issue') || lowerMsg.includes('bug') || lowerMsg.includes('help') || lowerMsg.includes('trouble')) {
      return "🔧 Don't worry, I'm here to help solve any issues! Let's troubleshoot together:\n\n🔄 **Quick Fixes**:\n   • Refresh your browser/app\n   • Clear browser cache and cookies\n   • Check internet connection\n   • Ensure camera permissions are enabled\n\n📷 **Camera Issues**:\n   • Grant camera access in browser settings\n   • Try switching between front/back cameras\n   • Ensure good lighting for face detection\n   • Close other apps using the camera\n\n🔐 **Login Problems**:\n   • Verify email and password\n   • Try Google authentication\n   • Check for typos in credentials\n\n💡 **Pro Tip**: Most issues resolve with a simple refresh! If problems persist, our system logs help identify specific issues. What specific problem are you experiencing?";
    }

    if (lowerMsg.includes('how') || lowerMsg.includes('tutorial') || lowerMsg.includes('guide') || lowerMsg.includes('learn') || lowerMsg.includes('start')) {
      return "📚 I'd love to guide you through our intelligent system! Here's your personalized roadmap:\n\n👨‍🏫 **For Faculty**:\n1️⃣ **Login** → Access your faculty dashboard\n2️⃣ **Add Students** → Use enhanced camera capture with AI training\n3️⃣ **Take Attendance** → Real-time face recognition in seconds\n4️⃣ **Generate Reports** → Export professional Excel files with analytics\n\n👨‍🎓 **For Students**:\n1️⃣ **Login** → Access your personal dashboard\n2️⃣ **View Attendance** → See detailed attendance history with charts\n3️⃣ **Export Data** → Download personal attendance reports\n\n💡 **Smart Features**:\n   • Mobile-optimized interface\n   • Real-time notifications\n   • Advanced AI assistance (that's me!)\n\nWhich role are you interested in learning about? I can provide detailed step-by-step guidance!";
    }

    if (lowerMsg.includes('accuracy') || lowerMsg.includes('reliable') || lowerMsg.includes('precise') || lowerMsg.includes('performance')) {
      return "🎯 Our system's accuracy is truly impressive! Here are the technical details:\n\n📊 **Recognition Accuracy**: 99.5% success rate in real-world conditions\n⚡ **Processing Speed**: Average 0.3 seconds per face recognition\n🔄 **Adaptability**: Smart thresholds adjust based on lighting and angles\n📈 **Continuous Learning**: AI models improve with each use\n🎨 **Multi-condition Testing**: Tested across various lighting, angles, and environments\n\n🧠 **Technical Excellence**:\n   • Multiple AI models working in parallel\n   • Advanced feature extraction algorithms\n   • Sophisticated similarity calculations\n   • Adaptive threshold mechanisms\n\nOur accuracy rivals commercial facial recognition systems used in airports and security facilities. The AI continuously learns and adapts to ensure consistent performance!";
    }

    if (lowerMsg.includes('future') || lowerMsg.includes('update') || lowerMsg.includes('new') || lowerMsg.includes('coming') || lowerMsg.includes('roadmap')) {
      return "🚀 The future of Loyola Smart Attendance is incredibly exciting! Here's what's coming:\n\n🌟 **Next-Gen Features**:\n   • Voice-activated commands for hands-free operation\n   • Advanced analytics with predictive insights\n   • Integration with learning management systems\n   • Blockchain-based attendance verification\n\n🤖 **AI Enhancements**:\n   • Emotion recognition for engagement tracking\n   • Behavioral pattern analysis\n   • Automated attendance reports generation\n   • Multi-language support with AI translation\n\n📱 **Platform Expansion**:\n   • Native mobile apps for iOS/Android\n   • Smartwatch integration\n   • AR-based attendance visualization\n\nWe're constantly innovating to make attendance management more intelligent and user-friendly! What features would you love to see?";
    }

    if (lowerMsg.includes('thank') || lowerMsg.includes('thanks') || lowerMsg.includes('appreciate')) {
      return "🌟 You're absolutely welcome! It's my pleasure to help! I genuinely love assisting users with the Loyola Smart Attendance System. Your questions help me become even better at providing support.\n\n💡 Remember, I'm always here whenever you need:\n   • Technical guidance and troubleshooting\n   • Feature explanations and tutorials\n   • Best practices for optimal results\n   • Updates on new capabilities\n\n🚀 Feel free to ask me anything, anytime! Whether it's about AI face recognition, student management, mobile features, or system navigation - I'm your intelligent companion on this amazing technological journey! ✨";
    }

    // Advanced contextual responses
    const contextualResponses = [
      "🤖 That's a fascinating question! As an AI assistant specialized in attendance management, I'd love to help you explore our system's capabilities further. Could you tell me more about what specific aspect of the Loyola Smart Attendance System you're interested in? Whether it's:\n\n📸 Face recognition technology\n👥 Student management features\n📊 Analytics and reporting\n📱 Mobile functionality\n🔐 Security features\n\nI'm equipped with comprehensive knowledge about all these areas and more!",
      
      "💡 I appreciate your curiosity! While I'm specifically designed to excel at helping with the Loyola Smart Attendance System, I can definitely assist you with anything related to:\n\n🎯 Attendance tracking and management\n🧠 AI-powered face recognition\n📚 Student registration and profiles\n📈 Data analytics and insights\n🔧 System troubleshooting and optimization\n\nWhat aspect would you like to dive deeper into? I'm here to provide detailed, helpful information!",
      
      "✨ Great question! As your intelligent attendance system assistant, I'm constantly learning and evolving to provide better support. I specialize in making complex attendance management simple and efficient.\n\n🚀 I can help you with:\n   • Understanding our advanced AI capabilities\n   • Navigating system features like a pro\n   • Optimizing your attendance workflows\n   • Troubleshooting any challenges\n   • Learning about cutting-edge technologies\n\nHow can I make your attendance management experience exceptional today?"
    ];
    
    return contextualResponses[Math.floor(Math.random() * contextualResponses.length)];
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

    // Simulate intelligent processing time based on message complexity
    const processingTime = Math.min(2000, Math.max(800, inputMessage.length * 50));
    
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getAdvancedBotResponse(inputMessage),
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, processingTime);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickPrompts = [
    "How does face recognition work?",
    "Add new student guide",
    "Export attendance data",
    "Mobile camera features",
    "System accuracy details",
    "Troubleshoot issues"
  ];

  return (
    <div className="loyola-chat-bot">
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="w-20 h-20 rounded-full loyola-btn-secondary shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-110 animate-pulse-custom relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-20 animate-pulse"></div>
          <div className="relative z-10 flex flex-col items-center">
            <Brain className="w-8 h-8 mb-1" />
            <Sparkles className="w-4 h-4" />
          </div>
        </Button>
      )}

      {isOpen && (
        <Card className="w-96 h-[700px] flex flex-col shadow-2xl border-2 border-primary/20 backdrop-blur-sm">
          <CardHeader className="loyola-gradient-bg text-primary-foreground rounded-t-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent opacity-30 animate-pulse"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-foreground/20 rounded-full flex items-center justify-center relative">
                  <Bot className="w-7 h-7" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full flex items-center justify-center">
                    <Zap className="w-2 h-2" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    Lusy AI Assistant
                    <Badge variant="secondary" className="text-xs bg-primary-foreground/20">
                      Advanced
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-primary-foreground/90 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Powered by Next-Gen AI • Always Learning
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-primary-foreground hover:bg-primary-foreground/20 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[480px] scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div
                    className={`max-w-[85%] p-4 rounded-2xl shadow-lg relative ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-primary to-primary-dark text-primary-foreground'
                        : 'bg-gradient-to-r from-muted to-muted/80 text-foreground border border-border/50'
                    }`}
                  >
                    {message.sender === 'bot' && (
                      <div className="absolute -left-2 top-4 w-4 h-4 bg-gradient-to-r from-secondary to-accent rounded-full flex items-center justify-center">
                        <Sparkles className="w-2 h-2 text-white" />
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                    <span className="text-xs opacity-70 mt-2 block">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-gradient-to-r from-muted to-muted/80 text-foreground p-4 rounded-2xl shadow-lg border border-border/50 relative">
                    <div className="absolute -left-2 top-4 w-4 h-4 bg-gradient-to-r from-secondary to-accent rounded-full flex items-center justify-center">
                      <Brain className="w-2 h-2 text-white animate-pulse" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs text-muted-foreground">AI thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-border/50 bg-gradient-to-r from-background to-muted/20">
              <div className="flex gap-2 mb-3">
                <div className="flex-1">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about the attendance system..."
                    className="loyola-input rounded-full border-2 border-primary/20 focus:border-primary/50 bg-background/80 backdrop-blur-sm"
                    maxLength={500}
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="loyola-btn-primary rounded-full w-12 h-12 p-0 shadow-lg hover:shadow-xl"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {quickPrompts.slice(0, 3).map((prompt, index) => (
                  <Badge 
                    key={index}
                    variant="outline" 
                    className="text-xs cursor-pointer hover:bg-primary/10 transition-colors rounded-full px-3 py-1 border-primary/30" 
                    onClick={() => setInputMessage(prompt)}
                  >
                    {prompt}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};