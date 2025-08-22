import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Users, 
  Calendar, 
  BarChart3, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ReportGenerator } from "@/utils/reportGenerator";
import { QRCodeDisplay } from "./QRCodeDisplay";

interface ReportDownloaderProps {
  className?: string;
}

export const ReportDownloader = ({ className }: ReportDownloaderProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [reportType, setReportType] = useState<string>('attendance');
  const [format, setFormat] = useState<string>('csv');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [qrCodeData, setQrCodeData] = useState<{
    qrCode: string;
    filename: string;
    recordCount: number;
    reportType: string;
    dateRange?: { start?: string; end?: string };
  } | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setIsLoading(true);
    
    try {
      let result;
      
      switch (reportType) {
        case 'attendance':
          if (format === 'csv') {
            result = await ReportGenerator.downloadAttendanceCSV(startDate || undefined, endDate || undefined);
          } else {
            result = await ReportGenerator.downloadAttendanceExcel(startDate || undefined, endDate || undefined);
          }
          break;
          
        case 'students':
          if (format === 'csv') {
            result = await ReportGenerator.downloadStudentsCSV();
          } else {
            result = await ReportGenerator.downloadStudentsExcel();
          }
          break;
          
        case 'summary':
          result = await ReportGenerator.downloadAttendanceSummaryCSV(startDate || undefined, endDate || undefined);
          break;
          
        default:
          throw new Error('Invalid report type');
      }
      
      toast({
        title: "Download Successful! 📁",
        description: `Report "${result.filename}" has been downloaded to your Chrome Downloads folder.`,
      });
      
      // Show QR code if available
      if (result.qrCode) {
        setQrCodeData({
          qrCode: result.qrCode,
          filename: result.filename,
          recordCount: result.recordCount,
          reportType: getReportTypeDisplayName(reportType),
          dateRange: startDate || endDate ? { start: startDate, end: endDate } : undefined
        });
        setShowQRCode(true);
      }
      
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getReportDescription = () => {
    switch (reportType) {
      case 'attendance':
        return "Detailed attendance records with student information, date, and status";
      case 'students':
        return "Complete list of all registered students with their details";
      case 'summary':
        return "Daily attendance summary with totals and percentages";
      default:
        return "";
    }
  };

  const getFormatDescription = () => {
    switch (format) {
      case 'csv':
        return "Comma-separated values file, opens in Excel or any spreadsheet software";
      case 'excel':
        return "Excel file (.xlsx) with formatting and multiple sheets support";
      default:
        return "";
    }
  };

  const getReportTypeDisplayName = (type: string) => {
    switch (type) {
      case 'attendance':
        return 'Attendance Report';
      case 'students':
        return 'Students List';
      case 'summary':
        return 'Attendance Summary';
      default:
        return type;
    }
  };

  return (
    <>
      <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5 text-primary" />
          Download Reports
        </CardTitle>
        <CardDescription>
          Generate and download reports directly to your device
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report Type Selection */}
        <div className="space-y-2">
          <Label htmlFor="report-type">Report Type</Label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger>
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="attendance">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Attendance Report
                </div>
              </SelectItem>
              <SelectItem value="students">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Students List
                </div>
              </SelectItem>
              <SelectItem value="summary">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Attendance Summary
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">{getReportDescription()}</p>
        </div>

        {/* Format Selection */}
        <div className="space-y-2">
          <Label htmlFor="format">File Format</Label>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger>
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  CSV (.csv)
                </div>
              </SelectItem>
              <SelectItem value="excel">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel (.xlsx)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">{getFormatDescription()}</p>
        </div>

        {/* Date Range (for attendance reports) */}
        {(reportType === 'attendance' || reportType === 'summary') && (
          <div className="space-y-4">
            <Label>Date Range (Optional)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Start date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="End date"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Leave empty to download all records
            </p>
          </div>
        )}

        {/* Download Button */}
        <Button 
          onClick={handleDownload} 
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Report...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </>
          )}
        </Button>

        {/* Info Alert */}
        <Alert>
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Direct Download:</strong> Reports will be saved directly to your Chrome Downloads folder. 
            No need to access Supabase dashboard.
          </AlertDescription>
        </Alert>

        {/* Report Types Info */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Available Reports:</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Attendance Report</Badge>
              <span className="text-xs text-muted-foreground">
                Student ID, Name, Department, Date, Morning/Afternoon status, Notes
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Students List</Badge>
              <span className="text-xs text-muted-foreground">
                Complete student information including contact details and registration date
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Attendance Summary</Badge>
              <span className="text-xs text-muted-foreground">
                Daily totals, present/absent counts, and attendance percentages
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* QR Code Display */}
    {showQRCode && qrCodeData && (
      <QRCodeDisplay
        qrCodeDataURL={qrCodeData.qrCode}
        filename={qrCodeData.filename}
        recordCount={qrCodeData.recordCount}
        reportType={qrCodeData.reportType}
        dateRange={qrCodeData.dateRange}
        onClose={() => {
          setShowQRCode(false);
          setQrCodeData(null);
        }}
      />
    )}
  </>
  );
};
