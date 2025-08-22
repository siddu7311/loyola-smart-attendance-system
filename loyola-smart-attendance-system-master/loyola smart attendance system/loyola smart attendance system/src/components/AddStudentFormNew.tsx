import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Camera, CheckCircle, AlertCircle, Phone, Mail, Calendar, MapPin, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ModernCameraCapture } from "./ModernCameraCapture";
import { supabase } from "@/integrations/supabase/client";
import { faceRecognitionService } from '@/utils/faceRecognitionService';

interface AddStudentFormProps {
  onStudentAdded: () => void;
}

interface StudentFormData {
  fullName: string;
  studentId: string;
  email: string;
  gmail: string;
  password: string;
  phoneNumber: string;
  department: string;
  dateOfBirth: string;
  parentName: string;
  address: string;
}

export const AddStudentFormNew = ({ onStudentAdded }: AddStudentFormProps) => {
  const [formData, setFormData] = useState<StudentFormData>({
    fullName: '',
    studentId: '',
    email: '',
    gmail: '',
    password: '',
    phoneNumber: '',
    department: '',
    dateOfBirth: '',
    parentName: '',
    address: ''
  });
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [faceFeatures, setFaceFeatures] = useState<Float32Array | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const { toast } = useToast();

  // Initialize face recognition on component mount
  useEffect(() => {
    const initFaceRecognition = async () => {
      try {
        await faceRecognitionService.initialize();
        console.log('✅ Unified face recognition initialized');
      } catch (error) {
        console.error('❌ Failed to initialize face recognition:', error);
      }
    };
    
    initFaceRecognition();
  }, []);

  const handleInputChange = (field: keyof StudentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageCapture = async (imageDataUrl: string, features: Float32Array | null) => {
    if (!imageDataUrl) {
      toast({
        title: "Error",
        description: "Failed to capture image",
        variant: "destructive",
      });
      return;
    }

    // Add the captured image
    setCapturedImages(prev => [...prev, imageDataUrl]);
    
    // Try to extract face features using the unified service if not provided
    if (!features) {
      try {
        const extractedFeatures = await faceRecognitionService.extractFeatures(imageDataUrl);
        setFaceFeatures(extractedFeatures);
        console.log('✅ Face features extracted with unified recognition');
      } catch (error) {
        console.error('❌ Failed to extract face features:', error);
        toast({
          title: "Warning",
          description: "Could not detect a face in the image. Please try again with better lighting and positioning.",
          variant: "destructive"
        });
      }
    } else {
      setFaceFeatures(features);
      console.log('✅ Face features received from camera component');
    }
    
    setShowCamera(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.studentId || !formData.email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      toast({
        title: "Error", 
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    if (capturedImages.length === 0 || !faceFeatures) {
      toast({
        title: "Error",
        description: "Please capture at least one image with a clearly visible face",
        variant: "destructive",
      });
      return;
    }

    console.log('🚀 Starting student submission...');
    console.log('📝 Form data:', formData);
    console.log('📸 Captured images:', capturedImages.length);
    console.log('🧠 Face features:', faceFeatures ? `Available (${faceFeatures.length} features)` : 'None');
    
    setIsSubmitting(true);

    try {
      console.log('💾 Adding student to database...');
      
      // Add student to database first
      const { data: student, error: studentError } = await supabase
        .from('students')
        .insert({
          student_id: formData.studentId,
          full_name: formData.fullName,
          email: [formData.email],
          phone_number: formData.phoneNumber || null,
          department: formData.department || null,
          date_of_birth: formData.dateOfBirth || null,
          parent_name: formData.parentName || null,
          address: formData.address || null,
          profile_images: capturedImages.length > 0 ? capturedImages : null
        })
        .select()
        .single();

      if (studentError) {
        console.error('❌ Student creation error:', studentError);
        throw new Error(`Failed to add student: ${studentError.message}`);
      }

      console.log('✅ Student added successfully:', student);

      // Save face recognition data if available
      if (faceFeatures && student) {
        console.log('🧠 Saving face recognition data...');
        console.log('📊 Face features array length:', faceFeatures.length);
        console.log('📊 Face features sample:', Array.from(faceFeatures).slice(0, 10));
        
        const { error: faceError } = await supabase
          .from('face_recognition_data')
          .insert({
            student_id: student.id,
            face_encoding: Array.from(faceFeatures),
            image_url: capturedImages[0] || null,
            is_primary: true,
            model_version: 'unified-face-api-v1' // Add model version for tracking
          });

        if (faceError) {
          console.error('❌ Error saving face data:', faceError);
          toast({
            title: "Warning",
            description: "Student added but face recognition data could not be saved",
            variant: "destructive"
          });
        } else {
          console.log('✅ Face recognition data saved successfully');
        }
      } else {
        console.log('⚠️ No face features available for saving');
        if (!faceFeatures) {
          console.log('❌ Face features are null/undefined');
        }
        if (!student) {
          console.log('❌ Student object is null/undefined');
        }
      }

      // Create user account for the student (optional - for login purposes)
      if (formData.password) {
        const { error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: formData.fullName,
              role: 'student',
              student_id: formData.studentId,
              department: formData.department
            }
          }
        });

        if (authError) {
          console.warn('Auth account creation failed:', authError);
          // Continue even if auth creation fails - student is still added to database
        } else {
          // Create profile record for the student
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: (await supabase.auth.getUser()).data.user?.id,
              email: formData.email,
              full_name: formData.fullName,
              role: 'student',
              student_id: formData.studentId,
              department: formData.department,
              phone_number: formData.phoneNumber,
              address: formData.address
            });

          if (profileError) {
            console.warn('Profile creation failed:', profileError);
          }
        }
      }

      toast({
        title: "Student Added Successfully! ✅",
        description: `${formData.fullName} (${formData.studentId}) has been registered in the system`,
      });

      // Reset form
      setFormData({
        fullName: '',
        studentId: '',
        email: '',
        gmail: '',
        password: '',
        phoneNumber: '',
        department: '',
        dateOfBirth: '',
        parentName: '',
        address: ''
      });
      setCapturedImages([]);
      setFaceFeatures(null);
      
      // Notify parent component
      onStudentAdded();
      
    } catch (error) {
      console.error('❌ Error submitting student:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add student",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <User className="h-6 w-6" />
            Add New Student
          </CardTitle>
          <CardDescription>
            Register a new student with their personal information and face recognition data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Personal Information</h3>
                  <Badge variant="outline" className="text-xs">Required</Badge>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName" 
                    placeholder="Enter full name" 
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input 
                    id="studentId" 
                    placeholder="Enter student ID" 
                    value={formData.studentId}
                    onChange={(e) => handleInputChange('studentId', e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="Enter email address" 
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Create password (min. 6 characters)" 
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              
              {/* Additional Information */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Additional Information</h3>
                  <Badge variant="outline" className="text-xs">Optional</Badge>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input 
                    id="phoneNumber" 
                    placeholder="Enter phone number" 
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="department" className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Department
                  </Label>
                  <Input 
                    id="department" 
                    placeholder="Enter department" 
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Date of Birth
                  </Label>
                  <Input 
                    id="dateOfBirth" 
                    type="date" 
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Address
                  </Label>
                  <Textarea 
                    id="address" 
                    placeholder="Enter address" 
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </div>
            
            {/* Face Recognition */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Face Recognition</h3>
                <Badge variant="outline" className="text-xs">Required</Badge>
              </div>
              
              <div className="flex flex-col items-center space-y-4">
                {capturedImages.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
                    {capturedImages.map((image, index) => (
                      <div key={index} className="relative rounded-lg overflow-hidden border aspect-square">
                        <img 
                          src={image} 
                          alt={`Captured face ${index + 1}`} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="bg-white/80">
                            {index === 0 ? 'Primary' : `Image ${index + 1}`}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg w-full max-w-md">
                    <Camera className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-center text-muted-foreground mb-4">
                      No face image captured yet. Please capture at least one clear image of the student's face.
                    </p>
                  </div>
                )}
                
                <div className="flex items-center gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCamera(true)}
                    className="flex items-center gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    {capturedImages.length > 0 ? 'Capture Another Image' : 'Capture Face Image'}
                  </Button>
                  
                  {faceFeatures && (
                    <div className="flex items-center text-sm text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Face features extracted successfully
                    </div>
                  )}
                  
                  {capturedImages.length > 0 && !faceFeatures && (
                    <div className="flex items-center text-sm text-amber-600">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      No face detected. Try capturing again with better lighting.
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="pt-4 flex justify-end">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full md:w-auto"
              >
                {isSubmitting ? 'Adding Student...' : 'Add Student'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {showCamera && (
        <ModernCameraCapture
          onClose={() => setShowCamera(false)}
          onImageCapture={handleImageCapture}
          captureMode="single"
          showHelp={true}
        />
      )}
    </div>
  );
};