import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, Users, BookOpen, GraduationCap, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LoyolaLogo } from "@/components/LoyolaLogo";

const ContactNew = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    category: "general"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Insert message into database
      const { error } = await supabase
        .from('contact_messages')
        .insert({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          category: formData.category,
          status: 'unread',
          priority: formData.category === 'technical' ? 'high' : 'normal'
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Message Sent Successfully! 📧",
        description: "Thank you for contacting us. We'll get back to you within 24 hours.",
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
        category: "general"
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="loyola-container">
          <div className="flex items-center justify-between h-16">
            <LoyolaLogo size="md" />
            <div>
              <h1 className="font-bold text-lg loyola-gradient-text">Loyola Smart</h1>
              <p className="text-xs text-muted-foreground -mt-1">Attendance System</p>
            </div>
            <Button 
              onClick={() => window.location.href = "/"} 
              variant="outline"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10" />
        <div className="loyola-container relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              📞 Contact Support
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 loyola-gradient-text">
              Get in Touch
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Need assistance with the Smart Attendance System at Loyola Polytechnic College Pulivendula? We're here to support you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-20">
        <div className="loyola-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="loyola-card-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Send us a Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Name</label>
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your full name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        { id: "general", label: "General", icon: MessageSquare },
                        { id: "technical", label: "Technical", icon: Users },
                        { id: "faculty", label: "Faculty", icon: BookOpen },
                        { id: "student", label: "Student", icon: GraduationCap }
                      ].map((category) => (
                        <Badge
                          key={category.id}
                          variant={formData.category === category.id ? "default" : "outline"}
                          className="cursor-pointer p-3 justify-center"
                          onClick={() => setFormData(prev => ({ ...prev, category: category.id }))}
                        >
                          <category.icon className="w-4 h-4 mr-1" />
                          {category.label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Subject</label>
                    <Input
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Brief description of your inquiry"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Message</label>
                    <Textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Please provide details about your question or issue..."
                      rows={5}
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full loyola-btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-6">
              <Card className="loyola-card-hover">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-primary" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="font-medium">Email Support</p>
                      <p className="text-muted-foreground">loyolapoly.pulivendla@gmail.com</p>
                      <p className="text-muted-foreground">info@loyolapolytechnic.co.in</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="font-medium">Phone Support</p>
                      <p className="text-muted-foreground">+91 9912342029</p>
                      <p className="text-muted-foreground">08568 - 286309</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="font-medium">Campus Location</p>
                      <p className="text-muted-foreground">
                        Loyola Polytechnic College (YSRR)<br />
                        Pulivendla - 516390, YSR District<br />
                        Andhra Pradesh, India
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="font-medium">Website</p>
                      <p className="text-muted-foreground">
                        <a 
                          href="https://www.loyolapolytechnic.co.in" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          www.loyolapolytechnic.co.in
                        </a>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="font-medium">Support Hours</p>
                      <p className="text-muted-foreground">
                        Monday - Friday: 9:00 AM - 4:30 PM<br />
                        Saturday: 9:00 AM - 1:00 PM<br />
                        Sunday: Closed
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="loyola-card-hover">
                <CardHeader>
                  <CardTitle>Quick Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-primary/5 rounded-lg">
                      <p className="font-medium text-sm">Technical Issues</p>
                      <p className="text-xs text-muted-foreground">
                        Camera not working, login problems, system errors
                      </p>
                    </div>
                    <div className="p-3 bg-secondary/5 rounded-lg">
                      <p className="font-medium text-sm">Faculty Support</p>
                      <p className="text-xs text-muted-foreground">
                        Student management, attendance recording, reports
                      </p>
                    </div>
                    <div className="p-3 bg-accent/5 rounded-lg">
                      <p className="font-medium text-sm">Student Help</p>
                      <p className="text-xs text-muted-foreground">
                        Viewing attendance, account issues, data export
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-muted/30">
        <div className="loyola-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Quick answers to common questions</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                question: "How do I reset my password?",
                answer: "Contact the IT department with your employee/student ID, and they'll help you reset your password securely."
              },
              {
                question: "Camera not working for attendance?", 
                answer: "Ensure your browser has camera permissions enabled. Try refreshing the page or using a different browser."
              },
              {
                question: "How to export attendance reports?",
                answer: "Go to your dashboard, navigate to the Reports section, select your date range, and click Export to Excel."
              },
              {
                question: "Need help adding students?",
                answer: "Faculty members can add students in the Students section. Ensure you have proper photos for face recognition."
              }
            ].map((faq, index) => (
              <Card key={index} className="loyola-card-hover">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactNew;