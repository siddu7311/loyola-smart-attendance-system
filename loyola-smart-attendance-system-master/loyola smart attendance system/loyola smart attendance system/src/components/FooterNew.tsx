import { Instagram, Mail, Phone, MapPin, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LoyolaLogo } from "@/components/LoyolaLogo";

export const FooterNew = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="loyola-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <LoyolaLogo size="md" />
            </div>
            <p className="text-muted-foreground text-sm mb-4 max-w-md">
              Revolutionary AI-powered attendance management system for Loyola College. 
              Streamlining education with cutting-edge facial recognition technology.
            </p>
            <Badge className="bg-accent/10 text-accent border-accent/20">
              ✨ 2025 Edition - Latest Technology
            </Badge>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#about" className="hover:text-foreground transition-colors">About</a></li>
              <li><a href="/contact" className="hover:text-foreground transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <span>attendance@loyola.edu</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <span>+91 44 2817 8200</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Chennai, Tamil Nadu</span>
              </div>
            </div>
          </div>
        </div>

        {/* Developer Credits */}
        <div className="border-t border-border mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-muted-foreground">
                © 2025 Loyola Smart Attendance System. All rights reserved.
              </p>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-sm font-medium flex items-center gap-2">
                  Developed with <span className="text-primary font-bold">❤️</span> by
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold loyola-gradient-text">Sudharshan</span>
                    <a 
                      href="https://instagram.com/sudharshan" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:scale-110 transition-transform"
                    >
                      <Instagram className="w-4 h-4" />
                    </a>
                  </div>
                  <span className="text-muted-foreground">&</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold loyola-gradient-text">Chandu Kumar</span>
                    <a 
                      href="https://instagram.com/chandukumar" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:scale-110 transition-transform"
                    >
                      <Instagram className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Built with React, TypeScript, Tailwind CSS, Supabase & AI Technology
          </p>
        </div>
      </div>
    </footer>
  );
};