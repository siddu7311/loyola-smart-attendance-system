import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  QrCode, 
  Download, 
  Copy, 
  CheckCircle, 
  FileText,
  Calendar,
  Users,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRCodeDisplayProps {
  qrCodeDataURL: string;
  filename: string;
  recordCount: number;
  reportType: string;
  dateRange?: { start?: string; end?: string };
  onClose?: () => void;
}

export const QRCodeDisplay = ({ 
  qrCodeDataURL, 
  filename, 
  recordCount, 
  reportType,
  dateRange,
  onClose 
}: QRCodeDisplayProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyQRCode = async () => {
    try {
      // Convert data URL to blob and copy to clipboard
      const response = await fetch(qrCodeDataURL);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      
      setCopied(true);
      toast({
        title: "QR Code Copied! 📋",
        description: "QR code has been copied to clipboard",
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy QR code to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDownloadQRCode = () => {
    const link = document.createElement('a');
    link.href = qrCodeDataURL;
    link.download = `${filename.replace(/\.[^/.]+$/, '')}_qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "QR Code Downloaded! 📱",
      description: "QR code has been saved to your device",
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const getReportIcon = () => {
    switch (reportType) {
      case 'Attendance Report':
        return <Calendar className="w-5 h-5" />;
      case 'Students List':
        return <Users className="w-5 h-5" />;
      case 'Attendance Summary':
        return <BarChart3 className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getDateRangeText = () => {
    if (!dateRange?.start && !dateRange?.end) {
      return "All records";
    }
    
    if (dateRange.start && dateRange.end) {
      return `${dateRange.start} to ${dateRange.end}`;
    }
    
    if (dateRange.start) {
      return `From ${dateRange.start}`;
    }
    
    if (dateRange.end) {
      return `Until ${dateRange.end}`;
    }
    
    return "All records";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            Report QR Code
          </DialogTitle>
          <DialogDescription>
            Scan this QR code to verify report authenticity and view metadata
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Report Info */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-3">
                {getReportIcon()}
                <span className="font-semibold">{reportType}</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">File:</span>
                  <span className="font-mono text-xs">{filename}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Records:</span>
                  <Badge variant="secondary">{recordCount}</Badge>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date Range:</span>
                  <span className="text-xs">{getDateRangeText()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Generated:</span>
                  <span className="text-xs">{new Date().toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="relative">
              <img 
                src={qrCodeDataURL} 
                alt="Report QR Code" 
                className="w-48 h-48 border-2 border-gray-200 rounded-lg"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/90 px-2 py-1 rounded text-xs font-semibold">
                  Loyola Smart Attendance
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              onClick={handleDownloadQRCode} 
              variant="outline" 
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Download QR
            </Button>
            
            <Button 
              onClick={handleCopyQRCode} 
              variant="outline" 
              className="flex-1"
              disabled={copied}
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy QR
                </>
              )}
            </Button>
          </div>

          {/* Info */}
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>• QR code contains report metadata and verification info</p>
            <p>• Scan with any QR code reader to view details</p>
            <p>• Use for report authenticity verification</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};





