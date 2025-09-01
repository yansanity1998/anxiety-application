import { FaUserPlus } from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import Swal from 'sweetalert2';

interface AddUserProps {
  darkMode: boolean;
  onUserCreated?: () => void;
}

export default function AddUser({ darkMode, onUserCreated }: AddUserProps) {

  const Toast = Swal.mixin({
    toast: true,
    position: 'top',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    width: '300px',
    padding: '1rem',
    background: darkMode ? '#1f2937' : '#f8fafc',
    color: darkMode ? '#f3f4f6' : '#111827',
    backdrop: false,
    customClass: {
      popup: `shadow-xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'} rounded-xl`,
      title: 'text-sm font-medium',
      htmlContainer: 'text-xs',
      timerProgressBar: 'bg-gradient-to-r from-indigo-500 to-purple-600'
    },
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });

  const Modal = Swal.mixin({
    background: darkMode ? '#1f2937' : '#ffffff',
    color: darkMode ? '#f3f4f6' : '#111827',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    width: '420px',
    customClass: {
      container: 'text-sm',
      popup: `rounded-2xl shadow-2xl border-2 ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'}`,
      title: `text-2xl font-bold ${darkMode ? 'text-white' : 'text-[#800000]'} mb-4`,
      htmlContainer: `text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'} max-h-96 overflow-y-auto`,
      confirmButton: 'bg-gradient-to-r from-indigo-700 to-indigo-800 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105',
      cancelButton: `${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'} border-2 font-medium py-3 px-8 rounded-xl transition-all duration-200 shadow hover:shadow-md`
    },
    allowOutsideClick: false,
    allowEscapeKey: true,
    allowEnterKey: true,
    stopKeydownPropagation: true,
    scrollbarPadding: false,
    heightAuto: true,
    didOpen: () => {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px';
    },
    willClose: () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
  });

  const handleAddGuidanceUser = async () => {

    const { value: formValues } = await Modal.fire({
      title: 'Add Guidance User',
      html: `
        <div class="space-y-4">
          <!-- Header Section -->
          <div class="text-center mb-4">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-100 to-indigo-200 ${darkMode ? 'from-indigo-900/30 to-indigo-800/30' : ''} rounded-xl mb-3 shadow-lg">
              <svg class="w-8 h-8 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 class="text-lg font-bold ${darkMode ? 'text-white' : 'text-indigo-800'} mb-1">Add Guidance User</h3>
            <p class="text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}">Create new counselor account</p>
          </div>

          <!-- Form Fields -->
          <div class="space-y-3">
            <!-- Full Name -->
            <div class="space-y-2">
              <label class="flex items-center text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'} mb-1">
                <div class="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-200 ${darkMode ? 'from-indigo-900/30 to-indigo-800/30' : ''} flex items-center justify-center mr-2">
                  <svg class="w-3 h-3 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                Full Name
              </label>
              <input 
                type="text" 
                id="guidance-fullname" 
                placeholder="Enter full name"
                class="w-full p-3 border rounded-lg ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500'} focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 text-sm shadow-sm hover:shadow-md" 
              />
            </div>

            <!-- Email -->
            <div class="space-y-2">
              <label class="flex items-center text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'} mb-1">
                <div class="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-200 ${darkMode ? 'from-indigo-900/30 to-indigo-800/30' : ''} flex items-center justify-center mr-2">
                  <svg class="w-3 h-3 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                Email
              </label>
              <input 
                type="email" 
                id="guidance-email" 
                placeholder="Enter email address"
                class="w-full p-3 border rounded-lg ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500'} focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 text-sm shadow-sm hover:shadow-md" 
              />
            </div>

            <!-- Password -->
            <div class="space-y-2">
              <label class="flex items-center text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'} mb-1">
                <div class="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-200 ${darkMode ? 'from-indigo-900/30 to-indigo-800/30' : ''} flex items-center justify-center mr-2">
                  <svg class="w-3 h-3 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                Password
              </label>
              <input 
                type="password" 
                id="guidance-password" 
                placeholder="Min. 6 characters"
                class="w-full p-3 border rounded-lg ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500'} focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 text-sm shadow-sm hover:shadow-md" 
              />
            </div>
          </div>

          <!-- Role Info -->
          <div class="p-3 bg-gradient-to-br from-indigo-50 to-indigo-100 ${darkMode ? 'from-indigo-900/20 to-indigo-800/20 border-indigo-700/30' : 'border-indigo-200'} rounded-lg border">
            <div class="flex items-center mb-2">
              <svg class="w-4 h-4 text-indigo-700 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="text-xs font-bold text-indigo-700">Role: Guidance Counselor</span>
            </div>
            <p class="text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}">Access to guidance dashboard & student management</p>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '✨ Create Account',
      cancelButtonText: 'Cancel',
      focusConfirm: false,
      preConfirm: () => {
        const fullName = (document.getElementById('guidance-fullname') as HTMLInputElement)?.value;
        const email = (document.getElementById('guidance-email') as HTMLInputElement)?.value;
        const password = (document.getElementById('guidance-password') as HTMLInputElement)?.value;

        if (!fullName || !email || !password) {
          Swal.showValidationMessage('Please fill in all fields');
          return false;
        }

        if (password.length < 6) {
          Swal.showValidationMessage('Password must be at least 6 characters long');
          return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          Swal.showValidationMessage('Please enter a valid email address');
          return false;
        }

        return { fullName, email, password };
      }
    });

    if (formValues) {
      let timeoutId: NodeJS.Timeout | null = null;
      
      try {
        // Show loading state with timeout
        Swal.fire({
          title: 'Creating Account...',
          html: `
            <div class="text-center space-y-6 p-4">
              <div class="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-[#800000]/10 to-red-100 ${darkMode ? 'from-[#800000]/20 to-red-900/20' : ''} rounded-2xl shadow-lg">
                <svg class="animate-spin w-12 h-12 text-[#800000]" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <div class="space-y-2">
                <h3 class="text-lg font-bold ${darkMode ? 'text-white' : 'text-[#800000]'}">Setting Up Account</h3>
                <p class="text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}">Creating guidance counselor account...</p>
                <div class="w-full bg-gray-200 ${darkMode ? 'bg-gray-700' : ''} rounded-full h-2 mt-4">
                  <div class="bg-gradient-to-r from-[#800000] to-red-600 h-2 rounded-full animate-pulse" style="width: 70%"></div>
                </div>
              </div>
            </div>
          `,
          showConfirmButton: false,
          allowOutsideClick: false,
          allowEscapeKey: false,
          background: darkMode ? '#1f2937' : '#ffffff',
          color: darkMode ? '#f3f4f6' : '#111827',
          customClass: {
            popup: `rounded-2xl shadow-2xl border-2 ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'}`
          }
        });

        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          Swal.close();
          throw new Error('Request timed out. Please try again.');
        }, 30000); // 30 second timeout

        // Create user with simplified approach
        console.log('Creating guidance user...');

        let authData;
        let authError;

        // Try regular signup with email confirmation disabled
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
          email: formValues.email,
          password: formValues.password,
          options: {
            emailRedirectTo: undefined,
            data: {
              full_name: formValues.fullName,
              role: 'guidance'
            }
          }
        });

        authData = signupData;
        authError = signupError;

        if (authError) {
          console.error('Auth error:', authError);
          
          // Check if it's a "User not allowed" error and provide better message
          if (authError.message.includes('not allowed') || authError.message.includes('Signups not allowed')) {
            throw new Error('User registration is currently disabled. Please contact your system administrator to enable signups or configure user creation permissions.');
          }
          
          throw new Error(authError.message);
        }

        if (!authData.user) {
          throw new Error('Failed to create user account');
        }

        console.log('User created successfully:', authData.user.id);

        // Create profile in the profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              user_id: authData.user.id,
              email: formValues.email,
              full_name: formValues.fullName,
              role: 'guidance',
              created_at: new Date().toISOString(),
              last_sign_in: new Date().toISOString()
            }
          ]);

        if (profileError) {
          console.error('Profile creation error:', profileError);
          
          // If profile creation fails due to RLS, provide helpful message
          if (profileError.message.includes('permission') || profileError.message.includes('policy')) {
            console.log('Profile creation blocked by RLS policy, but auth user exists');
            // Continue as the auth user was created successfully
          } else {
            console.log('Continuing despite profile error...');
          }
        } else {
          console.log('Profile created successfully');
        }

        // Clear timeout and close loading modal
        if (timeoutId) clearTimeout(timeoutId);
        Swal.close();

        // Show success message
        await Toast.fire({
          icon: 'success',
          title: 'Success!',
          text: `Guidance user ${formValues.fullName} created successfully`
        });

        // Call callback if provided
        if (onUserCreated) {
          onUserCreated();
        }

      } catch (error: any) {
        // Clear timeout and close loading modal
        if (timeoutId) clearTimeout(timeoutId);
        Swal.close();

        console.error('Error creating guidance user:', error);

        // Show error message
        await Toast.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'Failed to create guidance user'
        });
      }
    }
  };

  return (
    <button
      onClick={handleAddGuidanceUser}
      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
        darkMode ? 'bg-indigo-700 hover:bg-indigo-600 text-white' : 'bg-indigo-800 hover:bg-indigo-800 text-white'
      }`}
      aria-label="Add User"
    >
      <FaUserPlus className="text-xs" />
      Add User
    </button>
  );
}
