import { useState, useEffect } from "react";
import { Camera, Users, FileSpreadsheet, Bot, GraduationCap, Shield, Clock, CheckCircle, ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LusyChatbot } from "@/components/LusyChatbot";
import { LoginModalNew } from "@/components/LoginModalNew";
import { FooterNew } from "@/components/FooterNew";
import { useAuthWithGoogle } from "@/hooks/useAuthWithGoogle";
import { LoyolaLogo } from "@/components/LoyolaLogo";
import heroImage from "@/assets/loyola-campus-hero.jpg";
import faceRecognitionImage from "@/assets/face-recognition-tech.jpg";
const Index = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const {
    isAuthenticated,
    profile,
    isLoading
  } = useAuthWithGoogle();

  // Don't show login button if already authenticated  
  const showLoginButton = !isAuthenticated && !isLoading;

  // No automatic redirects to prevent buffering issues
  // Users will be redirected after successful login
  return <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="loyola-container">
          <div className="flex items-center justify-between h-16">
            <LoyolaLogo size="md" />
            
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">About</a>
              <a href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
              {showLoginButton && (
                <Button onClick={() => setIsLoginOpen(true)} className="loyola-btn-primary">
                  Login
                </Button>
              )}
              {isAuthenticated && profile && (
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  Welcome, {profile.full_name} ({profile.role})
                </Badge>
              )}
            </div>

            <button className="md:hidden p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && <div className="md:hidden py-4 border-t border-border loyola-mobile-nav">
              <div className="flex flex-col gap-4">
                <a href="#features" className="text-muted-foreground hover:text-foreground">Features</a>
                <a href="#about" className="text-muted-foreground hover:text-foreground">About</a>
                <a href="/contact" className="text-muted-foreground hover:text-foreground">Contact</a>
                {showLoginButton && (
                  <Button onClick={() => setIsLoginOpen(true)} className="loyola-btn-primary w-full">
                    Login
                  </Button>
                )}
                {isAuthenticated && profile && (
                  <Badge className="bg-primary/10 text-primary border-primary/20 w-full justify-center">
                    Welcome, {profile.full_name}
                  </Badge>
                )}
              </div>
            </div>}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10" />
        <div className="absolute inset-0 opacity-20">
          <img src={heroImage} alt="Loyola College Campus" className="w-full h-full object-cover" loading="eager" />
        </div>
        <div className="loyola-container relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 animate-pulse">
              🚀 2025 Edition - Next-Gen Technology
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 loyola-gradient-text">
              AI-Powered Attendance
              <br />Revolution
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience the future of attendance management with advanced AI facial recognition. 
              Process 120+ students in under 10 minutes with 99.9% accuracy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {showLoginButton && (
                <Button onClick={() => setIsLoginOpen(true)} size="lg" className="loyola-btn-primary text-lg px-8 py-6">
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              )}
              {isAuthenticated && profile && (
                <Button size="lg" className="loyola-btn-primary text-lg px-8 py-6" onClick={() => window.location.href = profile.role === 'faculty' ? '/faculty' : '/student'}>
                  Go to Dashboard
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Floating Cards with proper z-index */}
        <div className="absolute top-32 right-10 hidden xl:block z-10">
          <Card className="loyola-card-hover w-56 animate-pulse backdrop-blur-sm bg-card/80">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-sm">95 Students</p>
                  <p className="text-xs text-muted-foreground">Detected in 8 minutes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="absolute bottom-32 left-10 hidden xl:block z-10">
          <Card className="loyola-card-hover w-56 animate-pulse backdrop-blur-sm bg-card/80">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <Camera className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">99.5% Accuracy</p>
                  <p className="text-xs text-muted-foreground">AI Recognition Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="loyola-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need for modern attendance management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="loyola-card-hover group">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors relative overflow-hidden">
                  <img src={faceRecognitionImage} alt="Face Recognition Technology" className="absolute inset-0 w-full h-full object-cover opacity-20" />
                  <Camera className="w-6 h-6 text-primary relative z-10" />
                </div>
                <CardTitle>Face Recognition</CardTitle>
                <CardDescription>
                  Advanced AI-powered facial recognition with real-time detection and matching
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    Real-time camera feed
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    High accuracy matching
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    Mobile-friendly interface
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="loyola-card-hover group">
              <CardHeader>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-2 group-hover:bg-secondary/20 transition-colors">
                  <Clock className="w-6 h-6 text-secondary" />
                </div>
                <CardTitle>Quick Processing</CardTitle>
                <CardDescription>
                  Mark attendance for 120+ students in under 10 minutes with batch processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    Batch recognition
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    Morning & afternoon sessions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    Instant status updates
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="loyola-card-hover group">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-2 group-hover:bg-accent/20 transition-colors">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <CardTitle>Student Management</CardTitle>
                <CardDescription>
                  Comprehensive student database with profile management and photo storage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    Complete profiles
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    Photo management
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    Contact information
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="loyola-card-hover group">
              <CardHeader>
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mb-2 group-hover:bg-warning/20 transition-colors">
                  <FileSpreadsheet className="w-6 h-6 text-warning" />
                </div>
                <CardTitle>Export & Reports</CardTitle>
                <CardDescription>
                  Generate Excel reports with QR codes for easy sharing and record keeping
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    Excel export
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    QR code generation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    Date-wise reports
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="loyola-card-hover group">
              <CardHeader>
                <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center mb-2 group-hover:bg-destructive/20 transition-colors">
                  <Shield className="w-6 h-6 text-destructive" />
                </div>
                <CardTitle>Secure Access</CardTitle>
                <CardDescription>
                  Role-based authentication with separate dashboards for faculty and students
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    Faculty & student roles
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    Encrypted passwords
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    Session management
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="loyola-card-hover group">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Lusy AI Assistant</CardTitle>
                <CardDescription>
                  Intelligent chatbot to help with attendance queries and system navigation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    24/7 assistance
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    Smart responses
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    System guidance
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-gradient-to-r from-muted/30 to-muted/10">
        <div className="loyola-container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="loyola-fade-in">
              <div className="text-4xl md:text-5xl font-bold loyola-gradient-text mb-2">120+</div>
              <p className="text-muted-foreground">Students Processed</p>
            </div>
            <div className="loyola-fade-in">
              <div className="text-4xl md:text-5xl font-bold loyola-gradient-text mb-2">&lt;10</div>
              <p className="text-muted-foreground">Minutes Processing</p>
            </div>
            <div className="loyola-fade-in">
              <div className="text-4xl md:text-5xl font-bold loyola-gradient-text mb-2">99.5%</div>
              <p className="text-muted-foreground">Accuracy Rate</p>
            </div>
            <div className="loyola-fade-in">
              <div className="text-4xl md:text-5xl font-bold loyola-gradient-text mb-2">24/7</div>
              <p className="text-muted-foreground">AI Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20">
        <div className="loyola-container">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">About Loyola Smart Attendance</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Developed specifically for Loyola College, our smart attendance system leverages cutting-edge 
              facial recognition technology to streamline the attendance process. Built with modern web 
              technologies and designed for reliability, accuracy, and ease of use.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
              <Card className="loyola-card text-left">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-primary" />
                    For Faculty
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Comprehensive tools for student management, attendance recording, and report generation. 
                    Take attendance effortlessly using facial recognition technology.
                  </p>
                </CardContent>
              </Card>
              <Card className="loyola-card text-left">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-secondary" />
                    For Students
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    View your attendance records, track your attendance percentage, and export your 
                    attendance history with just a few clicks.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-muted/30">
        <div className="loyola-container">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">Loyola Smart Attendance</span>
            </div>
            <div className="text-sm text-muted-foreground">© 2025 Loyola College. All rights reserved.</div>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModalNew isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      
      {/* Lusy Chatbot */}
      <LusyChatbot />
    </div>;
};
export default Index;