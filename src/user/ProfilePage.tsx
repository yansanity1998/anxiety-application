import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { 
  FaUser, 
  FaEnvelope, 
  FaSchool, 
  FaGraduationCap, 
  FaPhone, 
  FaHome, 
  FaUserFriends, 
  FaSave, 
  FaArrowLeft, 
  FaChevronDown, 
  FaSpinner,
  FaSignOutAlt,
  FaFire
} from 'react-icons/fa';
import Swal from 'sweetalert2';

const genders = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const yearLevelMap: { [key: string]: number } = {
  'First Year': 1,
  'Second Year': 2,
  'Third Year': 3,
  'Fourth Year': 4,
};

// Get the year level label from the value
const getYearLevelLabel = (value: number): string => {
  return Object.keys(yearLevelMap).find(key => yearLevelMap[key] === value) || '';
};

const getFireColor = (streak: number) => {
  if (streak >= 100) return 'text-yellow-400 drop-shadow-lg animate-pulse'; // Gold
  if (streak >= 60) return 'text-cyan-400 drop-shadow-lg animate-pulse'; // Cyan
  if (streak >= 50) return 'text-pink-500 drop-shadow-lg animate-pulse'; // Pink
  if (streak >= 30) return 'text-purple-500';
  if (streak >= 20) return 'text-blue-500';
  if (streak >= 10) return 'text-green-500';
  return 'text-orange-500';
};

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [school, setSchool] = useState('');
  const [course, setCourse] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhoneNumber, setGuardianPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  
  // Dropdown states
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showYearLevelDropdown, setShowYearLevelDropdown] = useState(false);

  // Toast notification setup
  const Toast = Swal.mixin({
    toast: true,
    position: 'top',
    showConfirmButton: false,
    timer: 2000,
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
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
  });

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/');
          return;
        }
        
        const userId = session.user.id;
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
          
        if (error) {
          console.error('Error fetching profile:', error);
          Toast.fire({
            icon: 'error',
            iconColor: '#ef4444',
            title: 'Error',
            text: 'Failed to load profile data',
          });
          navigate('/');
          return;
        }
        
        console.log('Fetched user profile data:', profile);
        setUserData(profile);
        
        // Populate form fields
        setFullName(profile.full_name || '');
        setAge(profile.age ? profile.age.toString() : '');
        setGender(profile.gender || '');
        setSchool(profile.school || '');
        setCourse(profile.course || '');
        setYearLevel(profile.year_level ? getYearLevelLabel(profile.year_level) : '');
        setPhoneNumber(profile.phone_number || '');
        setGuardianName(profile.guardian_name || '');
        setGuardianPhoneNumber(profile.guardian_phone_number || '');
        setAddress(profile.address || '');
        setEmail(profile.email || '');
        
      } catch (err) {
        console.error('Unexpected error fetching user data:', err);
        Toast.fire({
          icon: 'error',
          iconColor: '#ef4444',
          title: 'Error',
          text: 'An unexpected error occurred',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
        return;
      }
      
      console.log('Current userData state:', userData);
      console.log('User session ID:', session.user.id);
      
      const yearLevelNumber = yearLevelMap[yearLevel];
      
      // First, let's update the user metadata in auth.users
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          name: fullName,
          age: age ? parseInt(age) : null,
          gender,
          school,
          course,
          year_level: yearLevelNumber,
          phone_number: phoneNumber,
          guardian_name: guardianName,
          guardian_phone_number: guardianPhoneNumber,
          address
        }
      });
      
      if (metadataError) {
        console.error('Error updating user metadata:', metadataError);
        Toast.fire({
          icon: 'error',
          iconColor: '#ef4444',
          title: 'Update Failed',
          text: metadataError.message,
        });
        return;
      }
      
      // Use the update_profile_by_id RPC function instead of directly updating the profiles table
      console.log('Updating profile with ID:', userData.id, {
        fullName,
        age: age && age !== '' ? parseInt(age) : null,
        gender,
        school,
        course,
        yearLevel: yearLevelNumber,
        phoneNumber,
        guardianName,
        guardianPhoneNumber,
        address
      });
      
      // Directly update the profiles table
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          age: age && age !== '' ? parseInt(age) : null,
          gender,
          school,
          course,
          year_level: yearLevelNumber,
          phone_number: phoneNumber,
          guardian_name: guardianName,
          guardian_phone_number: guardianPhoneNumber,
          address
        })
        .eq('id', userData.id);
        
      if (error) {
        console.error('Error updating profile:', error);
        Toast.fire({
          icon: 'error',
          iconColor: '#ef4444',
          title: 'Update Failed',
          text: error.message,
        });
        return;
      }
      
      console.log('Profile updated successfully');
      
      // Fetch the updated profile data
      const { data: updatedProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
        
      if (fetchError) {
        console.error('Error fetching updated profile:', fetchError);
      } else {
        console.log('Fetched updated profile:', updatedProfile);
        // Update local state with the fresh data
        setUserData(updatedProfile);
      }
      
      Toast.fire({
        icon: 'success',
        iconColor: '#10b981',
        title: 'Profile Updated',
        text: 'Your profile has been successfully updated',
      });
      
      // Redirect to dashboard to see changes
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (err) {
      console.error('Unexpected error updating profile:', err);
      Toast.fire({
        icon: 'error',
        iconColor: '#ef4444',
        title: 'Error',
        text: 'An unexpected error occurred',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const goBack = () => {
    navigate(-1);
  };

  // Sign out handler
  const handleSignOut = async () => {
    const result = await Swal.fire({
      title: 'Sign Out?',
      text: 'Are you sure you want to sign out?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, sign out',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      background: '#f8fafc',
      width: '320px',
      customClass: {
        popup: 'rounded-xl',
        title: 'text-base font-semibold',
        htmlContainer: 'text-xs',
        confirmButton: 'bg-red-500 text-white rounded-lg px-4 py-2 text-sm',
        cancelButton: 'bg-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm',
      },
    });
    if (result.isConfirmed) {
      try {
        await supabase.auth.signOut();
        navigate('/login');
      } catch (err) {
        console.error('Error signing out:', err);
        Toast.fire({
          icon: 'error',
          iconColor: '#ef4444',
          title: 'Sign Out Failed',
          text: 'Could not sign out. Please try again.',
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="flex flex-col items-center">
          <FaSpinner className="animate-spin text-3xl text-blue-500 mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-20">
      {/* Header */}
      <motion.div 
        className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={goBack}
                className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <FaArrowLeft className="text-gray-600" />
              </button>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Your Profile
              </h1>
            </div>
            <button
              onClick={handleSignOut}
              className="ml-4 p-2 rounded-full hover:bg-red-50 transition-colors border border-red-200 text-red-500 flex items-center gap-2"
              title="Sign Out"
            >
              <FaSignOutAlt className="text-lg" />
              <span className="hidden sm:inline text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="px-4 py-6">
        <motion.div
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl">
              {fullName ? fullName.charAt(0).toUpperCase() : <FaUser />}
            </div>
          </div>

          {userData && (
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3">
                <FaFire className={`${getFireColor(userData.streak || 0)} text-2xl`} title={
                  userData.streak >= 100 ? '🔥 100+ Day Streak! Legendary!' :
                  userData.streak >= 60 ? '🔥 60+ Day Streak! Incredible!' :
                  userData.streak >= 50 ? '🔥 50+ Day Streak! Amazing!' :
                  userData.streak >= 30 ? '🔥 30+ Day Streak! Awesome!' :
                  userData.streak >= 20 ? '🔥 20+ Day Streak! Great job!' :
                  userData.streak >= 10 ? '🔥 10+ Day Streak! Keep going!' :
                  '🔥 Keep your streak alive!'
                } />
                <span className="font-bold text-lg">Streak:</span>
                <span className={`text-2xl font-extrabold ${getFireColor(userData.streak || 0)}`}>{userData.streak || 0} days</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personal Information */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                Personal Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                    <FaUser className="inline mr-2 text-blue-500" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent transition duration-200 bg-gray-50/50 backdrop-blur-sm"
                    placeholder="Your full name"
                    required
                  />
                </div>

                {/* Email (read-only) */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    <FaEnvelope className="inline mr-2 text-blue-500" />
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    className="block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm bg-gray-100 text-gray-500"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                
                {/* Age */}
                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    id="age"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent transition duration-200 bg-gray-50/50 backdrop-blur-sm"
                    placeholder="Your age"
                    min="1"
                  />
                </div>

                {/* Gender */}
                <div className="relative">
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <div
                    className="block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent transition duration-200 bg-gray-50/50 backdrop-blur-sm cursor-pointer flex justify-between items-center"
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
                          className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
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
            </div>

            {/* Academic Information */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                Academic Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* School */}
                <div>
                  <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-1">
                    <FaSchool className="inline mr-2 text-blue-500" />
                    School
                  </label>
                  <input
                    type="text"
                    id="school"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent transition duration-200 bg-gray-50/50 backdrop-blur-sm"
                    placeholder="Your school/university"
                  />
                </div>

                {/* Course */}
                <div>
                  <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-1">
                    <FaGraduationCap className="inline mr-2 text-blue-500" />
                    Course
                  </label>
                  <input
                    type="text"
                    id="course"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent transition duration-200 bg-gray-50/50 backdrop-blur-sm"
                    placeholder="Your course"
                  />
                </div>

                {/* Year Level */}
                <div className="relative">
                  <label htmlFor="yearLevel" className="block text-sm font-medium text-gray-700 mb-1">
                    Year Level
                  </label>
                  <div
                    className="block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent transition duration-200 bg-gray-50/50 backdrop-blur-sm cursor-pointer flex justify-between items-center"
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
                          className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
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
            </div>

            {/* Contact Information */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                Contact Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Phone Number */}
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    <FaPhone className="inline mr-2 text-blue-500" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent transition duration-200 bg-gray-50/50 backdrop-blur-sm"
                    placeholder="Your phone number"
                  />
                </div>

                {/* Address */}
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    <FaHome className="inline mr-2 text-blue-500" />
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent transition duration-200 bg-gray-50/50 backdrop-blur-sm"
                    placeholder="Your address"
                  />
                </div>
              </div>
            </div>

            {/* Guardian Information */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                Guardian Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Guardian Name */}
                <div>
                  <label htmlFor="guardianName" className="block text-sm font-medium text-gray-700 mb-1">
                    <FaUserFriends className="inline mr-2 text-blue-500" />
                    Guardian Name
                  </label>
                  <input
                    type="text"
                    id="guardianName"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent transition duration-200 bg-gray-50/50 backdrop-blur-sm"
                    placeholder="Guardian's name"
                  />
                </div>

                {/* Guardian Phone Number */}
                <div>
                  <label htmlFor="guardianPhoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    <FaPhone className="inline mr-2 text-blue-500" />
                    Guardian Phone
                  </label>
                  <input
                    type="tel"
                    id="guardianPhoneNumber"
                    value={guardianPhoneNumber}
                    onChange={(e) => setGuardianPhoneNumber(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent transition duration-200 bg-gray-50/50 backdrop-blur-sm"
                    placeholder="Guardian's phone number"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <motion.button
                type="submit"
                disabled={isSaving}
                className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-70"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isSaving ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    Save Changes
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage; 