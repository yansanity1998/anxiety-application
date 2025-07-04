import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaHeart, FaLeaf } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import { streakService } from '../lib/streakService';
import Swal from 'sweetalert2';

type LoginProps = {
  onSwitch: () => void;
};

export default function Login({ onSwitch }: LoginProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      timerProgressBar: 'bg-gradient-to-r from-blue-400 to-purple-500'
    },
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Starting login process for:', email);
      
      // First, try to sign in
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        console.error('Authentication error:', signInError);
        await Toast.fire({
          icon: 'error',
          iconColor: '#ef4444',
          title: 'Authentication Failed',
          text: signInError.message,
          timer: 2000
        });
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        throw new Error('No user data returned from authentication');
      }

      console.log('Authentication successful:', {
        userId: authData.user.id,
        email: authData.user.email
      });

      // Wait a moment for any database operations to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if user exists in profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      let userProfile = profile; // Use a mutable variable

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        
        // If profile doesn't exist, this might be an old user or database issue
        // Let's try to create a basic profile with available data
        console.log('Profile not found, attempting to create basic profile...');
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              user_id: authData.user.id,
              email: authData.user.email,
              full_name: authData.user.user_metadata?.full_name || authData.user.user_metadata?.name || 'User',
              id_number: authData.user.user_metadata?.id_number || null,
              age: authData.user.user_metadata?.age || null,
              gender: authData.user.user_metadata?.gender || null,
              school: authData.user.user_metadata?.school || null,
              course: authData.user.user_metadata?.course || null,
              year_level: authData.user.user_metadata?.year_level || null,
              phone_number: authData.user.user_metadata?.phone_number || null,
              guardian_name: authData.user.user_metadata?.guardian_name || null,
              guardian_phone_number: authData.user.user_metadata?.guardian_phone_number || null,
              address: authData.user.user_metadata?.address || null,
              role: email.toLowerCase() === 'admin@gmail.com' ? 'admin' : 'student',
              streak: 1,
              last_activity_date: new Date().toISOString().split('T')[0],
              created_at: new Date().toISOString(),
              last_sign_in: new Date().toISOString()
            }
          ])
          .select()
          .single();

        if (createError) {
          console.error('Profile creation error:', createError);
          // If we can't create a profile, still allow login but show a warning
          await Toast.fire({
            icon: 'warning',
            iconColor: '#f59e42',
            title: 'Profile Issue',
            text: 'Login successful but profile data may be incomplete. Please contact support.',
            timer: 3000
          });
          
          // Navigate based on email (admin check)
          if (email.toLowerCase() === 'admin@gmail.com') {
            navigate('/admin');
          } else {
            navigate('/assessment');
          }
          return;
        }

        console.log('Basic profile created:', newProfile);
        userProfile = newProfile; // Use the newly created profile
      }

      // At this point, we should have a profile (either existing or newly created)
      if (userProfile) {
        console.log('Profile found/created:', userProfile);

        // Update last_sign_in
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ last_sign_in: new Date().toISOString() })
          .eq('user_id', authData.user.id);

        if (updateError) {
          console.error('Last sign in update error:', updateError);
        }
        
        // Update streak on login using the database function for better reliability
        try {
          console.log('Updating streak on login for user:', authData.user.id);
          
          // First, get the current streak before update
          const { data: currentStreakData } = await supabase
            .from('profiles')
            .select('streak, last_activity_date')
            .eq('user_id', authData.user.id)
            .single();
          
          console.log('Current streak before login:', currentStreakData?.streak);
          console.log('Last activity date before login:', currentStreakData?.last_activity_date);
          
          // Call the database function to update streak
          const { data: streakResult, error: streakError } = await supabase.rpc('update_user_streak_manual', {
            user_id_param: authData.user.id
          });
          
          if (streakError) {
            console.error('Database streak update error:', streakError);
            // Fallback to frontend streak service
            await streakService.updateUserStreak(authData.user.id);
          } else {
            console.log('Database streak update successful. New streak:', streakResult);
          }
          
          // Verify the streak was updated
          const { data: verifyStreakData } = await supabase
            .from('profiles')
            .select('streak, last_activity_date')
            .eq('user_id', authData.user.id)
            .single();
          
          console.log('Verified streak after login:', verifyStreakData?.streak);
          console.log('Verified last activity date after login:', verifyStreakData?.last_activity_date);
          
        } catch (streakError) {
          console.error('Streak update error:', streakError);
          // Fallback to frontend streak service
          try {
            await streakService.updateUserStreak(authData.user.id);
          } catch (fallbackError) {
            console.error('Fallback streak update also failed:', fallbackError);
          }
        }

        // Check if the user is trying to log in as admin
        const isAdminAttempt = email.toLowerCase() === 'admin@gmail.com';
        
        // Allow admin login if email is admin@gmail.com OR if profile role is admin
        if (isAdminAttempt || userProfile.role === 'admin') {
          await Toast.fire({
            icon: 'success',
            iconColor: '#10b981',
            title: 'Welcome Admin!',
            text: 'Accessing admin dashboard',
            timer: 1000
          });
          navigate('/admin');
        } else {
          await Toast.fire({
            icon: 'success',
            iconColor: '#10b981',
            title: 'Welcome back!',
            text: 'Your peaceful space awaits',
            timer: 1000
          });
          navigate('/assessment');
        }
      } else {
        throw new Error('Failed to retrieve or create user profile');
      }
    } catch (error) {
      console.error('Login process error:', error);
      await Toast.fire({
        icon: 'error',
        iconColor: '#ef4444',
        title: 'Login Failed',
        text: error instanceof Error ? error.message : 'An unexpected error occurred',
        timer: 2000
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 relative overflow-hidden text-sm sm:text-base">
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-purple-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-32 w-24 h-24 bg-indigo-200 rounded-full opacity-20 animate-pulse delay-2000"></div>
        <div className="absolute bottom-32 right-10 w-12 h-12 bg-teal-200 rounded-full opacity-20 animate-pulse delay-500"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-full shadow-lg">
              <FaHeart className="text-white text-2xl" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm flex items-center justify-center gap-2">
            <FaLeaf className="text-green-500 text-xs" />
            Your peaceful journey continues
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-4 pr-4 py-3 border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200 bg-gray-50/50 backdrop-blur-sm"
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-4 pr-12 py-3 border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200 bg-gray-50/50 backdrop-blur-sm"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <FaEyeSlash className="text-gray-600 hover:text-gray-800 transition-colors" />
                ) : (
                  <FaEye className="text-gray-600 hover:text-gray-800 transition-colors" />
                )}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-gray-600">
                Remember me
              </label>
            </div>
            <a href="#" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
              Forgot password?
            </a>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-2xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : 'transform hover:scale-[1.02]'
              }`}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  Signing in...
                </>
              ) : (
                'Sign In to Your Safe Space'
              )}
            </button>
          </div>
        </form>

        {/* Sign Up Link */}
        <div className="mt-6 text-center">
          <p className="text-xs sm:text-sm text-gray-600">
            New to your wellness journey?{' '}
            <button
              type="button"
              onClick={onSwitch}
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors cursor-pointer"
            >
              Create Account
            </button>
          </p>
        </div>

        {/* Motivational Message */}
        <div className="mt-6 text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
          <p className="text-xs text-gray-600 leading-relaxed">
            "Every step forward is a victory. You're stronger than you think." 💙
          </p>
        </div>
      </div>
    </div>
  );
}