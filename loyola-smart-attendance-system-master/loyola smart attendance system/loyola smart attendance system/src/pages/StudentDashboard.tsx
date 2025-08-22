import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  GraduationCap, 
  Calendar, 
  Download, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  FileSpreadsheet,
  BarChart3,
  LogOut,
  User,
  MessageSquare,
  Mail
} from "lucide-react";
import { LusyChatbot } from "@/components/LusyChatbot";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuthWithGoogle } from "@/hooks/useAuthWithGoogle";
import { supabase } from "@/integrations/supabase/client";
import { StudentReportDownloader } from "@/components/StudentReportDownloader";
import { LoyolaLogo } from "@/components/LoyolaLogo";

interface AttendanceRecord {
  date: string;
  morning: 'present' | 'absent';
  afternoon: 'present' | 'absent';
  dayStatus: 'present' | 'absent' | 'partial';
}

interface RepliedMessage {
  id: string;
  subject: string;
  message: string;
  reply_message: string;
  replied_at: string;
  created_at: string;
  category: string;
}

const StudentDashboard = () => {
  const [studentInfo, setStudentInfo] = useState({
    name: "",
    pinNumber: "",
    email: "",
    class: "",
    totalClasses: 0,
    attendedClasses: 0,
    attendancePercentage: 0
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [repliedMessages, setRepliedMessages] = useState<RepliedMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, profile, signOut, isAuthenticated, isStudent } = useAuthWithGoogle();

  useEffect(() => {
    if (user && profile) {
      loadStudentData();
      loadRepliedMessages();
    }
  }, [user, profile]);

  const loadStudentData = async () => {
    if (!user || !profile) return;

    try {
      // Load student profile
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .contains('email', [profile.email])
        .maybeSingle();

      if (studentData) {
        setStudentInfo({
          name: studentData.full_name,
          pinNumber: studentData.student_id,
          email: profile.email,
          class: studentData.department || 'Not specified',
          totalClasses: 0,
          attendedClasses: 0,
          attendancePercentage: 0
        });

        // Load attendance records
        const { data: attendanceData } = await supabase
          .from('attendance_records')
          .select('*')
          .eq('student_id', studentData.id)
          .order('attendance_date', { ascending: false })
          .limit(30);

        if (attendanceData) {
          const records = attendanceData.map(record => ({
            date: record.attendance_date,
            morning: record.morning_status as 'present' | 'absent',
            afternoon: record.afternoon_status as 'present' | 'absent',
            dayStatus: record.day_status as 'present' | 'absent' | 'partial'
          }));
          setAttendanceRecords(records);

          // Calculate attendance percentage
          const totalDays = records.length;
          const presentDays = records.filter(r => r.dayStatus === 'present').length;
          const partialDays = records.filter(r => r.dayStatus === 'partial').length;
          const attendanceRate = totalDays > 0 ? ((presentDays + partialDays * 0.5) / totalDays) * 100 : 0;

          setStudentInfo(prev => ({
            ...prev,
            totalClasses: totalDays,
            attendedClasses: presentDays + Math.floor(partialDays * 0.5),
            attendancePercentage: Math.round(attendanceRate * 10) / 10
          }));
        }
      }
    } catch (error) {
      console.error('Error loading student data:', error);
    }
  };
  
  const loadRepliedMessages = async () => {
    if (!user || !profile) return;
    
    try {
      setIsLoadingMessages(true);
      
      // Load contact messages that have been replied to
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .eq('email', profile.email)
        .eq('status', 'replied')
        .order('replied_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      setRepliedMessages(data || []);
    } catch (error) {
      console.error('Error loading replied messages:', error);
      toast({
        title: "Error",
        description: "Failed to load faculty replies",
        variant: "destructive"
      });
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
      toast({
        title: "Logged out successfully",
        description: "Thank you for using Loyola Smart Attendance!",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleExportAttendance = async () => {
    if (!user || !profile) {
      toast({
        title: "Error",
        description: "Please log in to export your attendance report.",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Export Started",
        description: "Your attendance report is being generated with QR code...",
      });
      
      // Get student data
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .contains('email', [profile.email])
        .maybeSingle();

      if (!studentData) {
        toast({
          title: "Error",
          description: "Student data not found. Please contact your administrator.",
          variant: "destructive"
        });
        return;
      }

      // Use StudentReportGenerator to download current month report
      const { StudentReportGenerator } = await import('@/utils/studentReportGenerator');
      const reportGenerator = new StudentReportGenerator(studentData.id, studentData.full_name);
      const result = await reportGenerator.downloadCurrentMonthReport();
      
      if (result.success) {
        toast({
          title: "Export Complete! 🎉",
          description: "Personal attendance report downloaded to your Chrome Downloads folder successfully",
        });
        
        // Show QR code if available
        if (result.qrCode) {
          console.log('QR Code generated for student report:', {
            qrCode: result.qrCode,
            filename: result.filename,
            recordCount: result.recordCount
          });
        }
      } else {
        toast({
          title: "Export Failed",
          description: result.message,
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSpecificExport = async (type: 'current-month' | 'custom-range' | 'semester') => {
    if (!user || !profile) {
      toast({
        title: "Error",
        description: "Please log in to export your attendance report.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get student data
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .contains('email', [profile.email])
        .maybeSingle();

      if (!studentData) {
        toast({
          title: "Error",
          description: "Student data not found. Please contact your administrator.",
          variant: "destructive"
        });
        return;
      }

      const { StudentReportGenerator } = await import('@/utils/studentReportGenerator');
      const reportGenerator = new StudentReportGenerator(studentData.id, studentData.full_name);
      let result;

      toast({
        title: "Export Started 📊",
        description: `Generating ${type === 'semester' ? 'semester' : type === 'current-month' ? 'monthly' : 'custom range'} attendance report with QR code...`,
      });

      switch (type) {
        case 'current-month':
          result = await reportGenerator.downloadCurrentMonthReport();
          break;
        case 'semester':
          result = await reportGenerator.downloadSemesterReport();
          break;
        case 'custom-range':
          // For custom range, we'll show a message to use the Reports tab
          toast({
            title: "Custom Range Export",
            description: "Please use the Reports tab to select your desired date range.",
          });
          return;
        default:
          throw new Error('Invalid export type');
      }

      if (result.success) {
        toast({
          title: "Export Complete! 🎉",
          description: `${type === 'semester' ? 'Semester' : 'Monthly'} attendance report downloaded to your Chrome Downloads folder with QR code.`,
        });
        
        // Show QR code if available
        if (result.qrCode) {
          console.log('QR Code generated for student report:', {
            qrCode: result.qrCode,
            filename: result.filename,
            recordCount: result.recordCount
          });
        }
      } else {
        toast({
          title: "Export Failed",
          description: result.message,
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getAttendanceColor = () => {
    if (studentInfo.attendancePercentage >= 80) return "text-accent";
    if (studentInfo.attendancePercentage >= 70) return "text-warning";
    return "text-destructive";
  };

  const getAttendanceStatus = () => {
    if (studentInfo.attendancePercentage >= 80) return "Excellent";
    if (studentInfo.attendancePercentage >= 70) return "Good";
    if (studentInfo.attendancePercentage >= 60) return "Average";
    return "Needs Improvement";
  };

  const recentPresent = attendanceRecords.slice(0, 7).filter(record => record.dayStatus === "present").length;
  const recentPartial = attendanceRecords.slice(0, 7).filter(record => record.dayStatus === "partial").length;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card sticky top-0 z-40">
        <div className="loyola-container">
          <div className="flex items-center justify-between h-16">
            <LoyolaLogo size="md" />
            <div>
              <h1 className="font-bold text-lg loyola-gradient-text">Student Dashboard</h1>
              <p className="text-xs text-muted-foreground -mt-1">Loyola Smart Attendance</p>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-secondary border-secondary/20">
                {profile?.full_name || 'Student'}
              </Badge>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="loyola-container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome, {profile?.full_name || 'Student'}! 🎓</h1>
          <p className="text-muted-foreground">Track your attendance and academic progress.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-md">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Student Info Card */}
            <Card className="loyola-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-6 h-6 text-primary" />
                  Student Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-semibold text-lg">{studentInfo.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">PIN Number</p>
                      <p className="font-mono text-lg">{studentInfo.pinNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="text-sm">{studentInfo.email}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Class</p>
                      <p className="font-medium">{studentInfo.class}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Attendance Status</p>
                      <Badge className={`${getAttendanceColor()} bg-transparent border-current`}>
                        {getAttendanceStatus()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="loyola-stats-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${getAttendanceColor()}`}>
                    {studentInfo.attendancePercentage}%
                  </div>
                  <div className="mt-2">
                    <Progress value={studentInfo.attendancePercentage} className="h-2" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {studentInfo.attendedClasses}/{studentInfo.totalClasses} classes
                  </p>
                </CardContent>
              </Card>

              <Card className="loyola-stats-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">This Week</CardTitle>
                  <Calendar className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-accent">{recentPresent}/7</div>
                  <p className="text-xs text-muted-foreground">
                    Days present + {recentPartial} partial
                  </p>
                </CardContent>
              </Card>

              <Card className="loyola-stats-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                  <BarChart3 className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-secondary">{studentInfo.totalClasses}</div>
                  <p className="text-xs text-muted-foreground">
                    This semester
                  </p>
                </CardContent>
              </Card>

              <Card className="loyola-stats-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Classes Missed</CardTitle>
                  <XCircle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-destructive">
                    {studentInfo.totalClasses - studentInfo.attendedClasses}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Absent sessions
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="loyola-card">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks and useful features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    className="loyola-btn-primary h-auto p-6 flex-col gap-2"
                    onClick={() => setActiveTab("attendance")}
                  >
                    <Calendar className="w-8 h-8" />
                    <div className="text-center">
                      <div className="font-semibold">View Attendance</div>
                      <div className="text-sm opacity-80">Detailed records</div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-auto p-6 flex-col gap-2 border-secondary/20 hover:border-secondary/40"
                    onClick={handleExportAttendance}
                  >
                    <Download className="w-8 h-8 text-secondary" />
                    <div className="text-center">
                      <div className="font-semibold">Export Report</div>
                      <div className="text-sm text-muted-foreground">Download data</div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-auto p-6 flex-col gap-2 border-accent/20 hover:border-accent/40"
                    onClick={() => setActiveTab("reports")}
                  >
                    <BarChart3 className="w-8 h-8 text-accent" />
                    <div className="text-center">
                      <div className="font-semibold">View Analytics</div>
                      <div className="text-sm text-muted-foreground">Trends & insights</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="loyola-card">
              <CardHeader>
                <CardTitle>Recent Attendance</CardTitle>
                <CardDescription>
                  Your attendance record for the past week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {attendanceRecords.slice(0, 5).map((record, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        {record.dayStatus === 'present' && <CheckCircle className="w-5 h-5 text-accent" />}
                        {record.dayStatus === 'absent' && <XCircle className="w-5 h-5 text-destructive" />}
                        {record.dayStatus === 'partial' && <Clock className="w-5 h-5 text-warning" />}
                        <div>
                          <p className="font-medium">{new Date(record.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}</p>
                          <p className="text-sm text-muted-foreground">
                            Morning: {record.morning} • Afternoon: {record.afternoon}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={
                          record.dayStatus === 'present' ? 'default' :
                          record.dayStatus === 'partial' ? 'secondary' : 'destructive'
                        }
                        className={
                          record.dayStatus === 'present' ? 'bg-accent text-accent-foreground' : ''
                        }
                      >
                        {record.dayStatus === 'present' && 'Present'}
                        {record.dayStatus === 'absent' && 'Absent'}
                        {record.dayStatus === 'partial' && 'Partial'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-6">
            <Card className="loyola-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-primary" />
                  Detailed Attendance Records
                </CardTitle>
                <CardDescription>
                  Complete history of your attendance with session-wise breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold">Date</th>
                        <th className="text-center py-3 px-4 font-semibold">Morning</th>
                        <th className="text-center py-3 px-4 font-semibold">Afternoon</th>
                        <th className="text-center py-3 px-4 font-semibold">Day Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRecords.map((record, index) => (
                        <tr key={index} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-3 px-4">
                            {new Date(record.date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge 
                              variant={record.morning === 'present' ? 'default' : 'destructive'}
                              className={record.morning === 'present' ? 'bg-accent text-accent-foreground' : ''}
                            >
                              {record.morning === 'present' ? '✓' : '✗'} {record.morning}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge 
                              variant={record.afternoon === 'present' ? 'default' : 'destructive'}
                              className={record.afternoon === 'present' ? 'bg-accent text-accent-foreground' : ''}
                            >
                              {record.afternoon === 'present' ? '✓' : '✗'} {record.afternoon}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge 
                              variant={
                                record.dayStatus === 'present' ? 'default' :
                                record.dayStatus === 'partial' ? 'secondary' : 'destructive'
                              }
                              className={
                                record.dayStatus === 'present' ? 'bg-accent text-accent-foreground' : ''
                              }
                            >
                              {record.dayStatus}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            {studentInfo.pinNumber ? (
              <StudentReportDownloader 
                studentId={studentInfo.pinNumber}
                studentName={studentInfo.name}
              />
            ) : (
              <Card className="loyola-card">
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                  <FileSpreadsheet className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Student Information Required</h3>
                  <p className="text-muted-foreground">
                    Please wait while we load your student information to generate reports.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <Card className="loyola-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-primary" />
                  Faculty Replies
                </CardTitle>
                <CardDescription>
                  View replies to your messages from faculty members
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p>Loading messages...</p>
                    </div>
                  </div>
                ) : repliedMessages.length > 0 ? (
                  <div className="space-y-4">
                    {repliedMessages.map((message) => (
                      <Card key={message.id} className="loyola-card-hover">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-lg">{message.subject}</h3>
                              <Badge variant="outline" className="text-xs">
                                {new Date(message.replied_at).toLocaleDateString()}
                              </Badge>
                            </div>
                            
                            <div className="bg-muted/50 p-3 rounded-md">
                              <p className="text-sm text-muted-foreground mb-1">Your message:</p>
                              <p className="text-sm">{message.message}</p>
                            </div>
                            
                            <div className="bg-primary/10 p-3 rounded-md border-l-2 border-primary">
                              <p className="text-sm text-primary font-medium mb-1">Faculty reply:</p>
                              <p className="text-sm">{message.reply_message}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Mail className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Replies Yet</h3>
                    <p className="text-sm text-muted-foreground">
                      You don't have any replied messages from faculty members yet
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <LusyChatbot />
    </div>
  );
};

export default StudentDashboard;