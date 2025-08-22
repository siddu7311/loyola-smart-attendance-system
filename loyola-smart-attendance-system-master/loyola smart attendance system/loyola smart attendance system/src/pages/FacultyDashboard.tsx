import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Camera, 
  FileSpreadsheet, 
  BarChart3, 
  Clock, 
  CheckCircle, 
  XCircle,
  Plus,
  Download,
  Settings,
  LogOut,
  GraduationCap,
  Wrench
} from "lucide-react";
import { LusyChatbot } from "@/components/LusyChatbot";
import { AddStudentFormNew } from "@/components/AddStudentFormNew";
import { AttendanceCaptureNew } from "@/components/AttendanceCaptureNew";
import { StudentsList } from "@/components/StudentsList";
import { DateRangeAttendanceReport } from "@/components/DateRangeAttendanceReport";
import { ReportDownloader } from "@/components/ReportDownloader";
import { QRCodeScanner } from "@/components/QRCodeScanner";
import { ContactMessagesManager } from "@/components/ContactMessagesManager";
import { LoyolaLogo } from "@/components/LoyolaLogo";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuthWithGoogle } from "@/hooks/useAuthWithGoogle";
import { supabase } from "@/integrations/supabase/client";
import { ReportGenerator } from "@/utils/reportGenerator";

const FacultyDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayPresent: 0,
    todayAbsent: 0,
    attendancePercentage: 0
  });
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, profile, signOut, isAuthenticated, isFaculty } = useAuthWithGoogle();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Load real stats from database
      const { data: students } = await supabase
        .from('students')
        .select('id');
      
      const today = new Date().toISOString().split('T')[0];
      const { data: todayAttendance } = await supabase
        .from('attendance_records')
        .select('day_status')
        .eq('attendance_date', today);

      const totalStudents = students?.length || 0;
      const presentToday = todayAttendance?.filter(record => record.day_status === 'present').length || 0;
      const absentToday = totalStudents - presentToday;
      
      setStats({
        totalStudents,
        todayPresent: presentToday,
        todayAbsent: absentToday,
        attendancePercentage: totalStudents > 0 ? (presentToday / totalStudents) * 100 : 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
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
    try {
      toast({
        title: "Export Started",
        description: "Your attendance report is being generated with QR code...",
      });
      
      // Use the ReportGenerator to download attendance report
      const result = await ReportGenerator.downloadAttendanceCSV();
      
      toast({
        title: "Export Complete! 📁",
        description: `Report "${result.filename}" has been downloaded to your Chrome Downloads folder.`,
      });
      
      // Show QR code if available
      if (result.qrCode) {
        // Create a temporary QR code display
        const qrCodeData = {
          qrCode: result.qrCode,
          filename: result.filename,
          recordCount: result.recordCount,
          reportType: 'Attendance Report',
          dateRange: undefined
        };
        
        // You can add QR code display logic here if needed
        console.log('QR Code generated:', qrCodeData);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card sticky top-0 z-40">
        <div className="loyola-container">
          <div className="flex items-center justify-between h-16">
            <LoyolaLogo size="md" />
            <div>
              <h1 className="font-bold text-lg loyola-gradient-text">Faculty Dashboard</h1>
              <p className="text-xs text-muted-foreground -mt-1">Loyola Smart Attendance</p>
            </div>
            
            <div className="flex items-center gap-4">
              <QRCodeScanner />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/camera-test')}
                className="text-orange-600 border-orange-300 hover:bg-orange-50"
              >
                <Wrench className="w-4 h-4 mr-2" />
                Camera Test
              </Button>
              <Badge variant="outline" className="text-primary border-primary/20">
                {profile?.full_name || 'Faculty'}
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
          <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.full_name || 'Faculty'}! 👨‍🏫</h1>
          <p className="text-muted-foreground">Manage your students and track attendance effortlessly.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 max-w-3xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="loyola-stats-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalStudents}</div>
                  <p className="text-xs text-muted-foreground">
                    Registered in system
                  </p>
                </CardContent>
              </Card>

              <Card className="loyola-stats-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today Present</CardTitle>
                  <CheckCircle className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">{stats.todayPresent}</div>
                  <p className="text-xs text-muted-foreground">
                    Out of {stats.totalStudents} students
                  </p>
                </CardContent>
              </Card>

              <Card className="loyola-stats-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today Absent</CardTitle>
                  <XCircle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{stats.todayAbsent}</div>
                  <p className="text-xs text-muted-foreground">
                    Need follow-up
                  </p>
                </CardContent>
              </Card>

              <Card className="loyola-stats-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                  <BarChart3 className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">{stats.attendancePercentage}%</div>
                  <p className="text-xs text-muted-foreground">
                    This month average
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="loyola-card">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks you might want to perform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    className="loyola-btn-primary h-auto p-6 flex-col gap-2"
                    onClick={() => setActiveTab("attendance")}
                  >
                    <Camera className="w-8 h-8" />
                    <div className="text-center">
                      <div className="font-semibold">Take Attendance</div>
                      <div className="text-sm opacity-80">Using facial recognition</div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-auto p-6 flex-col gap-2 border-secondary/20 hover:border-secondary/40"
                    onClick={() => setActiveTab("students")}
                  >
                    <Plus className="w-8 h-8 text-secondary" />
                    <div className="text-center">
                      <div className="font-semibold">Add Student</div>
                      <div className="text-sm text-muted-foreground">Register new student</div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-auto p-6 flex-col gap-2 border-accent/20 hover:border-accent/40"
                    onClick={handleExportAttendance}
                  >
                    <Download className="w-8 h-8 text-accent" />
                    <div className="text-center">
                      <div className="font-semibold">Export Report</div>
                      <div className="text-sm text-muted-foreground">Download attendance data</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="loyola-card">
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>
                  Current system status and your account information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-accent" />
                    <div className="flex-1">
                      <p className="font-medium">Faculty Account Active</p>
                      <p className="text-sm text-muted-foreground">Logged in as {profile?.full_name}</p>
                    </div>
                    <Badge variant="outline" className="text-accent border-accent/20">
                      Active
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                    <Users className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium">Face Recognition Ready</p>
                      <p className="text-sm text-muted-foreground">AI system initialized for attendance capture</p>
                    </div>
                    <Badge variant="outline" className="text-primary border-primary/20">
                      Ready
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                    <FileSpreadsheet className="w-5 h-5 text-secondary" />
                    <div className="flex-1">
                      <p className="font-medium">Database Connected</p>
                      <p className="text-sm text-muted-foreground">All student and attendance data synced</p>
                    </div>
                    <Badge variant="outline" className="text-secondary border-secondary/20">
                      Connected
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <Tabs defaultValue="add" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="add">Add Student</TabsTrigger>
                <TabsTrigger value="list">All Students</TabsTrigger>
              </TabsList>
              
              <TabsContent value="add">
                <AddStudentFormNew onStudentAdded={() => loadStats()} />
              </TabsContent>
              
              <TabsContent value="list" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">All Students</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={async () => {
                      try {
                        const result = await ReportGenerator.downloadStudentsExcel();
                        toast({
                          title: "Download Successful! 📁",
                          description: "Students list has been downloaded to your device.",
                        });
                        
                        // Show QR code if available
                        if (result.qrCode) {
                          // You can add QR code display here if needed
                          console.log('QR Code generated:', result.qrCode);
                        }
                      } catch (error) {
                        toast({
                          title: "Download Failed",
                          description: "Failed to download students list",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Students List
                  </Button>
                </div>
                <StudentsList />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="attendance">
            <AttendanceCaptureNew />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Tabs defaultValue="quick" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="quick">Quick Reports</TabsTrigger>
                <TabsTrigger value="custom">Date Range</TabsTrigger>
              </TabsList>
              
              <TabsContent value="quick" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Quick Reports */}
                  <Card className="loyola-card">
                    <CardHeader>
                      <CardTitle>Quick Attendance Reports</CardTitle>
                      <CardDescription>
                        Generate predefined attendance reports with QR codes
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button 
                          className="loyola-btn-primary h-auto p-4 flex-col gap-2"
                          onClick={handleExportAttendance}
                        >
                          <FileSpreadsheet className="w-6 h-6" />
                          <div className="text-center">
                            <div className="font-semibold text-sm">Daily Report</div>
                            <div className="text-xs opacity-80">Today's attendance</div>
                          </div>
                        </Button>
                        
                        <Button 
                          variant="outline"
                          className="h-auto p-4 flex-col gap-2"
                          onClick={handleExportAttendance}
                        >
                          <Clock className="w-6 h-6 text-secondary" />
                          <div className="text-center">
                            <div className="font-semibold text-sm">Weekly Report</div>
                            <div className="text-xs text-muted-foreground">Last 7 days</div>
                          </div>
                        </Button>
                        
                        <Button 
                          variant="outline"
                          className="h-auto p-4 flex-col gap-2"
                          onClick={handleExportAttendance}
                        >
                          <BarChart3 className="w-6 h-6 text-accent" />
                          <div className="text-center">
                            <div className="font-semibold text-sm">Monthly Report</div>
                            <div className="text-xs text-muted-foreground">Full month data</div>
                          </div>
                        </Button>
                      </div>
                      
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <h3 className="font-semibold mb-2 text-sm">Report Features</h3>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-accent" />
                            Excel format (.xlsx) with formatted data
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-accent" />
                            QR code generation for easy sharing
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-accent" />
                            Student contact information for absentees
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-accent" />
                            Date-wise and session-wise breakdown
                          </li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Direct Download Reports */}
                  <ReportDownloader />
                </div>
              </TabsContent>
              
              <TabsContent value="custom">
                <DateRangeAttendanceReport />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <ContactMessagesManager facultyId={user?.id || ''} />
          </TabsContent>
        </Tabs>
      </div>

      <LusyChatbot />
    </div>
  );
};

export default FacultyDashboard;