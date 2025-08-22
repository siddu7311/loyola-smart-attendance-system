import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Download, 
  FileSpreadsheet, 
  Calendar, 
  BarChart3, 
  CheckCircle, 
  AlertCircle,
  Info,
  QrCode
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StudentReportGenerator, StudentReportResult } from "@/utils/studentReportGenerator";
import { QRCodeDisplay } from "./QRCodeDisplay";

interface StudentReportDownloaderProps {
  studentId: string;
  studentName: string;
}

export const StudentReportDownloader = ({ studentId, studentName }: StudentReportDownloaderProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [reportType, setReportType] = useState<'current-month' | 'semester' | 'custom-range'>('current-month');
  const [format, setFormat] = useState<'csv' | 'excel'>('csv');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [qrCodeData, setQrCodeData] = useState<{
    qrCodeDataURL: string;
    filename: string;
    recordCount: number;
    reportType: string;
    dateRange?: { start?: string; end?: string };
  } | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const { toast } = useToast();

  const reportGenerator = new StudentReportGenerator(studentId, studentName);

  const handleDownload = async () => {
    if (reportType === 'custom-range' && (!startDate || !endDate)) {
      toast({
        title: "Date Range Required",
        description: "Please select both start and end dates for custom range reports.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    let result: StudentReportResult;

    try {
      if (format === 'excel') {
        result = await reportGenerator.downloadExcelReport(reportType, startDate, endDate);
      } else {
        switch (reportType) {
          case 'current-month':
            result = await reportGenerator.downloadCurrentMonthReport();
            break;
          case 'semester':
            result = await reportGenerator.downloadSemesterReport();
            break;
          case 'custom-range':
            result = await reportGenerator.downloadCustomRangeReport(startDate, endDate);
            break;
          default:
            result = { success: false, message: 'Invalid report type' };
        }
      }

      if (result.success) {
        toast({
          title: "Report Downloaded! 🎉",
          description: "Personal attendance report downloaded to your Chrome Downloads folder successfully",
        });

        // Show QR code if available
        if (result.qrCode && result.filename && result.recordCount) {
          const dateRange = reportType === 'custom-range' 
            ? { start: startDate, end: endDate }
            : reportType === 'current-month'
            ? { start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0] }
            : { start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], end: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0] };

          setQrCodeData({
            qrCodeDataURL: result.qrCode,
            filename: result.filename,
            recordCount: result.recordCount,
            reportType: format === 'excel' ? 'Excel Report' : 'CSV Report',
            dateRange
          });
          setShowQRCode(true);
        }
      } else {
        toast({
          title: "Download Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: "Error",
        description: "Failed to download report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'current-month': return 'Current Month';
      case 'semester': return 'Full Semester';
      case 'custom-range': return 'Custom Date Range';
      default: return type;
    }
  };

  const getFormatLabel = (format: string) => {
    return format === 'excel' ? 'Excel (.xlsx)' : 'CSV (.csv)';
  };

  return (
    <>
      <Card className="loyola-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Download Your Attendance Reports
          </CardTitle>
          <CardDescription>
            Generate and download your personal attendance reports with QR codes for verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Report Type Selection */}
          <div className="space-y-3">
            <Label>Report Type</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                variant={reportType === 'current-month' ? 'default' : 'outline'}
                className="h-auto p-4 flex-col gap-2"
                onClick={() => setReportType('current-month')}
              >
                <Calendar className="w-6 h-6" />
                <div className="text-center">
                  <div className="font-semibold">Current Month</div>
                  <div className="text-sm opacity-80">This month's data</div>
                </div>
              </Button>
              
              <Button
                variant={reportType === 'semester' ? 'default' : 'outline'}
                className="h-auto p-4 flex-col gap-2"
                onClick={() => setReportType('semester')}
              >
                <BarChart3 className="w-6 h-6" />
                <div className="text-center">
                  <div className="font-semibold">Full Semester</div>
                  <div className="text-sm opacity-80">Complete year data</div>
                </div>
              </Button>
              
              <Button
                variant={reportType === 'custom-range' ? 'default' : 'outline'}
                className="h-auto p-4 flex-col gap-2"
                onClick={() => setReportType('custom-range')}
              >
                <Calendar className="w-6 h-6" />
                <div className="text-center">
                  <div className="font-semibold">Custom Range</div>
                  <div className="text-sm opacity-80">Select dates</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Custom Date Range */}
          {reportType === 'custom-range' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate || undefined}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || undefined}
                />
              </div>
            </div>
          )}

          {/* Format Selection */}
          <div className="space-y-3">
            <Label>File Format</Label>
            <Select value={format} onValueChange={(value: 'csv' | 'excel') => setFormat(value)}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    CSV (.csv) - Universal format
                  </div>
                </SelectItem>
                <SelectItem value="excel">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Excel (.xlsx) - Advanced formatting
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Download Button */}
          <Button 
            onClick={handleDownload}
            disabled={isLoading || (reportType === 'custom-range' && (!startDate || !endDate))}
            className="w-full loyola-btn-primary h-12 text-lg"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Generating Report...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Download {getReportTypeLabel(reportType)} Report ({getFormatLabel(format)})
              </>
            )}
          </Button>

          {/* Report Info */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              Report Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Report Type:</p>
                <p className="font-medium">{getReportTypeLabel(reportType)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">File Format:</p>
                <p className="font-medium">{getFormatLabel(format)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Student:</p>
                <p className="font-medium">{studentName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Student ID:</p>
                <p className="font-medium">{studentId}</p>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h4 className="font-semibold">Report Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-accent" />
                QR code for verification
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-accent" />
                Session-wise attendance data
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-accent" />
                Detailed date information
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-accent" />
                Professional formatting
              </div>
            </div>
          </div>

          {/* Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Reports are downloaded directly to your device's Downloads folder. Each report includes a unique QR code for verification purposes.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* QR Code Display */}
      {showQRCode && qrCodeData && (
        <QRCodeDisplay
          qrCodeDataURL={qrCodeData.qrCodeDataURL}
          filename={qrCodeData.filename}
          recordCount={qrCodeData.recordCount}
          reportType={qrCodeData.reportType}
          dateRange={qrCodeData.dateRange}
          onClose={() => setShowQRCode(false)}
        />
      )}
    </>
  );
};
