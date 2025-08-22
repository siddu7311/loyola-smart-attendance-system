import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Download, FileText, FileSpreadsheet, FileX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { attendanceExporter, AttendanceData } from "@/utils/exportUtils";

export const DateRangeAttendanceReport = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv' | 'pdf'>('excel');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Date Range Required",
        description: "Please select both start and end dates.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Fetch attendance data from Supabase
      const { data: attendanceRecords, error } = await supabase
        .from('attendance_records')
        .select(`
          *,
          students (
            full_name,
            student_id,
            phone_number,
            email
          )
        `)
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate)
        .order('attendance_date', { ascending: true });

      if (error) {
        throw error;
      }

      if (!attendanceRecords || attendanceRecords.length === 0) {
        toast({
          title: "No Data Found",
          description: "No attendance records found for the selected date range.",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      // Transform data for export
      const exportData: AttendanceData[] = attendanceRecords.map(record => ({
        studentId: record.students?.student_id || 'N/A',
        studentName: record.students?.full_name || 'Unknown',
        pinNumber: record.students?.student_id || 'N/A',
        phoneNumber: record.students?.phone_number || 'N/A',
        email: Array.isArray(record.students?.email) 
          ? record.students.email[0] || 'N/A' 
          : record.students?.email || 'N/A',
        date: record.attendance_date || new Date().toISOString().split('T')[0],
        morningStatus: (record.morning_status || 'absent') as 'present' | 'absent',
        afternoonStatus: (record.afternoon_status || 'absent') as 'present' | 'absent',
        dayStatus: (record.day_status || 'absent') as 'present' | 'absent' | 'partial'
      }));

      // Generate and download report
      const result = await attendanceExporter.exportAttendance(exportData, {
        format: exportFormat,
        includeQR: true,
        dateRange: {
          start: startDate,
          end: endDate
        }
      });

      if (result.success) {
        toast({
          title: "Report Downloaded! 📊",
          description: `${exportFormat.toUpperCase()} report with ${exportData.length} records has been downloaded to your device.`,
        });
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Export Error",
        description: "Failed to generate attendance report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="loyola-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary" />
          Date Range Attendance Report
        </CardTitle>
        <CardDescription>
          Generate comprehensive attendance reports for any date range
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="loyola-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="loyola-input"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="exportFormat">Export Format</Label>
          <Select value={exportFormat} onValueChange={(value: 'excel' | 'csv' | 'pdf') => setExportFormat(value)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excel">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  Excel (.xlsx) - Recommended
                </div>
              </SelectItem>
              <SelectItem value="csv">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  CSV (.csv) - Simple data
                </div>
              </SelectItem>
              <SelectItem value="pdf">
                <div className="flex items-center gap-2">
                  <FileX className="w-4 h-4 text-red-600" />
                  PDF (.pdf) - Print ready
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={generateReport}
          disabled={!startDate || !endDate || isGenerating}
          className="loyola-btn-primary w-full"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
              Generating {exportFormat.toUpperCase()} Report...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download {exportFormat.toUpperCase()} Report
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};