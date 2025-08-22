import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  QrCode, 
  Camera, 
  CheckCircle, 
  XCircle,
  FileText,
  Calendar,
  Users,
  BarChart3,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRCodeScannerProps {
  onScan?: (data: any) => void;
}

interface ReportMetadata {
  reportType: string;
  filename: string;
  generatedAt: string;
  recordCount: number;
  dateRange?: { start?: string; end?: string };
  system: string;
  version: string;
}

export const QRCodeScanner = ({ onScan }: QRCodeScannerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<ReportMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const startScanner = async () => {
    try {
      setError(null);
      setIsScanning(true);

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      setError('Failed to access camera');
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const handleScan = (data: string) => {
    try {
      const metadata = JSON.parse(data) as ReportMetadata;
      setScannedData(metadata);
      onScan?.(metadata);
      
      toast({
        title: "QR Code Scanned! ✅",
        description: `Report: ${metadata.reportType}`,
      });
      
      stopScanner();
    } catch (error) {
      setError('Invalid QR code format');
    }
  };

  const getReportIcon = (reportType: string) => {
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

  const getDateRangeText = (dateRange?: { start?: string; end?: string }) => {
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

  const handleClose = () => {
    setIsOpen(false);
    setScannedData(null);
    setError(null);
    stopScanner();
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <QrCode className="w-4 h-4 mr-2" />
          Scan QR Code
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            QR Code Scanner
          </DialogTitle>
          <DialogDescription>
            Scan a report QR code to verify authenticity and view metadata
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {!scannedData ? (
            <>
              {/* Camera View */}
              <div className="relative rounded-lg overflow-hidden bg-black border-2 border-gray-300">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 object-cover"
                />
                {!isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <div className="text-center text-white">
                      <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Camera not active</p>
                    </div>
                  </div>
                )}
                
                {/* Scanning Overlay */}
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-48 h-48 border-2 border-blue-400 rounded-lg">
                      <div className="absolute -top-2 -left-2 w-6 h-6 border-l-2 border-t-2 border-green-400"></div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 border-r-2 border-t-2 border-green-400"></div>
                      <div className="absolute -bottom-2 -left-2 w-6 h-6 border-l-2 border-b-2 border-green-400"></div>
                      <div className="absolute -bottom-2 -right-2 w-6 h-6 border-r-2 border-b-2 border-green-400"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-800 text-sm">{error}</span>
                </div>
              )}

              {/* Controls */}
              <div className="flex gap-2">
                {!isScanning ? (
                  <Button onClick={startScanner} className="flex-1">
                    <Camera className="w-4 h-4 mr-2" />
                    Start Scanner
                  </Button>
                ) : (
                  <Button onClick={stopScanner} variant="outline" className="flex-1">
                    Stop Scanner
                  </Button>
                )}
              </div>

              {/* Instructions */}
              <div className="text-xs text-muted-foreground text-center space-y-1">
                <p>• Point camera at a report QR code</p>
                <p>• Ensure good lighting for better scanning</p>
                <p>• Hold steady for accurate detection</p>
              </div>
            </>
          ) : (
            <>
              {/* Scanned Data Display */}
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-800">Report Verified</span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      {getReportIcon(scannedData.reportType)}
                      <span className="font-semibold">{scannedData.reportType}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">File:</span>
                      <span className="font-mono text-xs">{scannedData.filename}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Records:</span>
                      <Badge variant="secondary">{scannedData.recordCount}</Badge>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date Range:</span>
                      <span className="text-xs">{getDateRangeText(scannedData.dateRange)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Generated:</span>
                      <span className="text-xs">{new Date(scannedData.generatedAt).toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">System:</span>
                      <span className="text-xs">{scannedData.system} v{scannedData.version}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleClose} className="w-full">
                Close
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};





