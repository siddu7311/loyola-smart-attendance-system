// Export Utilities for Loyola Smart Attendance System

export interface AttendanceData {
  studentId: string;
  studentName: string;
  pinNumber: string;
  phoneNumber: string;
  email: string;
  date: string;
  morningStatus: 'present' | 'absent';
  afternoonStatus: 'present' | 'absent';
  dayStatus: 'present' | 'absent' | 'partial';
}

export interface ExportOptions {
  format: 'excel' | 'csv' | 'pdf';
  includeQR: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  sessionType?: 'morning' | 'afternoon' | 'both';
}

export class AttendanceExporter {
  private generateQRCode(data: string): string {
    // In a real implementation, this would use a QR code library
    // For demo purposes, we'll return a placeholder QR code data URL
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Draw a simple placeholder QR code pattern
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 200, 200);
    
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 20; j++) {
        if ((i + j) % 2 === 0) {
          ctx.fillRect(i * 10, j * 10, 10, 10);
        }
      }
    }

    return canvas.toDataURL('image/png');
  }

  private generateCSV(data: AttendanceData[], options: ExportOptions): string {
    const headers = [
      'Student Name',
      'PIN Number',
      'Phone Number',
      'Email',
      'Date',
      'Morning Status',
      'Afternoon Status',
      'Day Status'
    ];

    let csv = headers.join(',') + '\n';

    data.forEach(record => {
      const row = [
        `"${record.studentName}"`,
        record.pinNumber,
        record.phoneNumber,
        record.email,
        record.date,
        record.morningStatus,
        record.afternoonStatus,
        record.dayStatus
      ];
      csv += row.join(',') + '\n';
    });

    return csv;
  }

  private generateExcelData(data: AttendanceData[], options: ExportOptions): any {
    // In a real implementation, this would use a library like SheetJS or similar
    // For demo purposes, we'll return structured data that could be used with such libraries
    
    const workbook = {
      SheetNames: ['Attendance Report'],
      Sheets: {
        'Attendance Report': {
          A1: { v: 'Loyola Smart Attendance Report', t: 's' },
          A2: { v: `Generated on: ${new Date().toLocaleDateString()}`, t: 's' },
          A4: { v: 'Student Name', t: 's' },
          B4: { v: 'PIN Number', t: 's' },
          C4: { v: 'Phone Number', t: 's' },
          D4: { v: 'Email', t: 's' },
          E4: { v: 'Date', t: 's' },
          F4: { v: 'Morning Status', t: 's' },
          G4: { v: 'Afternoon Status', t: 's' },
          H4: { v: 'Day Status', t: 's' },
          '!ref': `A1:H${data.length + 4}`
        }
      }
    };

    // Add data rows
    data.forEach((record, index) => {
      const rowNum = index + 5;
      const sheet = workbook.Sheets['Attendance Report'];
      
      sheet[`A${rowNum}`] = { v: record.studentName, t: 's' };
      sheet[`B${rowNum}`] = { v: record.pinNumber, t: 's' };
      sheet[`C${rowNum}`] = { v: record.phoneNumber, t: 's' };
      sheet[`D${rowNum}`] = { v: record.email, t: 's' };
      sheet[`E${rowNum}`] = { v: record.date, t: 's' };
      sheet[`F${rowNum}`] = { v: record.morningStatus, t: 's' };
      sheet[`G${rowNum}`] = { v: record.afternoonStatus, t: 's' };
      sheet[`H${rowNum}`] = { v: record.dayStatus, t: 's' };
    });

    return workbook;
  }

  async exportAttendance(data: AttendanceData[], options: ExportOptions): Promise<{
    success: boolean;
    fileUrl?: string;
    qrCodeUrl?: string;
    error?: string;
  }> {
    try {
      let fileContent: string | Blob;
      let fileName: string;
      let mimeType: string;

      const timestamp = new Date().toISOString().split('T')[0];
      
      switch (options.format) {
        case 'csv':
          fileContent = this.generateCSV(data, options);
          fileName = `loyola_attendance_${timestamp}.csv`;
          mimeType = 'text/csv';
          break;
          
        case 'excel':
          // In a real implementation, this would generate actual Excel files
          const excelData = this.generateExcelData(data, options);
          fileContent = JSON.stringify(excelData, null, 2);
          fileName = `loyola_attendance_${timestamp}.xlsx`;
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
          
        case 'pdf':
          // In a real implementation, this would generate PDF files
          fileContent = this.generatePDFContent(data, options);
          fileName = `loyola_attendance_${timestamp}.pdf`;
          mimeType = 'application/pdf';
          break;
          
        default:
          throw new Error('Unsupported export format');
      }

      // Create blob and download URL
      const blob = new Blob([fileContent], { type: mimeType });
      const fileUrl = URL.createObjectURL(blob);

      // Generate QR code if requested
      let qrCodeUrl: string | undefined;
      if (options.includeQR) {
        const qrData = `Loyola Attendance Report - ${timestamp} - ${data.length} records`;
        qrCodeUrl = this.generateQRCode(qrData);
      }

      // Simple and direct Chrome download
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      
      // Trigger immediate download
      document.body.appendChild(link);
      link.click();
      
      // Quick cleanup
      document.body.removeChild(link);
      
      // Cleanup URL after a short delay
      setTimeout(() => {
        URL.revokeObjectURL(fileUrl);
      }, 2000);

      return {
        success: true,
        fileUrl,
        qrCodeUrl
      };
    } catch (error) {
      console.error('Export failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private generatePDFContent(data: AttendanceData[], options: ExportOptions): string {
    // In a real implementation, this would use a PDF library like jsPDF
    // For demo purposes, we'll return a simple text representation
    let content = `LOYOLA SMART ATTENDANCE REPORT\n`;
    content += `Generated on: ${new Date().toLocaleDateString()}\n`;
    content += `Total Records: ${data.length}\n\n`;
    
    content += `${'Student Name'.padEnd(20)} ${'PIN'.padEnd(12)} ${'Date'.padEnd(12)} ${'Morning'.padEnd(10)} ${'Afternoon'.padEnd(10)} ${'Status'.padEnd(10)}\n`;
    content += '-'.repeat(80) + '\n';
    
    data.forEach(record => {
      content += `${record.studentName.padEnd(20)} ${record.pinNumber.padEnd(12)} ${record.date.padEnd(12)} ${record.morningStatus.padEnd(10)} ${record.afternoonStatus.padEnd(10)} ${record.dayStatus.padEnd(10)}\n`;
    });

    return content;
  }

  generateQuickReport(data: AttendanceData[]): {
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    partialCount: number;
    attendancePercentage: number;
    absentees: AttendanceData[];
  } {
    const totalStudents = data.length;
    const stats = data.reduce((acc, record) => {
      switch (record.dayStatus) {
        case 'present':
          acc.presentCount++;
          break;
        case 'absent':
          acc.absentCount++;
          break;
        case 'partial':
          acc.partialCount++;
          break;
      }
      return acc;
    }, { presentCount: 0, absentCount: 0, partialCount: 0 });

    const attendancePercentage = totalStudents > 0 
      ? ((stats.presentCount + stats.partialCount * 0.5) / totalStudents) * 100 
      : 0;

    const absentees = data.filter(record => record.dayStatus === 'absent');

    return {
      totalStudents,
      ...stats,
      attendancePercentage: Math.round(attendancePercentage * 100) / 100,
      absentees
    };
  }
}

// Global instance
export const attendanceExporter = new AttendanceExporter();

// Simplified export functions for easier use
export const exportToExcel = async (data: any, filename: string) => {
  const exporter = new AttendanceExporter();
  return await exporter.exportAttendance(data.records || [], {
    format: 'excel',
    includeQR: true
  });
};

export const generateQRCode = async (data: string) => {
  const exporter = new AttendanceExporter();
  // Use the private method through a public interface
  return exporter['generateQRCode'](data);
};

// Utility functions
export const formatDateRange = (start: string, end: string): string => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  
  return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
};

export const calculateAttendanceStats = (data: AttendanceData[]) => {
  const total = data.length;
  const present = data.filter(d => d.dayStatus === 'present').length;
  const absent = data.filter(d => d.dayStatus === 'absent').length;
  const partial = data.filter(d => d.dayStatus === 'partial').length;
  
  return {
    total,
    present,
    absent,
    partial,
    percentage: total > 0 ? ((present + partial * 0.5) / total) * 100 : 0
  };
};

export const filterAttendanceByDateRange = (
  data: AttendanceData[], 
  startDate: string, 
  endDate: string
): AttendanceData[] => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return data.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate >= start && recordDate <= end;
  });
};

export const groupAttendanceByDate = (data: AttendanceData[]): Record<string, AttendanceData[]> => {
  return data.reduce((acc, record) => {
    if (!acc[record.date]) {
      acc[record.date] = [];
    }
    acc[record.date].push(record);
    return acc;
  }, {} as Record<string, AttendanceData[]>);
};