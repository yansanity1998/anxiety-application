  import { useState } from 'react';
  import { useNavigate } from 'react-router-dom';
  import { FaEye, FaEyeSlash, FaBrain, FaLeaf } from 'react-icons/fa';
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
        timerProgressBar: 'bg-[#800000]'
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
                role: email.toLowerCase() === 'admin@gmail.com' ? 'admin' : 
                      email.toLowerCase() === 'guidance@gmail.com' ? 'guidance' : 'student',
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

          // Block archived users from logging in (except admin by email)
          const userRole = (userProfile as any)?.role?.toLowerCase?.() || '';
          const isAdminByEmail = email.toLowerCase() === 'admin@gmail.com';
          if (userRole === 'archived' && !isAdminByEmail) {
            await Toast.fire({
              icon: 'error',
              iconColor: '#ef4444',
              title: 'Account Archived',
              text: 'Your account has been archived. Please contact the administrator.',
              timer: 2000
            });
            await supabase.auth.signOut();
            setIsLoading(false);
            return;
          }

          // Block unverified students from logging in
          const isVerified = (userProfile as any)?.is_verified === true;
          const isPrivileged = isAdminByEmail || userRole === 'admin' || userRole === 'guidance';
          if (!isPrivileged && !isVerified) {
            await Toast.fire({
              icon: 'info',
              iconColor: '#3b82f6',
              title: 'Pending Verification',
              text: 'Your account is awaiting verification by the Guidance Office.',
              timer: 2500
            });
            await supabase.auth.signOut();
            setIsLoading(false);
            return;
          }

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

          // Check if the user is trying to log in as admin or guidance
          const isAdminAttempt = email.toLowerCase() === 'admin@gmail.com';
          const isGuidanceAttempt = email.toLowerCase() === 'guidance@gmail.com';
          
          // Allow admin/guidance login if email matches OR if profile role matches
          if (isAdminAttempt || userProfile.role === 'admin') {
            // Modern simple alert for admin
            const alertDiv = document.createElement('div');
            alertDiv.className = 'fixed top-4 right-4 z-50 bg-white border-l-4 border-emerald-500 rounded-lg shadow-lg p-4 max-w-sm transform transition-all duration-300 ease-in-out';
            alertDiv.innerHTML = `
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-gray-900">Welcome Admin!</p>
                  <p class="text-xs text-gray-500 mt-1">Accessing admin dashboard</p>
                </div>
                <div class="ml-auto pl-3">
                  <div class="-mx-1.5 -my-1.5">
                    <button type="button" class="inline-flex bg-white rounded-md p-1.5 text-gray-400 hover:text-gray-500 focus:outline-none" onclick="this.closest('div').remove()">
                      <span class="sr-only">Dismiss</span>
                      <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            `;
            document.body.appendChild(alertDiv);
            setTimeout(() => alertDiv.remove(), 3000);
            navigate('/admin');
          } else if (isGuidanceAttempt || userProfile.role === 'guidance') {
            // Modern simple alert for guidance
            const alertDiv = document.createElement('div');
            alertDiv.className = 'fixed top-4 right-4 z-50 bg-white border-l-4 border-blue-500 rounded-lg shadow-lg p-4 max-w-sm transform transition-all duration-300 ease-in-out';
            alertDiv.innerHTML = `
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-gray-900">Welcome Guidance Counselor!</p>
                  <p class="text-xs text-gray-500 mt-1">Accessing guidance dashboard</p>
                </div>
                <div class="ml-auto pl-3">
                  <div class="-mx-1.5 -my-1.5">
                    <button type="button" class="inline-flex bg-white rounded-md p-1.5 text-gray-400 hover:text-gray-500 focus:outline-none" onclick="this.closest('div').remove()">
                      <span class="sr-only">Dismiss</span>
                      <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            `;
            document.body.appendChild(alertDiv);
            setTimeout(() => alertDiv.remove(), 3000);
            navigate('/guidance');
          } else {
            // Check latest assessment to enforce once-per-week rule
            try {
              const profileId = (userProfile as any)?.id;
              if (profileId) {
                const { data: lastAssessments, error: lastAssessmentError } = await supabase
                  .from('anxiety_assessments')
                  .select('created_at')
                  .eq('profile_id', profileId)
                  .order('created_at', { ascending: false })
                  .limit(1);

                if (lastAssessmentError) {
                  console.error('Error checking last assessment:', lastAssessmentError);
                  // If we cannot check, default to assessment to avoid blocking
                  navigate('/assessment');
                } else {
                  let shouldGoToAssessment = true;
                  if (lastAssessments && lastAssessments.length > 0) {
                    const lastDate = new Date(lastAssessments[0].created_at as string);
                    const diffDays = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
                    shouldGoToAssessment = diffDays >= 7;
                  }

                  navigate(shouldGoToAssessment ? '/assessment' : '/dashboard');
                }
              } else {
                // No profile id found, fallback to assessment
                navigate('/assessment');
              }
            } catch (navErr) {
              console.error('Unexpected error while deciding navigation:', navErr);
              navigate('/assessment');
            }
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
      <div className="p-6 relative text-sm sm:text-base animate-fade-in">
        <div className="w-full relative">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-[#800000] p-3 rounded-full shadow-lg">
                <FaBrain className="text-white text-2xl" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#800000] mb-2">
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
                className="block w-full pl-4 pr-4 py-3 border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-transparent transition duration-200 bg-gray-50/50 backdrop-blur-sm"
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
                  className="block w-full pl-4 pr-12 py-3 border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-transparent transition duration-200 bg-gray-50/50 backdrop-blur-sm"
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
                  className="h-4 w-4 text-[#800000] focus:ring-[#800000] border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-gray-600">
                  Remember me
                </label>
              </div>
              <a href="#" className="font-medium text-[#800000] hover:text-[#660000] transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-2xl shadow-lg text-sm font-medium text-white bg-[#800000] hover:bg-[#660000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#800000] transition-all duration-200 ${
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
                className="font-medium text-[#800000] hover:text-[#660000] transition-colors cursor-pointer"
              >
                Create Account
              </button>
            </p>
          </div>

          {/* Motivational Message */}
          <div className="mt-6 text-center p-4 bg-[#800000]/5 rounded-2xl border border-[#800000]/30">
            <p className="text-xs text-gray-600 leading-relaxed">
              "Every step forward is a victory. You're stronger than you think." 💙
            </p>
          </div>
        </div>
      </div>
    );
  }