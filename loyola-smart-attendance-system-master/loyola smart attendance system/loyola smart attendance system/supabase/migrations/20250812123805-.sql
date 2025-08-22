-- Clean up and ensure proper database structure

-- Create auth trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, employee_id, student_id, department)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    NEW.raw_user_meta_data->>'employee_id',
    NEW.raw_user_meta_data->>'student_id',
    NEW.raw_user_meta_data->>'department'
  );
  RETURN NEW;
END;
$function$;

-- Create trigger on auth.users if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies for profiles to allow insert
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Update face_recognition_data table to properly link to students
ALTER TABLE public.face_recognition_data 
DROP CONSTRAINT IF EXISTS face_recognition_data_student_id_fkey;

ALTER TABLE public.face_recognition_data 
ADD CONSTRAINT face_recognition_data_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

-- Update attendance_records to properly link to students
ALTER TABLE public.attendance_records 
DROP CONSTRAINT IF EXISTS attendance_records_student_id_fkey;

ALTER TABLE public.attendance_records 
ADD CONSTRAINT attendance_records_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

-- Ensure proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_student_id ON public.students(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance_records(attendance_date);
CREATE INDEX IF NOT EXISTS idx_face_recognition_student ON public.face_recognition_data(student_id);