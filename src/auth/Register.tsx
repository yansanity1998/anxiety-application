import { useState } from 'react';
import { FaEye, FaEyeSlash, FaUser, FaLeaf, FaChevronDown } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import { streakService } from '../lib/streakService';
import Swal from 'sweetalert2';

type RegisterProps = {
  onSwitch: () => void;
};

const genders = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const yearLevelMap: { [key: string]: number } = {
  'First Year': 1,
  'Second Year': 2,
  'Third Year': 3,
  'Fourth Year': 4,
};

export default function Register({ onSwitch }: RegisterProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [school, setSchool] = useState('');
  const [course, setCourse] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showYearLevelDropdown, setShowYearLevelDropdown] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhoneNumber, setGuardianPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [idNumber, setIdNumber] = useState('');

  const Toast = Swal.mixin({
    toast: true,
    position: 'top',
    showConfirmButton: false,
    timer: 1000,
    timerProgressBar: true,
    width: '300px',
    padding: '1rem',
    background: '#f8fafc',
    backdrop: false,
    customClass: {
      popup: 'shadow-none border border-gray-200',
      title: 'text-sm font-medium',
      htmlContainer: 'text-xs',
      timerProgressBar: 'bg-[#800000]'
    },
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!rememberMe) {
      await Toast.fire({
        icon: 'warning',
        iconColor: '#f59e42',
        title: 'Please agree',
        text: 'You must check "Remember me" to register.',
      });
      setIsLoading(false);
      return;
    }

    if (!yearLevel) {
      await Toast.fire({
        icon: 'warning',
        iconColor: '#f59e42',
        title: 'Missing Year Level',
        text: 'Please select your year level.',
      });
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      await Toast.fire({
        icon: 'error',
        iconColor: '#ef4444',
        title: 'Password Mismatch',
        text: 'Passwords do not match!',
      });
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      await Toast.fire({
        icon: 'error',
        iconColor: '#ef4444',
        title: 'Weak Password',
        text: 'Password should be at least 6 characters',
      });
      setIsLoading(false);
      return;
    }

    try {
      const yearLevelNumber = yearLevelMap[yearLevel];

      // Step 1: Sign up user
      console.log('🚀 Starting registration with role:', 'student');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            full_name: name,
            name: name,
            id_number: idNumber,
            age: Number(age),
            gender,
            school,
            course,
            year_level: yearLevelNumber,
            phone_number: phoneNumber,
            guardian_name: guardianName,
            guardian_phone_number: guardianPhoneNumber,
            address: address,
            role: 'student' // Ensure this is explicitly set to 'student'
          }
        }
      });

      if (error) {
        console.error('Registration error:', error);
        
        if (error.message.includes('already registered')) {
          await Toast.fire({
            icon: 'info',
            iconColor: '#3b82f6',
            title: 'Account Exists',
            text: 'This email is already registered. Please log in.',
          });
          onSwitch();
          return;
        }

        throw error;
      }

      // Step 2: Check if user needs email confirmation
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        await Toast.fire({
          icon: 'info',
          iconColor: '#3b82f6',
          title: 'Account Exists',
          text: 'User already registered. Please log in.',
        });
        onSwitch();
        return;
      }

      // Step 3: Create profile
      if (data.user) {
        console.log('✅ User created successfully:', data.user.id);
        console.log('📋 User metadata:', data.user.user_metadata);
        
        // The profile should be created automatically by the database trigger
        // Let's verify it was created and initialize streak if needed
        try {
          // Wait a moment for the trigger to execute
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check if profile was created by the trigger
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('user_id, role, streak')
            .eq('user_id', data.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Profile check failed:', profileError);
            // Profile might not exist, try to initialize streak anyway
            await streakService.initializeUserStreak(data.user.id);
          } else if (profile) {
            console.log('✅ Profile found with role:', profile.role);
            await streakService.initializeUserStreak(data.user.id);
          }
        } catch (error) {
          console.error('Profile verification failed:', error);
          // Continue with registration even if profile check fails
        }
      }

      // Success handling
      await Toast.fire({
        icon: 'success',
        iconColor: '#10b981',
        title: 'Registration Successful!',
        text: 'Your account has been created successfully.',
        timer: 1000
      });

      // Clear form
      // setName('');
      // setEmail('');
      // setPassword('');
      // setConfirmPassword('');
      // setSchool('');
      // setCourse('');
      // setYearLevel('');
      // setAge('');
      // setGender('');
      // setPhoneNumber('');
      // setGuardianName('');
      // setGuardianPhoneNumber('');
      // setAddress('');
      // setRememberMe(false);

      // Redirect to login after a short delay
      setTimeout(() => {
        onSwitch();
      }, 500);

    } catch (error) {
      console.error('Registration error:', error);
      await Toast.fire({
        icon: 'error',
        iconColor: '#ef4444',
        title: 'Registration Failed',
        text: error instanceof Error ? error.message : 'Could not create account. Please try again.',
        timer: 3000
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#800000]/5 p-4 relative overflow-hidden text-xs sm:text-sm">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-20 h-20 bg-[#800000]/20 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-[#800000]/20 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-32 w-24 h-24 bg-[#800000]/20 rounded-full opacity-20 animate-pulse delay-2000"></div>
        <div className="absolute bottom-32 right-10 w-12 h-12 bg-[#800000]/20 rounded-full opacity-20 animate-pulse delay-500"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-3">
            <div className="bg-[#800000] p-2 rounded-full shadow-lg">
              <FaUser className="text-white text-xl" />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#800000] mb-1">
            Create Your Account
          </h1>
          <p className="text-gray-600 text-xs flex items-center justify-center gap-1">
            <FaLeaf className="text-green-500 text-xs" />
            Begin your peaceful journey
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Personal Information */}
          <div className="grid grid-cols-2 gap-3">
            {/* Name Field */}
            <div className="col-span-2">
              <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-1 focus:ring-[#800000] focus:border-transparent transition duration-200 bg-gray-50/50 backdrop-blur-sm text-xs"
                placeholder="Full Name"
                required
                autoComplete="name"
              />
            </div>

            {/* ID Number Field */}
            <div className="col-span-2">
              <label htmlFor="idNumber" className="block text-xs font-medium text-gray-700 mb-1">
                ID Number
              </label>
              <input
                type="text"
                id="idNumber"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-1 focus:ring-[#800000] focus:border-transparent transition duration-200 bg-gray-50/50 backdrop-blur-sm text-xs"
                placeholder="2021-01066"
                required
                autoComplete="off"
              />
            </div>

            {/* Age Field */}
            <div>
              <label htmlFor="age" className="block text-xs font-medium text-gray-700 mb-1">
                Age
              </label>
              <input
                type="number"
                id="age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-1 focus:ring-[#800000] focus:border-transparent transition duration-200 bg-gray-50/50 backdrop-blur-sm text-xs"
                placeholder="18"
                min="1"
                required
              />
            </div>

            {/* Gender Field */}
            <div className="relative">
              <label htmlFor="gender" className="block text-xs font-medium text-gray-700 mb-1">
                Gender
              </label>
              <div
                className="block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-1 focus:ring-[#800000] focus:border-transparent transition duration-200 bg-gray-50/50 backdrop-blur-sm text-xs cursor-pointer flex justify-between items-center"
                onClick={() => setShowGenderDropdown(!showGenderDropdown)}
              >
                {gender || 'Select gender'}
                <FaChevronDown className="text-gray-400 text-xs" />
              </div>
              {showGenderDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg">
                  {genders.map((g) => (
                    <div
                      key={g}
                      className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-xs"
                      onClick={() => {
                        setGender(g);
                        setShowGenderDropdown(false);
                      }}
                    >
                      {g}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Academic Information */}
          <div className="grid grid-cols-2 gap-3">
            {/* School Field */}
            <div className="col-span-2">
              <label htmlFor="school" className="block text-xs font-medium text-gray-700 mb-1">
                School
              </label>
              <input
                type="text"
                id="school"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-1 focus:ring-[#800000] focus:border-transparent transition duration-200 bg-gray-50/50 backdrop-blur-sm text-xs"
                placeholder="University Name"
                required
                autoComplete="organization"
              />
            </div>

            {/* Course Field */}
            <div>
              <label htmlFor="course" className="block text-xs font-medium text-gray-700 mb-1">
                Course
              </label>
              <input
                type="text"
                id="course"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-1 focus:ring-[#800000] focus:border-transparent transition duration-200 bg-gray-50/50 backdrop-blur-sm text-xs"
                placeholder="BS Criminology"
                required
                autoComplete="off"
              />
            </div>

            {/* Year Level Field */}
            <div className="relative">
              <label htmlFor="yearLevel" className="block text-xs font-medium text-gray-700 mb-1">
                Year Level
              </label>
              <div
                className="block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-1 focus:ring-[#800000] focus:border-transparent transition duration-200 bg-gray-50/50 backdrop-blur-sm text-xs cursor-pointer flex justify-between items-center"
                onClick={() => setShowYearLevelDropdown(!showYearLevelDropdown)}
              >
                {yearLevel || 'Select year level'}
                <FaChevronDown className="text-gray-400 text-xs" />
              </div>
              {showYearLevelDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg">
                  {Object.keys(yearLevelMap).map((level) => (
                    <div
                      key={level}
                      className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-xs"
                      onClick={() => {
                        setYearLevel(level);
                        setShowYearLevelDropdown(false);
                      }}
                    >
                      {level}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-2 gap-3">
            {/* Phone Number Field */}
            <div>
              <label htmlFor="phoneNumber" className="block text-xs font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-1 focus:ring-[#800000] focus:border-transparent transition duration-200 bg-gray-50/50 backdrop-blur-sm text-xs"
                placeholder="+63 912 345 6789"
                required
                autoComplete="tel"
              />
            </div>

            {/* Address Field */}
            <div>
              <label htmlFor="address" className="block text-xs font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-1 focus:ring-[#800000] focus:border-transparent transition duration-200 bg-gray-50/50 backdrop-blur-sm text-xs"
                placeholder="City, Province"
                required
                autoComplete="street-address"
              />
            </div>
          </div>

          {/* Guardian Information */}
          <div className="grid grid-cols-2 gap-3">
            {/* Guardian Name Field */}
            <div>
              <label htmlFor="guardianName" className="block text-xs font-medium text-gray-700 mb-1">
                Guardian Name
              </label>
              <input
                type="text"
                id="guardianName"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-1 focus:ring-[#800000] focus:border-transparent transition duration-200 bg-gray-50/50 backdrop-blur-sm text-xs"
                placeholder="Parent/Guardian Name"
                required
                autoComplete="name"
              />
            </div>

            {/* Guardian Phone Number Field */}
            <div>
              <label htmlFor="guardianPhoneNumber" className="block text-xs font-medium text-gray-700 mb-1">
                Guardian Phone
              </label>
              <input
                type="tel"
                id="guardianPhoneNumber"
                value={guardianPhoneNumber}
                onChange={(e) => setGuardianPhoneNumber(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-1 focus:ring-[#800000] focus:border-transparent transition duration-200 bg-gray-50/50 backdrop-blur-sm text-xs"
                placeholder="+63 912 345 6789"
                required
                autoComplete="tel"
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-1 focus:ring-[#800000] focus:border-transparent transition duration-200 bg-gray-50/50 backdrop-blur-sm text-xs"
                placeholder="your@email.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password Fields */}
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-3 py-2 pr-8 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-1 focus:ring-[#800000] focus:border-transparent transition duration-200 bg-gray-50/50 backdrop-blur-sm text-xs"
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-2 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <FaEyeSlash className="text-gray-600 hover:text-gray-800 transition-colors text-xs" />
                ) : (
                  <FaEye className="text-gray-600 hover:text-gray-800 transition-colors text-xs" />
                )}
              </button>
            </div>
          </div>
          <div className="mt-3">
            <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full px-3 py-2 pr-8 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-1 focus:ring-[#800000] focus:border-transparent transition duration-200 bg-gray-50/50 backdrop-blur-sm text-xs"
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-2 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <FaEyeSlash className="text-gray-600 hover:text-gray-800 transition-colors text-xs" />
                ) : (
                  <FaEye className="text-gray-600 hover:text-gray-800 transition-colors text-xs" />
                )}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-3 w-3 text-[#800000] focus:ring-[#800000] border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-gray-600">
                Remember me
              </label>
            </div>
            <a href="#" className="font-medium text-[#800000] hover:text-[#660000] transition-colors">
              Terms & Privacy
            </a>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-xl shadow-lg text-xs font-medium text-white bg-[#800000] hover:bg-[#660000] focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-[#800000] transition-all duration-200 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-3 w-3 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating account...
                </>
              ) : (
                'Register Your Safe Space'
              )}
            </button>
          </div>
        </form>

        {/* Login Link */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitch}
              className="font-medium text-[#800000] hover:text-[#660000] transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </p>
        </div>

        {/* Motivational Message */}
        <div className="mt-4 text-center p-2 bg-[#800000]/5 rounded-xl border border-[#800000]/30">
          <p className="text-2xs text-gray-600 leading-relaxed">
            "Your new beginning starts now. Stay strong and keep growing." 💙
          </p>
        </div>
      </div>
    </div>
  );
}