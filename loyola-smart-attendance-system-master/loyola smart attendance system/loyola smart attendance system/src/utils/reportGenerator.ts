import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';
import QRCode from 'qrcode';

export interface AttendanceReport {
  studentId: string;
  fullName: string;
  department: string;
  attendanceDate: string;
  morningStatus: string;
  afternoonStatus: string;
  dayStatus: string;
  notes?: string;
}

export interface StudentReport {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  department: string;
  parentName: string;
  address: string;
  dateOfBirth: string;
  createdAt: string;
}

export class ReportGenerator {
  // Generate CSV content
  static generateCSV(data: any[], headers: string[]): string {
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

  // Generate Excel file
  static generateExcel(data: any[], sheetName: string): Blob {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  // Generate QR code for report
  static async generateQRCode(data: string): Promise<string> {
    try {
      const qrDataURL = await QRCode.toDataURL(data, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrDataURL;
    } catch (error) {
      console.error('QR code generation error:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  // Generate report metadata for QR code
  static generateReportMetadata(
    reportType: string,
    filename: string,
    recordCount: number,
    dateRange?: { start?: string; end?: string }
  ): string {
    const metadata = {
      reportType,
      filename,
      generatedAt: new Date().toISOString(),
      recordCount,
      dateRange,
      system: 'Loyola Smart Attendance System',
      version: '1.0'
    };
    
    return JSON.stringify(metadata, null, 2);
  }

  // Download file to user's device
  static downloadFile(content: string | Blob, filename: string, mimeType: string) {
    const blob = typeof content === 'string' 
      ? new Blob([content], { type: mimeType })
      : content;
    
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

  // Get attendance data from database
  static async getAttendanceData(startDate?: string, endDate?: string): Promise<AttendanceReport[]> {
    let query = supabase
      .from('attendance_records')
      .select(`
        *,
        students (
          student_id,
          full_name,
          department
        )
      `)
      .order('attendance_date', { ascending: false });

    if (startDate) {
      query = query.gte('attendance_date', startDate);
    }
    if (endDate) {
      query = query.lte('attendance_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch attendance data: ${error.message}`);
    }

    return data?.map(record => ({
      studentId: record.students?.student_id || '',
      fullName: record.students?.full_name || '',
      department: record.students?.department || '',
      attendanceDate: record.attendance_date,
      morningStatus: record.morning_status || 'absent',
      afternoonStatus: record.afternoon_status || 'absent',
      dayStatus: record.day_status || 'absent',
      notes: record.notes || ''
    })) || [];
  }

  // Get students data from database
  static async getStudentsData(): Promise<StudentReport[]> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch students data: ${error.message}`);
    }

    return data?.map(student => ({
      id: student.id,
      studentId: student.student_id,
      fullName: student.full_name,
      email: Array.isArray(student.email) ? student.email.join(', ') : student.email,
      phoneNumber: student.phone_number || '',
      department: student.department || '',
      parentName: student.parent_name || '',
      address: student.address || '',
      dateOfBirth: student.date_of_birth || '',
      createdAt: student.created_at || ''
    })) || [];
  }

  // Generate attendance summary report
  static async generateAttendanceSummary(startDate?: string, endDate?: string) {
    const attendanceData = await this.getAttendanceData(startDate, endDate);
    
    // Group by date
    const summaryByDate = attendanceData.reduce((acc, record) => {
      const date = record.attendanceDate;
      if (!acc[date]) {
        acc[date] = {
          date,
          total: 0,
          present: 0,
          absent: 0,
          partial: 0
        };
      }
      
      acc[date].total++;
      if (record.dayStatus === 'present') acc[date].present++;
      else if (record.dayStatus === 'absent') acc[date].absent++;
      else if (record.dayStatus === 'partial') acc[date].partial++;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(summaryByDate);
  }

  // Download attendance report as CSV
  static async downloadAttendanceCSV(startDate?: string, endDate?: string) {
    try {
      const data = await this.getAttendanceData(startDate, endDate);
      const headers = ['Student ID', 'Full Name', 'Department', 'Date', 'Morning', 'Afternoon', 'Day Status', 'Notes'];
      
      const csvData = data.map(record => ({
        'Student ID': record.studentId,
        'Full Name': record.fullName,
        'Department': record.department,
        'Date': record.attendanceDate,
        'Morning': record.morningStatus,
        'Afternoon': record.afternoonStatus,
        'Day Status': record.dayStatus,
        'Notes': record.notes
      }));

      const csvContent = this.generateCSV(csvData, headers);
      const filename = `attendance_report_${startDate || 'all'}_${endDate || 'all'}_${new Date().toISOString().split('T')[0]}.csv`;
      
      // Generate QR code
      const metadata = this.generateReportMetadata(
        'Attendance Report',
        filename,
        data.length,
        { start: startDate, end: endDate }
      );
      const qrCodeDataURL = await this.generateQRCode(metadata);
      
      this.downloadFile(csvContent, filename, 'text/csv');
      return { success: true, filename, qrCode: qrCodeDataURL, recordCount: data.length };
    } catch (error) {
      throw new Error(`Failed to generate attendance CSV: ${error}`);
    }
  }

  // Download attendance report as Excel
  static async downloadAttendanceExcel(startDate?: string, endDate?: string) {
    try {
      const data = await this.getAttendanceData(startDate, endDate);
      
      const excelData = data.map(record => ({
        'Student ID': record.studentId,
        'Full Name': record.fullName,
        'Department': record.department,
        'Date': record.attendanceDate,
        'Morning': record.morningStatus,
        'Afternoon': record.afternoonStatus,
        'Day Status': record.dayStatus,
        'Notes': record.notes
      }));

      const blob = this.generateExcel(excelData, 'Attendance Report');
      const filename = `attendance_report_${startDate || 'all'}_${endDate || 'all'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Generate QR code
      const metadata = this.generateReportMetadata(
        'Attendance Report',
        filename,
        data.length,
        { start: startDate, end: endDate }
      );
      const qrCodeDataURL = await this.generateQRCode(metadata);
      
      this.downloadFile(blob, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return { success: true, filename, qrCode: qrCodeDataURL, recordCount: data.length };
    } catch (error) {
      throw new Error(`Failed to generate attendance Excel: ${error}`);
    }
  }

  // Download students report as CSV
  static async downloadStudentsCSV() {
    try {
      const data = await this.getStudentsData();
      const headers = ['Student ID', 'Full Name', 'Email', 'Phone', 'Department', 'Parent Name', 'Address', 'Date of Birth', 'Created At'];
      
      const csvData = data.map(student => ({
        'Student ID': student.studentId,
        'Full Name': student.fullName,
        'Email': student.email,
        'Phone': student.phoneNumber,
        'Department': student.department,
        'Parent Name': student.parentName,
        'Address': student.address,
        'Date of Birth': student.dateOfBirth,
        'Created At': student.createdAt
      }));

      const csvContent = this.generateCSV(csvData, headers);
      const filename = `students_report_${new Date().toISOString().split('T')[0]}.csv`;
      
      // Generate QR code
      const metadata = this.generateReportMetadata(
        'Students List',
        filename,
        data.length
      );
      const qrCodeDataURL = await this.generateQRCode(metadata);
      
      this.downloadFile(csvContent, filename, 'text/csv');
      return { success: true, filename, qrCode: qrCodeDataURL, recordCount: data.length };
    } catch (error) {
      throw new Error(`Failed to generate students CSV: ${error}`);
    }
  }

  // Download students report as Excel
  static async downloadStudentsExcel() {
    try {
      const data = await this.getStudentsData();
      
      const excelData = data.map(student => ({
        'Student ID': student.studentId,
        'Full Name': student.fullName,
        'Email': student.email,
        'Phone': student.phoneNumber,
        'Department': student.department,
        'Parent Name': student.parentName,
        'Address': student.address,
        'Date of Birth': student.dateOfBirth,
        'Created At': student.createdAt
      }));

      const blob = this.generateExcel(excelData, 'Students Report');
      const filename = `students_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Generate QR code
      const metadata = this.generateReportMetadata(
        'Students List',
        filename,
        data.length
      );
      const qrCodeDataURL = await this.generateQRCode(metadata);
      
      this.downloadFile(blob, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return { success: true, filename, qrCode: qrCodeDataURL, recordCount: data.length };
    } catch (error) {
      throw new Error(`Failed to generate students Excel: ${error}`);
    }
  }

  // Download attendance summary as CSV
  static async downloadAttendanceSummaryCSV(startDate?: string, endDate?: string) {
    try {
      const data = await this.generateAttendanceSummary(startDate, endDate);
      const headers = ['Date', 'Total Students', 'Present', 'Absent', 'Partial', 'Attendance Rate (%)'];
      
      const csvData = data.map(summary => ({
        'Date': summary.date,
        'Total Students': summary.total,
        'Present': summary.present,
        'Absent': summary.absent,
        'Partial': summary.partial,
        'Attendance Rate (%)': summary.total > 0 ? ((summary.present / summary.total) * 100).toFixed(2) : '0'
      }));

      const csvContent = this.generateCSV(csvData, headers);
      const filename = `attendance_summary_${startDate || 'all'}_${endDate || 'all'}_${new Date().toISOString().split('T')[0]}.csv`;
      
      // Generate QR code
      const metadata = this.generateReportMetadata(
        'Attendance Summary',
        filename,
        data.length,
        { start: startDate, end: endDate }
      );
      const qrCodeDataURL = await this.generateQRCode(metadata);
      
      this.downloadFile(csvContent, filename, 'text/csv');
      return { success: true, filename, qrCode: qrCodeDataURL, recordCount: data.length };
    } catch (error) {
      throw new Error(`Failed to generate attendance summary CSV: ${error}`);
    }
  }
}
