import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ModernCameraCapture } from "./ModernCameraCapture";
import { supabase } from "@/integrations/supabase/client";
import { faceRecognitionService } from '@/utils/faceRecognitionService';
import { useToast } from "@/hooks/use-toast";
import { Camera, User, CheckCircle, XCircle, Clock, AlertTriangle, Loader2, Zap, Download, Users } from "lucide-react";

interface AttendanceCaptureProps {
  sessionId: string;
  onAttendanceRecorded: (studentId: string, studentName: string) => void;
}

type RecognitionStatus = 'idle' | 'processing' | 'success' | 'failed';

export const AttendanceCaptureNew = ({ sessionId, onAttendanceRecorded }: AttendanceCaptureProps) => {
  const [showCamera, setShowCamera] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [recognitionStatus, setRecognitionStatus] = useState<RecognitionStatus>('idle');
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [studentData, setStudentData] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [studentsStatus, setStudentsStatus] = useState<any[]>([]);
  const [lastCapturedImage, setLastCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [detectedCount, setDetectedCount] = useState(0);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        console.log('🔄 Fetching students from database...');
        
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('*')
          .order('name');

        if (studentsError) {
          console.error('❌ Error fetching students:', studentsError);
          toast({
            title: "Error Loading Students",
            description: "Failed to load student data from database",
            variant: "destructive"
          });
          return;
        }

        console.log('📚 Students loaded:', studentsData?.length || 0);
        
        // Map database students to include status field
        const studentsWithStatus = (studentsData || []).map(student => ({
          ...student,
          status: 'pending' as const
        }));
        
        setStudents(studentsWithStatus);
        setStudentsStatus(studentsWithStatus);

        // Fetch face recognition data for all students
        if (studentsData && studentsData.length > 0) {
          console.log('🔍 Fetching face recognition data...');
          
          const { data: faceRecognitionData, error: faceError } = await supabase
            .from('face_recognition_data')
            .select('*');

          if (faceError) {
            console.error('❌ Error fetching face data:', faceError);
            toast({
              title: "Error Loading Face Data",
              description: "Face recognition data could not be loaded",
              variant: "destructive"
            });
            return;
          }

          console.log('📸 Face recognition data loaded:', faceRecognitionData?.length || 0);
          
          // Create known faces array with both student and face data
          const knownFacesArray = studentsData.map(student => {
            const faceData = faceRecognitionData?.find(f => f.student_id === student.id);
            if (faceData && faceData.face_encoding) {
              return {
                id: student.id,
                name: student.full_name,
                features: new Float32Array(faceData.face_encoding as number[])
              };
            }
            return null;
          }).filter(Boolean);

          console.log('👥 Known faces created:', knownFacesArray.length);
          setKnownFaces(knownFacesArray);
          
          if (knownFacesArray.length === 0) {
            toast({
              title: "No Face Data Found",
              description: "Students found but no face recognition data available. Please re-add students with photos.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Students Loaded Successfully",
              description: `${knownFacesArray.length} students with face data ready for recognition`,
            });
          }
        } else {
          console.log('⚠️ No students found in database');
          setKnownFaces([]);
        }

      } catch (error) {
        console.error('💥 Unexpected error:', error);
        toast({
          title: "System Error",
          description: "Unexpected error while loading students",
          variant: "destructive"
        });
      }
    };

    fetchStudents();
  }, [supabase]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Initialize the new face recognition service
        const initialized = await faceRecognitionService.initialize();
        if (!initialized) {
          toast({
            title: "Initialization Error",
            description: "Failed to initialize face recognition models.",
            variant: "destructive"
          });
        }
        
        await loadStudents();
        await getDevices();
      } catch (error) {
        console.error('Error initializing:', error);
        toast({
          title: "Initialization Error",
          description: "Failed to initialize face recognition",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    return () => {
      stopCamera();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getDevices = async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = deviceList.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
    } catch (error) {
      console.error('Error getting devices:', error);
    }
  };

  const loadStudents = async () => {
    try {
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, full_name, student_id');

      if (studentsError) throw studentsError;

      const studentsList = studentsData?.map(student => ({
        ...student,
        status: 'pending' as const
      })) || [];

      setStudents(studentsList);
      setStudentsStatus(studentsList);

      // Load face data
      const { data: faceData, error: faceError } = await supabase
        .from('face_recognition_data')
        .select('student_id, face_encoding')
        .not('face_encoding', 'is', null);

      if (faceError) throw faceError;

      const faces = studentsData?.map(student => {
        const faceRecord = faceData?.find(face => face.student_id === student.id);
        if (faceRecord && faceRecord.face_encoding && Array.isArray(faceRecord.face_encoding)) {
          return {
            id: student.id,
            name: student.full_name,
            features: new Float32Array(faceRecord.face_encoding as number[])
          };
        }
        return null;
      }).filter(Boolean) || [];

      setKnownFaces(faces);
    } catch (error) {
      console.error('Error loading students:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load student data",
        variant: "destructive",
      });
    }
  };

  const startCamera = async () => {
    try {
      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280, min: 640 }, 
          height: { ideal: 720, min: 480 },
          facingMode: facingMode
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true);
          console.log('Camera ready for attendance capture');
        };
      }
      
      toast({
        title: "Camera Started",
        description: `${facingMode === 'user' ? 'Front' : 'Back'} camera activated. Position students for recognition.`,
      });
    } catch (error) {
      console.error('Camera error:', error);
      setCameraReady(false);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  };

  const switchCamera = async () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    setCameraReady(false);
    
    if (streamRef.current) {
      stopCamera();
      setTimeout(async () => {
        await startCamera();
      }, 500);
    }
    
    toast({
      title: "Camera Switched",
      description: `Switching to ${newFacingMode === 'user' ? 'front' : 'back'} camera`,
    });
  };

    const startAttendanceCapture = async () => {
    // The service will initialize itself if needed, so we can proceed.
    if (!streamRef.current) {
      await startCamera();
    }
    
    setIsCapturing(true);
    setDetectedCount(0);
    setProgress(0);
    setTimeElapsed(0);
    
    // Reset student statuses
    setStudentsStatus(students.map(s => ({ ...s, status: 'pending' as const })));
    
    let detected = 0;
    let elapsed = 0;
    
    intervalRef.current = setInterval(() => {
      elapsed += 1;
      setTimeElapsed(elapsed);
      
      if (students.length === 0 && elapsed === 5) {
        toast({
          title: "No Students Registered",
          description: "Please add students first to enable attendance capture.",
          variant: "destructive"
        });
        stopAttendanceCapture();
        return;
      }
      
      // Capture attendance every 2 seconds for better real-time detection
      if (elapsed % 2 === 0) {
        captureAttendance();
      }
      
      // Auto-stop after 10 minutes
      if (elapsed >= 600) {
        stopAttendanceCapture();
      }
    }, 1000);
  };

  const captureAttendance = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      console.log('🚀 Starting face detection and recognition...');
      
      const faceCount = await faceRecognitionService.detectFaces(imageData);
      setCurrentFaceCount(faceCount);

      if (faceCount === 0) {
        setFaceDetectionStatus('none');
        console.log('⚠️ No face detected in the current frame.');
        return;
      }

      setFaceDetectionStatus('detected');
      console.log(`✅ Face detected! Attempting recognition against ${knownFaces.length} known faces...`);
      
      if (knownFaces.length === 0) {
        console.log('⚠️ No known faces to compare against!');
        toast({
          title: "No Students Registered",
          description: "Please add students with photos first to enable face recognition.",
          variant: "destructive"
        });
        return;
      }
      
      let recognitionResult = await faceRecognitionService.recognizeFace(imageData, knownFaces);

      if (!recognitionResult) {
        console.log('🤔 Primary recognition failed, trying enhanced service...');
        recognitionResult = await enhancedFaceRecognitionService.recognizeFace(imageData, knownFaces);
      }
      
      if (recognitionResult) {
        setFaceDetectionStatus('recognized');
        console.log('🎉 Recognition successful:', recognitionResult);
        
        // Check if student is already marked as present
        const existingStatus = studentsStatus.find(s => s.id === recognitionResult.id);
        if (existingStatus && existingStatus.status === 'present') {
          console.log(`🔄 ${recognitionResult.name} already marked as present`);
          return;
        }
        
        // Mark student as present
        setStudentsStatus(prev => 
          prev.map(student => 
            student.id === recognitionResult.id 
              ? { ...student, status: 'present' as const }
              : student
          )
        );

        // Update detected count
        setDetectedCount(prev => {
          const newCount = prev + 1;
          setProgress((newCount / students.length) * 100);
          return newCount;
        });

        // Mark attendance in database
        const today = new Date().toISOString().split('T')[0];
        
        await supabase
          .from('attendance_records')
          .upsert({
            student_id: recognitionResult.id,
            attendance_date: today,
            day_status: 'present',
            morning_status: session === 'morning' ? 'present' : undefined,
            afternoon_status: session === 'afternoon' ? 'present' : undefined,
            notes: `Auto-detected with ${(recognitionResult.confidence * 100).toFixed(1)}% confidence`
          }, {
            onConflict: 'student_id,attendance_date'
          });

        toast({
          title: "Student Recognized! ✅",
          description: `${recognitionResult.name} marked as present (${(recognitionResult.confidence * 100).toFixed(1)}% confidence)`,
        });
      }
    } catch (error) {
      console.error("💥 Error capturing attendance:", error);
      setFaceDetectionStatus('detected'); // Keep status as detected to avoid UI flicker
      toast({
        title: "Recognition Error",
        description: "An error occurred during face recognition.",
        variant: "destructive"
      });
    }
  };

  const stopAttendanceCapture = () => {
    setIsCapturing(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Mark remaining students as absent
    setStudentsStatus(prev =>
      prev.map(student =>
        student.status === 'pending' ? { ...student, status: 'absent' as const } : student
      )
    );
    
    toast({
      title: "Attendance Capture Complete",
      description: `${detectedCount} students detected in ${Math.floor(timeElapsed / 60)}:${(timeElapsed % 60).toString().padStart(2, '0')}`,
    });
  };

  const submitAttendance = async () => {
    const presentCount = studentsStatus.filter(s => s.status === 'present').length;
    const absentCount = studentsStatus.filter(s => s.status === 'absent').length;
    
    try {
      // Mark absent students in database
      const today = new Date().toISOString().split('T')[0];
      const absentStudents = studentsStatus.filter(s => s.status === 'absent');
      
      for (const student of absentStudents) {
        await supabase
          .from('attendance_records')
          .upsert({
            student_id: student.id,
            attendance_date: today,
            day_status: 'absent',
            morning_status: session === 'morning' ? 'absent' : undefined,
            afternoon_status: session === 'afternoon' ? 'absent' : undefined,
            notes: 'Not detected during facial recognition scan'
          }, {
            onConflict: 'student_id,attendance_date'
          });
      }

      toast({
        title: "Attendance Submitted Successfully! 🎉",
        description: `${presentCount} present, ${absentCount} absent for ${session} session`,
      });
      
      // Reset for next session
      setDetectedCount(0);
      setProgress(0);
      setTimeElapsed(0);
      setStudentsStatus(students.map(s => ({ ...s, status: 'pending' as const })));
    } catch (error) {
      console.error('Error submitting attendance:', error);
      toast({
        title: "Submission Error",
        description: "Failed to submit attendance records",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const presentStudents = studentsStatus.filter(s => s.status === 'present');
  const absentStudents = studentsStatus.filter(s => s.status === 'absent');

  const handleExportAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .order('attendance_date', { ascending: false });

      if (error) throw error;

      const csvContent = [
        ['Date', 'Student ID', 'Morning Status', 'Afternoon Status', 'Notes'],
        ...data.map(record => [
          record.attendance_date,
          record.student_id,
          record.morning_status || 'N/A',
          record.afternoon_status || 'N/A',
          record.notes || 'N/A'
        ])
      ];

      const csvString = csvContent.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Attendance Exported",
        description: "Attendance data exported successfully.",
      });
    } catch (error) {
      console.error('Error exporting attendance:', error);
      toast({
        title: "Export Error",
        description: "Failed to export attendance data.",
        variant: "destructive",
      });
    }
  };

  const testFaceDetection = async () => {
    if (!videoRef.current || !canvasRef.current) {
      toast({
        title: "Camera Not Ready",
        description: "Please wait for camera to initialize",
        variant: "destructive"
      });
      return;
    }

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      console.log('🧪 Testing face detection...');
      
      const faceCount = await faceRecognitionService.detectFaces(imageData);
      setCurrentFaceCount(faceCount);
      
      if (faceCount > 0) {
        setFaceDetectionStatus('detected');
        toast({
          title: "Face Detection Test ✅",
          description: `Detected ${faceCount} face(s) in current frame`,
        });
      } else {
        setFaceDetectionStatus('none');
        toast({
          title: "Face Detection Test ❌",
          description: "No faces detected in current frame",
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('Error testing face detection:', error);
      toast({
        title: "Test Error",
        description: "Error during face detection test",
        variant: "destructive"
      });
    }
  };

  const testBypassDetection = async () => {
    console.log('🚀 Testing bypass detection...');
    
    // Force set face detection to work
    setCurrentFaceCount(1);
    setFaceDetectionStatus('detected');
    
    toast({
      title: "Bypass Test ✅",
      description: "Forced face detection to work - check if recognition works now",
    });
    
    // Try to capture attendance immediately
    setTimeout(() => {
      captureAttendance();
    }, 1000);
  };

  const checkDatabaseContents = async () => {
    try {
      console.log('🔍 Checking database contents...');
      
      // Check students table
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*');
      
      if (studentsError) {
        console.error('❌ Error checking students:', studentsError);
        toast({
          title: "Database Error",
          description: `Error accessing students table: ${studentsError.message}`,
          variant: "destructive"
        });
        return;
      }
      
      console.log('📚 Students in database:', studentsData);
      console.log('📊 Total students found:', studentsData?.length || 0);
      
      // Check face recognition data table
      const { data: faceData, error: faceError } = await supabase
        .from('face_recognition_data')
        .select('*');
      
      if (faceError) {
        console.error('❌ Error checking face data:', faceError);
        toast({
          title: "Database Error",
          description: `Error accessing face_recognition_data table: ${faceError.message}`,
          variant: "destructive"
        });
        return;
      }
      
      console.log('📸 Face recognition data in database:', faceData);
      console.log('📊 Total face data entries:', faceData?.length || 0);
      
      // Check profiles table for students
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student');
      
      if (profilesError) {
        console.error('❌ Error checking profiles:', profilesError);
        toast({
          title: "Database Error",
          description: `Error accessing profiles table: ${profilesError.message}`,
          variant: "destructive"
        });
        return;
      }
      
      console.log('👤 Student profiles in database:', profilesData);
      console.log('📊 Total student profiles:', profilesData?.length || 0);
      
      // Summary
      const summary = {
        students: studentsData?.length || 0,
        faceData: faceData?.length || 0,
        profiles: profilesData?.length || 0
      };
      
      console.log('📋 DATABASE SUMMARY:', summary);
      
      if (summary.students === 0) {
        toast({
          title: "No Students Found",
          description: "Students table is empty. Please add students first.",
          variant: "destructive"
        });
      } else if (summary.faceData === 0) {
        toast({
          title: "No Face Data Found",
          description: "Students exist but no face recognition data. Re-add students with photos.",
          variant: "destructive"
        });
      } else if (summary.profiles === 0) {
        toast({
          title: "No Student Profiles",
          description: "Students exist but no profiles. Check profile creation.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Database Check Complete",
          description: `Found ${summary.students} students, ${summary.faceData} face data, ${summary.profiles} profiles`,
        });
      }
      
    } catch (error) {
      console.error('💥 Error checking database:', error);
      toast({
        title: "Database Check Error",
        description: "Error occurred while checking database",
        variant: "destructive"
      });
    }
  };

  const addTestStudent = async () => {
    try {
      console.log('🧪 Adding test student...');
      
      // Add a test student
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .insert({
          full_name: 'Test Student',
          student_id: 'TEST001',
          department: 'Computer Science',
          email: ['test@example.com'],
          phone_number: '1234567890',
          address: 'Test Address',
          date_of_birth: '2000-01-01',
          created_by: 'system'
        })
        .select()
        .single();
      
      if (studentError) {
        console.error('❌ Error adding test student:', studentError);
        toast({
          title: "Error Adding Test Student",
          description: studentError.message,
          variant: "destructive"
        });
        return;
      }
      
      console.log('✅ Test student added:', studentData);
      
      // Add face recognition data (dummy data for testing)
      const dummyFeatures = new Array(256).fill(0.1); // Simple dummy features
      
      const { data: faceData, error: faceError } = await supabase
        .from('face_recognition_data')
        .insert({
          student_id: studentData.id,
          image_url: 'test-image.jpg',
          face_encoding: dummyFeatures,
          is_primary: true
        })
        .select()
        .single();
      
      if (faceError) {
        console.error('❌ Error adding face data:', faceError);
        toast({
          title: "Error Adding Face Data",
          description: faceError.message,
          variant: "destructive"
        });
        return;
      }
      
      console.log('✅ Face data added:', faceData);
      
      toast({
        title: "Test Student Added",
        description: "Test student with face data added successfully. Try recognition now!",
      });
      
      // Refresh the page to load the new data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('💥 Error adding test student:', error);
      toast({
        title: "Error",
        description: "Failed to add test student",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="loyola-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-6 h-6 text-primary" />
            Facial Recognition Attendance
          </CardTitle>
          <CardDescription>
            Use advanced facial recognition technology to efficiently mark student attendance at Loyola Polytechnic College
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <label className="text-sm font-medium">Session</label>
                <Select value={session} onValueChange={(value: 'morning' | 'afternoon') => setSession(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold loyola-gradient-text">{formatTime(timeElapsed)}</div>
                <div className="text-xs text-muted-foreground">Elapsed Time</div>
              </div>
              
              <div className="text-center">
                <div className={`text-sm px-2 py-1 rounded ${faceRecognitionService.isInitialized() ? 'bg-accent/20 text-accent' : 'bg-warning/20 text-warning'}`}>
                  {faceRecognitionService.isInitialized() ? '✓ Model Ready' : '⏳ Loading...'}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
                  {!isCapturing ? (
                <>
                  <Button onClick={startAttendanceCapture} className="loyola-btn-primary" disabled={!faceRecognitionService.isInitialized()}>
                    <Play className="w-4 h-4 mr-2" />
                    Start Recognition
                  </Button>
                  <Button onClick={switchCamera} variant="outline" disabled={isCapturing}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Switch to {facingMode === 'user' ? 'Back' : 'Front'} Camera
                  </Button>
                </>
              ) : (
                <Button onClick={stopAttendanceCapture} variant="destructive">
                  <Square className="w-4 h-4 mr-2" />
                  Stop Recognition
                </Button>
              )}
              
              {detectedCount > 0 && !isCapturing && (
                <Button onClick={submitAttendance} className="loyola-btn-secondary">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit Attendance
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Camera and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Feed */}
        <Card className="lg:col-span-2 loyola-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Live Camera Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="loyola-face-detection relative w-full aspect-video rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end">
                <div className="p-4 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    {faceDetectionStatus === 'none' && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-sm opacity-80">Face detected</span>
                      </div>
                    )}
                    {faceDetectionStatus === 'detected' && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                        <span className="text-sm opacity-80">Face detected - recognizing...</span>
                      </div>
                    )}
                    {faceDetectionStatus === 'recognized' && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-sm opacity-80">Student recognized!</span>
                      </div>
                    )}
                    {isCapturing && faceDetectionStatus === 'none' && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                        <span className="text-sm opacity-80">🔍 Scanning for faces...</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm opacity-80">
                    {!isCapturing 
                      ? "📷 Click 'Start Recognition' to begin"
                      : `Faces in view: ${currentFaceCount}`
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug Information */}
        {debugMode && (
          <Card className="mt-4 border-orange-200 bg-orange-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-orange-700">🐛 Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>Camera Ready: {cameraReady ? '✅' : '❌'}</div>
                  <div>Known Faces: {knownFaces.length}</div>
                  <div>Face Detection: {faceDetectionStatus}</div>
                  <div>Face Count: {currentFaceCount}</div>
                  <div>Progress: {detectedCount}/{students.length}</div>
                  <div>Progress %: {progress.toFixed(1)}%</div>
                  <div>Force Detection: {forceDetection ? '🔴 ON' : '⚪ OFF'}</div>
                  <div>Debug Mode: {debugMode ? '🟡 ON' : '⚪ OFF'}</div>
                </div>
                <div className="mt-2 pt-2 border-t border-orange-200">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-orange-700 border-orange-300"
                    onClick={() => {
                      console.log('=== DEBUG INFO ===');
                      console.log('Camera Ready:', cameraReady);
                      console.log('Known Faces:', knownFaces);
                      console.log('Video Element:', videoRef.current);
                      console.log('Canvas Element:', canvasRef.current);
                      console.log('Face Detection Status:', faceDetectionStatus);
                      console.log('Current Face Count:', currentFaceCount);
                      console.log('Force Detection:', forceDetection);
                      console.log('Debug Mode:', debugMode);
                    }}
                  >
                    📋 Log Debug Info to Console
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="space-y-4">
          <Card className="loyola-stats-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Face Detection Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {faceDetectionStatus === 'none' && (
                    <>
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-600">Face detected</span>
                    </>
                  )}
                  {faceDetectionStatus === 'detected' && (
                    <>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                      <span className="text-sm text-yellow-600">Face detected</span>
                    </>
                  )}
                  {faceDetectionStatus === 'recognized' && (
                    <>
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-600">Student recognized!</span>
                    </>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Faces in view: {currentFaceCount}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="loyola-stats-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Detection Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Detected</span>
                  <span>{detectedCount}/{students.length}</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {progress.toFixed(1)}% Complete
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="loyola-stats-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-accent" />
                Present Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{presentStudents.length}</div>
              <p className="text-xs text-muted-foreground">Students detected</p>
            </CardContent>
          </Card>

          <Card className="loyola-stats-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <XCircle className="w-4 h-4 text-destructive" />
                Absent Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{absentStudents.length}</div>
              <p className="text-xs text-muted-foreground">Need follow-up</p>
            </CardContent>
          </Card>

          <Card className="loyola-stats-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-warning" />
                Speed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {timeElapsed > 0 ? Math.round(detectedCount / (timeElapsed / 60)) : 0}
              </div>
              <p className="text-xs text-muted-foreground">Students/min</p>
            </CardContent>
          </Card>

          <Button 
            variant="outline"
            className="h-auto p-4 flex-col gap-2 border-accent/20 hover:border-accent/40"
            onClick={handleExportAttendance}
          >
            <Download className="w-8 h-8 text-accent" />
            <div className="text-center">
              <div className="font-semibold">Export Report</div>
              <div className="text-sm text-muted-foreground">Download attendance data</div>
            </div>
          </Button>
          
          <Button 
            variant="outline"
            className="h-auto p-4 flex-col gap-2 border-green-500/20 hover:border-green-500/40"
            onClick={captureAttendance}
            disabled={!cameraReady || knownFaces.length === 0}
          >
            <Users className="w-8 h-8 text-green-500" />
            <div className="text-center">
              <div className="font-semibold">Test Recognition</div>
              <div className="text-sm text-muted-foreground">Test current camera feed</div>
            </div>
          </Button>
          
          <Button 
            variant={debugMode ? "default" : "outline"}
            className="h-auto p-4 flex-col gap-2"
            onClick={() => setDebugMode(!debugMode)}
          >
            <Zap className="w-8 h-8" />
            <div className="text-center">
              <div className="font-semibold">Debug Mode</div>
              <div className="text-sm text-muted-foreground">{debugMode ? "ON" : "OFF"}</div>
            </div>
          </Button>
          
          <Button 
            variant="outline"
            className="h-auto p-4 flex-col gap-2 border-blue-500/20 hover:border-blue-500/40"
            onClick={testFaceDetection}
            disabled={!cameraReady}
          >
            <RefreshCw className="w-8 h-8 text-blue-500" />
            <div className="text-center">
              <div className="font-semibold">Test Detection</div>
              <div className="text-sm text-muted-foreground">Test face detection</div>
            </div>
          </Button>
          
          <Button 
            variant={forceDetection ? "default" : "outline"}
            className="h-auto p-4 flex-col gap-2 border-red-500/20 hover:border-red-500/40"
            onClick={() => setForceDetection(!forceDetection)}
          >
            <Zap className="w-8 h-8 text-red-500" />
            <div className="text-center">
              <div className="font-semibold">Force Detection</div>
              <div className="text-sm text-muted-foreground">{forceDetection ? "ON" : "OFF"}</div>
            </div>
          </Button>
          
          <Button 
            variant="outline"
            className="h-auto p-4 flex-col gap-2 border-purple-500/20 hover:border-purple-500/40"
            onClick={testBypassDetection}
            disabled={!cameraReady}
          >
            <Zap className="w-8 h-8 text-purple-500" />
            <div className="text-center">
              <div className="font-semibold">Bypass Test</div>
              <div className="text-sm text-muted-foreground">Skip detection</div>
            </div>
          </Button>
          
          <Button 
            variant="outline"
            className="h-auto p-4 flex-col gap-2 border-green-500/20 hover:border-green-500/40"
            onClick={checkDatabaseContents}
          >
            <RefreshCw className="w-8 h-8 text-green-500" />
            <div className="text-center">
              <div className="font-semibold">Check DB</div>
              <div className="text-sm text-muted-foreground">View DB contents</div>
            </div>
          </Button>

          <Button 
            variant="outline"
            className="h-auto p-4 flex-col gap-2 border-green-500/20 hover:border-green-500/40"
            onClick={addTestStudent}
          >
            <Users className="w-8 h-8 text-green-500" />
            <div className="text-center">
              <div className="font-semibold">Add Test Student</div>
              <div className="text-sm text-muted-foreground">Add a student for testing</div>
            </div>
          </Button>
          
          <Button 
            variant="outline"
            className="h-auto p-4 flex-col gap-2 border-red-500/20 hover:border-red-500/40"
            onClick={async () => {
              if (confirm('⚠️ This will clear all students and face data. Are you sure?')) {
                try {
                  console.log('🗑️ Clearing all data...');
                  
                  // Clear face recognition data first (due to foreign key constraints)
                  await supabase.from('face_recognition_data').delete().neq('id', '');
                  console.log('✅ Face data cleared');
                  
                  // Clear students
                  await supabase.from('students').delete().neq('id', '');
                  console.log('✅ Students cleared');
                  
                  // Clear attendance records
                  await supabase.from('attendance_records').delete().neq('id', '');
                  console.log('✅ Attendance records cleared');
                  
                  toast({
                    title: "Data Cleared",
                    description: "All students and face data have been removed",
                  });
                  
                  // Refresh the page
                  setTimeout(() => {
                    window.location.reload();
                  }, 1000);
                  
                } catch (error) {
                  console.error('❌ Error clearing data:', error);
                  toast({
                    title: "Error",
                    description: "Failed to clear data",
                    variant: "destructive"
                  });
                }
              }
            }}
          >
            <Trash2 className="w-8 h-8 text-red-500" />
            <div className="text-center">
              <div className="font-semibold">Clear All Data</div>
              <div className="text-sm text-muted-foreground">Reset database</div>
            </div>
          </Button>

          <Button 
            variant="outline"
            className="h-auto p-4 flex-col gap-2 border-green-500/20 hover:border-green-500/40"
            onClick={() => {
              console.log('🔄 Manual refresh triggered...');
              window.location.reload();
            }}
          >
            <RefreshCw className="w-8 h-8 text-green-500" />
            <div className="text-center">
              <div className="font-semibold">Refresh Data</div>
              <div className="text-sm text-muted-foreground">Reload students</div>
            </div>
          </Button>
        </div>
      </div>

      {/* Attendance List */}
      <Card className="loyola-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Attendance Status
          </CardTitle>
          <CardDescription>
            Live attendance tracking for registered students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {students.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">No students registered yet. Please add students to begin attendance tracking.</p>
              </div>
            ) : (
              studentsStatus.map((student) => (
              <div
                key={student.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  student.status === 'present' 
                    ? 'bg-accent/10 border-accent/20' 
                    : student.status === 'absent'
                    ? 'bg-destructive/10 border-destructive/20'
                    : 'bg-muted/30 border-border'
                }`}
              >
                <div>
                  <p className="font-medium">{student.full_name}</p>
                  <p className="text-sm text-muted-foreground">{student.student_id}</p>
                </div>
                <Badge
                  variant={
                    student.status === 'present' 
                      ? 'default' 
                      : student.status === 'absent' 
                      ? 'destructive' 
                      : 'outline'
                  }
                  className={
                    student.status === 'present' 
                      ? 'bg-accent text-accent-foreground' 
                      : ''
                  }
                >
                  {student.status === 'present' && <CheckCircle className="w-3 h-3 mr-1" />}
                  {student.status === 'absent' && <XCircle className="w-3 h-3 mr-1" />}
                  {student.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                  {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                </Badge>
              </div>
            )))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};