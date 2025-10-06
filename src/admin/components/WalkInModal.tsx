import React, { useState, useEffect } from 'react';
import { FaSearch, FaUser, FaCalendarAlt, FaClock, FaTimes, FaWalking } from 'react-icons/fa';
import { createAppointment } from '../../lib/appointmentService';
import { supabase } from '../../lib/supabase';

interface Student {
  id: string;
  full_name: string;
  email: string;
  student_id: string;
}

interface WalkInModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  onAppointmentCreated: () => void;
}

const WalkInModal: React.FC<WalkInModalProps> = ({ isOpen, onClose, darkMode, onAppointmentCreated }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [appointmentTime, setAppointmentTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get current date and time
  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  useEffect(() => {
    if (isOpen) {
      fetchStudents();
      setAppointmentTime(getCurrentTime());
    }
  }, [isOpen]);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, id_number')
        .eq('role', 'student')
        .eq('is_verified', true)
        .order('full_name');

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData = (data || []).map(student => ({
        id: student.id.toString(),
        full_name: student.full_name || 'No Name',
        email: student.email || '',
        student_id: student.id_number || 'No ID'
      }));
      
      setStudents(transformedData);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !appointmentTime) return;

    setIsSubmitting(true);
    try {
      await createAppointment({
        profile_id: parseInt(selectedStudent.id),
        student_name: selectedStudent.full_name,
        student_email: selectedStudent.email,
        appointment_date: getCurrentDate(),
        appointment_time: appointmentTime,
        notes: notes || 'Walk-in appointment',
        status: 'In Progress'
      });

      onAppointmentCreated();
      handleClose();
      
      // Show success alert
      showAlert('success', 'Walk-in Scheduled!', `Appointment created for ${selectedStudent.full_name}`);
    } catch (error) {
      console.error('Error creating walk-in appointment:', error);
      showAlert('error', 'Error', 'Failed to create walk-in appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedStudent(null);
    setSearchTerm('');
    setNotes('');
    setAppointmentTime(getCurrentTime());
    onClose();
  };

  const showAlert = (type: 'success' | 'error', title: string, message: string) => {
    const colors = {
      success: { border: 'border-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-500' },
      error: { border: 'border-red-500', bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-500' }
    };
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `fixed top-4 right-4 z-50 bg-white border-l-4 ${colors[type].border} rounded-lg shadow-lg p-4 max-w-sm transform transition-all duration-300 ease-in-out`;
    alertDiv.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 ${colors[type].icon}" fill="currentColor" viewBox="0 0 20 20">
            ${type === 'success' ? 
              '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>' :
              '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>'
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

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-md h-[600px] flex flex-col rounded-2xl shadow-2xl border overflow-hidden ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        {/* Header */}
        <div className={`px-4 py-3 border-b ${
          darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50/50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#800000]/10 to-[#800000]/20">
                <FaWalking className="text-xl text-[#800000]" />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Walk-in Appointment
                </h2>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Schedule an immediate appointment for a student
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
              }`}
            >
              <FaTimes className="text-lg" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <form onSubmit={handleSubmit} className="space-y-4 h-full">
            {/* Student Search */}
            <div>
              <label className={`flex items-center gap-2 mb-2 text-sm font-medium ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                <FaSearch className="text-[#800000]" />
                Search Student
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, email, or student ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border transition-all ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-[#800000] focus:ring-2 focus:ring-[#800000]/20' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#800000] focus:ring-2 focus:ring-[#800000]/20'
                  } focus:outline-none`}
                />
                <FaSearch className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                  darkMode ? 'text-gray-400' : 'text-gray-400'
                }`} />
              </div>
            </div>

            {/* Student Results */}
            {searchTerm && (
              <div className={`h-32 overflow-y-auto rounded-lg border ${
                darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
              }`}>
                {isLoading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#800000] mx-auto"></div>
                    <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Loading students...
                    </p>
                  </div>
                ) : filteredStudents.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {filteredStudents.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => {
                          setSelectedStudent(student);
                          setSearchTerm(student.full_name);
                        }}
                        className={`w-full p-3 text-left hover:bg-gray-100 transition-colors ${
                          selectedStudent?.id === student.id 
                            ? 'bg-[#800000]/10 border-l-4 border-[#800000]' 
                            : ''
                        } ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-[#800000]/10">
                            <FaUser className="text-[#800000] text-sm" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium truncate ${
                              darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {student.full_name}
                            </p>
                            <p className={`text-sm truncate ${
                              darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {student.email} • ID: {student.student_id}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      No students found matching "{searchTerm}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Selected Student */}
            {selectedStudent && (
              <div className={`p-4 rounded-lg border-2 border-[#800000]/20 bg-gradient-to-r ${
                darkMode 
                  ? 'from-[#800000]/5 to-[#800000]/10' 
                  : 'from-[#800000]/5 to-[#800000]/10'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#800000]/20">
                    <FaUser className="text-[#800000]" />
                  </div>
                  <div>
                    <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedStudent.full_name}
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {selectedStudent.email} • ID: {selectedStudent.student_id}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Appointment Details */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className={`flex items-center gap-2 mb-2 text-sm font-medium ${
                  darkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  <FaCalendarAlt className="text-[#800000]" />
                  Date
                </label>
                <input
                  type="text"
                  value={getCurrentDate()}
                  disabled
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-600 border-gray-500 text-gray-300' 
                      : 'bg-gray-100 border-gray-300 text-gray-600'
                  } cursor-not-allowed`}
                />
                <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Today's date (walk-in appointments are for today only)
                </p>
              </div>

              <div>
                <label className={`flex items-center gap-2 mb-2 text-sm font-medium ${
                  darkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  <FaClock className="text-[#800000]" />
                  Time
                </label>
                <input
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  required
                  className={`w-full px-3 py-2 rounded-lg border transition-all ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-[#800000] focus:ring-2 focus:ring-[#800000]/20' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-[#800000] focus:ring-2 focus:ring-[#800000]/20'
                  } focus:outline-none`}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className={`flex items-center gap-2 mb-2 text-sm font-medium ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                <svg className="w-4 h-4 text-[#800000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add any notes about this walk-in appointment..."
                className={`w-full px-3 py-2 rounded-lg border transition-all resize-y ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-[#800000] focus:ring-2 focus:ring-[#800000]/20' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#800000] focus:ring-2 focus:ring-[#800000]/20'
                } focus:outline-none`}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedStudent || !appointmentTime || isSubmitting}
                className={`flex-1 px-4 py-3 rounded-lg font-medium text-white transition-all ${
                  !selectedStudent || !appointmentTime || isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-[#800000] hover:bg-[#660000] hover:shadow-lg transform hover:scale-105'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <FaWalking />
                    Create Walk-in
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WalkInModal;
