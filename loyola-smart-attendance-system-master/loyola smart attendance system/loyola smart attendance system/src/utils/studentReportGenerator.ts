import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';
import QRCode from 'qrcode';

export interface StudentAttendanceData {
  date: string;
  morning_status: string;
  afternoon_status: string;
  day_status: string;
  notes?: string;
}

export interface StudentReportResult {
  success: boolean;
  message: string;
  qrCode?: string;
  recordCount?: number;
  filename?: string;
}

export class StudentReportGenerator {
  private studentId: string;
  private studentName: string;

  constructor(studentId: string, studentName: string) {
    this.studentId = studentId;
    this.studentName = studentName;
  }

  /**
   * Generate CSV content from data
   */
  private generateCSV(data: any[], headers: string[]): string {
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');
    
    return csvContent;
  }

  /**
   * Generate Excel file from data
   */
  private generateExcel(data: any[], sheetName: string): Blob {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  /**
   * Download file to user's device
   */
  private downloadFile(content: Blob | string, filename: string, mimeType: string): void {
    const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Set additional attributes to ensure proper download behavior
    link.style.display = 'none';
    link.setAttribute('download', filename);
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  }

  /**
   * Generate QR code for report metadata
   */
  private async generateQRCode(data: any): Promise<string> {
    try {
      const metadata = {
        reportType: 'Student Attendance Report',
        studentName: this.studentName,
        studentId: this.studentId,
        recordCount: data.length,
        generatedAt: new Date().toISOString(),
        system: 'Loyola Smart Attendance System',
        version: '1.0.0'
      };
      
      const qrData = JSON.stringify(metadata, null, 2);
      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  }

  /**
   * Get student attendance data for a specific date range
   */
  private async getAttendanceData(startDate?: string, endDate?: string): Promise<StudentAttendanceData[]> {
    try {
      let query = supabase
        .from('attendance_records')
        .select('*')
        .eq('student_id', this.studentId)
        .order('attendance_date', { ascending: false });

      if (startDate) {
        query = query.gte('attendance_date', startDate);
      }
      if (endDate) {
        query = query.lte('attendance_date', endDate);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Map the database data to match the interface
      return (data || []).map(record => ({
        date: record.attendance_date,
        morning_status: record.morning_status,
        afternoon_status: record.afternoon_status,
        day_status: record.day_status,
        notes: record.notes
      }));
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      return [];
    }
  }

  /**
   * Download current month attendance report
   */
  async downloadCurrentMonthReport(): Promise<StudentReportResult> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const data = await this.getAttendanceData(
        startOfMonth.toISOString().split('T')[0],
        endOfMonth.toISOString().split('T')[0]
      );

      if (data.length === 0) {
        return {
          success: false,
          message: 'No attendance data found for current month'
        };
      }

      const headers = ['Date', 'Morning Status', 'Afternoon Status', 'Day Status', 'Notes'];
      const csvData = data.map(record => ({
        Date: new Date(record.date).toLocaleDateString('en-US', { 
          weekday: 'short', 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        'Morning Status': record.morning_status,
        'Afternoon Status': record.afternoon_status,
        'Day Status': record.day_status,
        'Notes': record.notes || ''
      }));

      const filename = `${this.studentName}_CurrentMonth_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}.csv`;
      const csvContent = this.generateCSV(csvData, headers);
      
      this.downloadFile(csvContent, filename, 'text/csv');

      const qrCode = await this.generateQRCode(data);

      return {
        success: true,
        message: 'Current month report downloaded successfully',
        qrCode,
        recordCount: data.length,
        filename
      };
    } catch (error) {
      console.error('Error downloading current month report:', error);
      return {
        success: false,
        message: 'Failed to download current month report'
      };
    }
  }

  /**
   * Download semester attendance report
   */
  async downloadSemesterReport(): Promise<StudentReportResult> {
    try {
      const now = new Date();
      const startOfSemester = new Date(now.getFullYear(), 0, 1); // January 1st
      const endOfSemester = new Date(now.getFullYear(), 11, 31); // December 31st
      
      const data = await this.getAttendanceData(
        startOfSemester.toISOString().split('T')[0],
        endOfSemester.toISOString().split('T')[0]
      );

      if (data.length === 0) {
        return {
          success: false,
          message: 'No attendance data found for this semester'
        };
      }

      const headers = ['Date', 'Morning Status', 'Afternoon Status', 'Day Status', 'Notes'];
      const csvData = data.map(record => ({
        Date: new Date(record.date).toLocaleDateString('en-US', { 
          weekday: 'short', 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        'Morning Status': record.morning_status,
        'Afternoon Status': record.afternoon_status,
        'Day Status': record.day_status,
        'Notes': record.notes || ''
      }));

      const filename = `${this.studentName}_Semester_${now.getFullYear()}.csv`;
      const csvContent = this.generateCSV(csvData, headers);
      
      this.downloadFile(csvContent, filename, 'text/csv');

      const qrCode = await this.generateQRCode(data);

      return {
        success: true,
        message: 'Semester report downloaded successfully',
        qrCode,
        recordCount: data.length,
        filename
      };
    } catch (error) {
      console.error('Error downloading semester report:', error);
      return {
        success: false,
        message: 'Failed to download semester report'
      };
    }
  }

  /**
   * Download custom date range attendance report
   */
  async downloadCustomRangeReport(startDate: string, endDate: string): Promise<StudentReportResult> {
    try {
      const data = await this.getAttendanceData(startDate, endDate);

      if (data.length === 0) {
        return {
          success: false,
          message: 'No attendance data found for the selected date range'
        };
      }

      const headers = ['Date', 'Morning Status', 'Afternoon Status', 'Day Status', 'Notes'];
      const csvData = data.map(record => ({
        Date: new Date(record.date).toLocaleDateString('en-US', { 
          weekday: 'short', 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        'Morning Status': record.morning_status,
        'Afternoon Status': record.afternoon_status,
        'Day Status': record.day_status,
        'Notes': record.notes || ''
      }));

      const start = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const end = new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const filename = `${this.studentName}_CustomRange_${start}_to_${end}.csv`;
      
      const csvContent = this.generateCSV(csvData, headers);
      this.downloadFile(csvContent, filename, 'text/csv');

      const qrCode = await this.generateQRCode(data);

      return {
        success: true,
        message: 'Custom range report downloaded successfully',
        qrCode,
        recordCount: data.length,
        filename
      };
    } catch (error) {
      console.error('Error downloading custom range report:', error);
      return {
        success: false,
        message: 'Failed to download custom range report'
      };
    }
  }

  /**
   * Download Excel format report
   */
  async downloadExcelReport(reportType: 'current-month' | 'semester' | 'custom-range', startDate?: string, endDate?: string): Promise<StudentReportResult> {
    try {
      let data: StudentAttendanceData[] = [];
      let filename = '';

      switch (reportType) {
        case 'current-month':
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          data = await this.getAttendanceData(
            startOfMonth.toISOString().split('T')[0],
            endOfMonth.toISOString().split('T')[0]
          );
          filename = `${this.studentName}_CurrentMonth_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}.xlsx`;
          break;

        case 'semester':
          const currentYear = new Date().getFullYear();
          const startOfSemester = new Date(currentYear, 0, 1);
          const endOfSemester = new Date(currentYear, 11, 31);
          data = await this.getAttendanceData(
            startOfSemester.toISOString().split('T')[0],
            endOfSemester.toISOString().split('T')[0]
          );
          filename = `${this.studentName}_Semester_${currentYear}.xlsx`;
          break;

        case 'custom-range':
          if (!startDate || !endDate) {
            return {
              success: false,
              message: 'Start date and end date are required for custom range reports'
            };
          }
          data = await this.getAttendanceData(startDate, endDate);
          const start = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const end = new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          filename = `${this.studentName}_CustomRange_${start}_to_${end}.xlsx`;
          break;
      }

      if (data.length === 0) {
        return {
          success: false,
          message: 'No attendance data found for the selected period'
        };
      }

      const excelData = data.map(record => ({
        Date: new Date(record.date).toLocaleDateString('en-US', { 
          weekday: 'short', 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        'Morning Status': record.morning_status,
        'Afternoon Status': record.afternoon_status,
        'Day Status': record.day_status,
        'Notes': record.notes || ''
      }));

      const excelBlob = this.generateExcel(excelData, 'Attendance Records');
      this.downloadFile(excelBlob, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

      const qrCode = await this.generateQRCode(data);

      return {
        success: true,
        message: 'Excel report downloaded successfully',
        qrCode,
        recordCount: data.length,
        filename
      };
    } catch (error) {
      console.error('Error downloading Excel report:', error);
      return {
        success: false,
        message: 'Failed to download Excel report'
      };
    }
  }
}
