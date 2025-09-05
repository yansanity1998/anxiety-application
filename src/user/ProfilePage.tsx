import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { realtimeService } from '../lib/realtimeService';
import { 
  FaUser, 
  FaEnvelope, 
  FaGraduationCap, 
  FaPhone,  
  FaUserFriends, 
  FaSave, 
  FaArrowLeft, 
  FaChevronDown, 
  FaSpinner,
  FaFire,
  FaEdit,
  FaCamera,
  FaTrophy,
  FaCalendar
} from 'react-icons/fa';

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
  const [isEditing, setIsEditing] = useState(false);
  
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

  // Modern alert function
  const showAlert = (type: 'success' | 'error' | 'warning', title: string, message: string) => {
    const colors = {
      success: { border: 'border-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-500' },
      error: { border: 'border-red-500', bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-500' },
      warning: { border: 'border-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700', icon: 'text-yellow-500' }
    };
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `fixed top-4 right-4 z-50 bg-white border-l-4 ${colors[type].border} rounded-lg shadow-lg p-4 max-w-sm transform transition-all duration-300 ease-in-out`;
    alertDiv.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 ${colors[type].icon}" fill="currentColor" viewBox="0 0 20 20">
            ${type === 'success' ? 
              '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>' :
              type === 'error' ?
              '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>' :
              '<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>'
            }
          </svg>
        </div>
        <div class="ml-3 flex-1">
          <p class="text-sm font-medium text-gray-900">${title}</p>
          <p class="text-xs text-gray-500 mt-1">${message}</p>
        </div>
        <div class="ml-auto pl-3">
          <button type="button" class="inline-flex bg-white rounded-md p-1.5 text-gray-400 hover:text-gray-500 focus:outline-none" onclick="this.closest('div').remove()">
            <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 4000);
  };

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
          showAlert('error', 'Error', 'Failed to load profile data');
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
        showAlert('error', 'Error', 'An unexpected error occurred');
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
        showAlert('error', 'Update Failed', metadataError.message);
        return;
      }
      
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
        showAlert('error', 'Update Failed', error.message);
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
        setUserData(updatedProfile);
        
        // Broadcast the profile update for real-time synchronization
        realtimeService.broadcastProfileUpdate(updatedProfile);
      }
      
      showAlert('success', 'Profile Updated', 'Your profile has been successfully updated');
      setIsEditing(false);
      
    } catch (err) {
      console.error('Unexpected error updating profile:', err);
      showAlert('error', 'Error', 'An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const goBack = () => {
    navigate(-1);
  };


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#800000] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Modern Header */}
      <motion.div 
        className="bg-white/90 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-10"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="px-4 py-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center space-x-4">
              <button 
                onClick={goBack}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <FaArrowLeft className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-[#800000]">Profile Settings</h1>
                <p className="text-sm text-gray-500">Manage your personal information</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
                  isEditing 
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                    : 'bg-[#800000] text-white hover:bg-[#660000]'
                }`}
              >
                <FaEdit className="text-sm" />
                <span>{isEditing ? 'Cancel' : 'Edit'}</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="px-4 py-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Profile Card */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 sticky top-24">
              {/* Profile Picture */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="w-24 h-24 bg-gradient-to-br from-[#800000] to-[#a00000] rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                    {fullName ? fullName.charAt(0).toUpperCase() : <FaUser />}
                  </div>
                  <button className="absolute -bottom-1 -right-1 bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <FaCamera className="text-gray-500 text-sm" />
                  </button>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mt-4">{fullName || 'Your Name'}</h2>
                <p className="text-gray-500 text-sm">{email}</p>
              </div>

              {/* Streak Display */}
              {userData && (
                <div className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-xl p-4 mb-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Current Streak</p>
                      <p className="text-2xl font-bold">{userData.streak || 0} days</p>
                    </div>
                    <FaFire className={`text-3xl ${getFireColor(userData.streak || 0)}`} />
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <FaCalendar className="text-[#800000]" />
                    <span className="text-sm font-medium">Member Since</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {userData?.created_at ? new Date(userData.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <FaTrophy className="text-[#800000]" />
                    <span className="text-sm font-medium">Role</span>
                  </div>
                  <span className="text-xs text-gray-500 capitalize">{userData?.role || 'Student'}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Form Section */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <form onSubmit={handleSubmit} className="p-6">
                
                {/* Personal Information */}
                <div className="mb-8">
                  <div className="flex items-center space-x-2 mb-6">
                    <div className="p-2 bg-[#800000]/10 rounded-lg">
                      <FaUser className="text-[#800000]" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000] transition-all ${
                          !isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
                        }`}
                        placeholder="Enter your full name"
                      />
                    </div>

                    {/* Email (read-only) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <div className="relative">
                        <input
                          type="email"
                          value={email}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600"
                          readOnly
                        />
                        <div className="absolute right-3 top-3">
                          <FaEnvelope className="text-gray-400" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                    
                    {/* Age */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                      <input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000] transition-all ${
                          !isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
                        }`}
                        placeholder="Enter your age"
                        min="1"
                      />
                    </div>

                    {/* Gender */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                      <div
                        className={`w-full px-4 py-3 border border-gray-200 rounded-xl cursor-pointer flex justify-between items-center transition-all ${
                          !isEditing 
                            ? 'bg-gray-50 text-gray-600 cursor-not-allowed' 
                            : 'bg-white hover:border-[#800000] focus:ring-2 focus:ring-[#800000]/20'
                        }`}
                        onClick={() => isEditing && setShowGenderDropdown(!showGenderDropdown)}
                      >
                        <span>{gender || 'Select gender'}</span>
                        <FaChevronDown className={`text-gray-400 transition-transform ${showGenderDropdown ? 'rotate-180' : ''}`} />
                      </div>
                      <AnimatePresence>
                        {showGenderDropdown && isEditing && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
                          >
                            {genders.map((g) => (
                              <div
                                key={g}
                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                                onClick={() => {
                                  setGender(g);
                                  setShowGenderDropdown(false);
                                }}
                              >
                                {g}
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Academic Information */}
                <div className="mb-8">
                  <div className="flex items-center space-x-2 mb-6">
                    <div className="p-2 bg-[#800000]/10 rounded-lg">
                      <FaGraduationCap className="text-[#800000]" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Academic Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* School */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">School/University</label>
                      <input
                        type="text"
                        value={school}
                        onChange={(e) => setSchool(e.target.value)}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000] transition-all ${
                          !isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
                        }`}
                        placeholder="Enter your school or university"
                      />
                    </div>

                    {/* Course */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Course/Program</label>
                      <input
                        type="text"
                        value={course}
                        onChange={(e) => setCourse(e.target.value)}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000] transition-all ${
                          !isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
                        }`}
                        placeholder="Enter your course"
                      />
                    </div>

                    {/* Year Level */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Year Level</label>
                      <div
                        className={`w-full px-4 py-3 border border-gray-200 rounded-xl cursor-pointer flex justify-between items-center transition-all ${
                          !isEditing 
                            ? 'bg-gray-50 text-gray-600 cursor-not-allowed' 
                            : 'bg-white hover:border-[#800000] focus:ring-2 focus:ring-[#800000]/20'
                        }`}
                        onClick={() => isEditing && setShowYearLevelDropdown(!showYearLevelDropdown)}
                      >
                        <span>{yearLevel || 'Select year level'}</span>
                        <FaChevronDown className={`text-gray-400 transition-transform ${showYearLevelDropdown ? 'rotate-180' : ''}`} />
                      </div>
                      <AnimatePresence>
                        {showYearLevelDropdown && isEditing && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
                          >
                            {Object.keys(yearLevelMap).map((level) => (
                              <div
                                key={level}
                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                                onClick={() => {
                                  setYearLevel(level);
                                  setShowYearLevelDropdown(false);
                                }}
                              >
                                {level}
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="mb-8">
                  <div className="flex items-center space-x-2 mb-6">
                    <div className="p-2 bg-[#800000]/10 rounded-lg">
                      <FaPhone className="text-[#800000]" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Phone Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000] transition-all ${
                          !isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
                        }`}
                        placeholder="Enter your phone number"
                      />
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000] transition-all ${
                          !isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
                        }`}
                        placeholder="Enter your address"
                      />
                    </div>
                  </div>
                </div>

                {/* Guardian Information */}
                <div className="mb-8">
                  <div className="flex items-center space-x-2 mb-6">
                    <div className="p-2 bg-[#800000]/10 rounded-lg">
                      <FaUserFriends className="text-[#800000]" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Guardian Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Guardian Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Guardian Name</label>
                      <input
                        type="text"
                        value={guardianName}
                        onChange={(e) => setGuardianName(e.target.value)}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000] transition-all ${
                          !isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
                        }`}
                        placeholder="Enter guardian's name"
                      />
                    </div>

                    {/* Guardian Phone Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Guardian Phone</label>
                      <input
                        type="tel"
                        value={guardianPhoneNumber}
                        onChange={(e) => setGuardianPhoneNumber(e.target.value)}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000] transition-all ${
                          !isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
                        }`}
                        placeholder="Enter guardian's phone"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <AnimatePresence>
                  {isEditing && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="flex justify-end space-x-3"
                    >
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <motion.button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center space-x-2 px-6 py-3 bg-[#800000] text-white font-medium rounded-xl shadow-lg hover:bg-[#660000] transition-all duration-200 disabled:opacity-70"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isSaving ? (
                          <>
                            <FaSpinner className="animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <FaSave />
                            <span>Save Changes</span>
                          </>
                        )}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 