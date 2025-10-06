import React, { useState, useEffect } from 'react';
import { FaHistory, FaCalendarAlt, FaClock, FaCheckCircle, FaHourglassHalf, FaCalendarTimes, FaUserTimes, FaChevronDown, FaWalking, FaSearch, FaFilter, FaUser, FaUsers, FaEnvelope, FaTrash, FaEdit } from 'react-icons/fa';
import { getAppointmentsByProfileId, getStudentsWithAppointments, updateAppointment, deleteAppointment } from '../../lib/appointmentService';
import type { Appointment } from '../../lib/appointmentService';

interface ScheduleHistoryProps {
  darkMode: boolean;
  selectedStudentId?: number;
  selectedStudentName?: string;
  onAppointmentUpdate?: () => void;
  refreshTrigger?: number; // Add trigger to force refresh from parent
}

// Modern gradient-based status colors aligned with anxiety level system
const statusColors: Record<string, string> = {
  'Scheduled': 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border-blue-200 shadow-blue-100/50',
  'In Progress': 'bg-gradient-to-r from-amber-50 to-yellow-100 text-amber-800 border-amber-200 shadow-amber-100/50',
  'Completed': 'bg-gradient-to-r from-emerald-50 to-green-100 text-emerald-800 border-emerald-200 shadow-emerald-100/50',
  'Canceled': 'bg-gradient-to-r from-red-50 to-red-100 text-red-800 border-red-200 shadow-red-100/50',
  'No Show': 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border-gray-200 shadow-gray-100/50',
};

const statusColorsDark: Record<string, string> = {
  'Scheduled': 'bg-gradient-to-r from-blue-900/20 to-blue-800/30 text-blue-300 border-blue-600/30 shadow-blue-900/20',
  'In Progress': 'bg-gradient-to-r from-amber-900/20 to-amber-800/30 text-amber-300 border-amber-600/30 shadow-amber-900/20',
  'Completed': 'bg-gradient-to-r from-emerald-900/20 to-emerald-800/30 text-emerald-300 border-emerald-600/30 shadow-emerald-900/20',
  'Canceled': 'bg-gradient-to-r from-red-900/20 to-red-800/30 text-red-300 border-red-600/30 shadow-red-900/20',
  'No Show': 'bg-gradient-to-r from-gray-800/20 to-gray-700/30 text-gray-300 border-gray-600/30 shadow-gray-800/20',
};

const statusIcons: Record<string, React.ReactNode> = {
  'Scheduled': <FaCalendarAlt className="text-xs" />,
  'In Progress': <FaHourglassHalf className="text-xs" />,
  'Completed': <FaCheckCircle className="text-xs" />,
  'Canceled': <FaCalendarTimes className="text-xs" />,
  'No Show': <FaUserTimes className="text-xs" />,
};

// Helper function to format date in user-friendly format
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
  };
  return date.toLocaleDateString('en-US', options);
};

// Helper function to get relative time
const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
};

const ScheduleHistory: React.FC<ScheduleHistoryProps> = ({ darkMode, selectedStudentId, selectedStudentName, onAppointmentUpdate, refreshTrigger }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [students, setStudents] = useState<{profile_id: number, student_name: string, student_email: string, appointment_count: number}[]>([]);
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [currentSelectedId, setCurrentSelectedId] = useState<number | null>(selectedStudentId || null);
  const [currentSelectedName, setCurrentSelectedName] = useState<string>(selectedStudentName || '');
  const [expandedAppointment, setExpandedAppointment] = useState<number | null>(null);

  useEffect(() => {
    fetchAllStudents();
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      setCurrentSelectedId(selectedStudentId);
      setCurrentSelectedName(selectedStudentName || '');
      fetchStudentHistory(selectedStudentId);
    }
  }, [selectedStudentId, selectedStudentName]);

  // Refresh history when parent triggers update
  useEffect(() => {
    if (refreshTrigger && currentSelectedId) {
      fetchStudentHistory();
      fetchAllStudents(); // Also refresh student list to update counts
    }
  }, [refreshTrigger, currentSelectedId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (expandedAppointment !== null && !target.closest('.relative')) {
        setExpandedAppointment(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [expandedAppointment]);

  const fetchAllStudents = async () => {
    setStudentsLoading(true);
    try {
      const data = await getStudentsWithAppointments();
      setStudents(data);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchStudentHistory = async (studentId?: number) => {
    const idToUse = studentId || currentSelectedId;
    if (!idToUse) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await getAppointmentsByProfileId(idToUse);
      // Sort by date descending (most recent first)
      const sortedData = data.sort((a, b) => {
        const dateA = new Date(`${a.appointment_date}T${a.appointment_time}`);
        const dateB = new Date(`${b.appointment_date}T${b.appointment_time}`);
        return dateB.getTime() - dateA.getTime();
      });
      setAppointments(sortedData);
    } catch (err) {
      console.error('Error fetching student appointment history:', err);
      setError('Failed to load appointment history');
    } finally {
      setLoading(false);
    }
  };

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

  const handleEditAppointment = async (appointment: Appointment) => {
    try {
      const formValues = await new Promise<{date: string, time: string, notes: string} | null>((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
          <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200">
            <div class="p-5">
              <div class="flex items-center gap-4 mb-5">
                <div class="p-3 rounded-lg bg-gradient-to-br from-[#800000]/10 to-[#800000]/20">
                  <svg class="w-6 h-6 text-[#800000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="text-lg font-semibold text-gray-900">Edit Appointment</h3>
                  <p class="text-sm text-gray-500">${appointment.student_name}</p>
                </div>
                <button 
                  id="cancelBtn"
                  class="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div class="space-y-4">
                <div>
                  <label class="flex items-center gap-2 mb-1.5">
                    <svg class="w-4 h-4 text-[#800000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span class="text-xs font-medium text-gray-700">Appointment Date</span>
                  </label>
                  <input 
                    type="date" 
                    id="edit-date" 
                    value="${appointment.appointment_date}"
                    min="${new Date().toISOString().split('T')[0]}"
                    class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000]"
                  />
                </div>

                <div>
                  <label class="flex items-center gap-2 mb-1.5">
                    <svg class="w-4 h-4 text-[#800000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span class="text-xs font-medium text-gray-700">Appointment Time</span>
                  </label>
                  <input 
                    type="time" 
                    id="edit-time" 
                    value="${appointment.appointment_time}"
                    class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000]"
                  />
                </div>

                <div>
                  <label class="flex items-center gap-2 mb-1.5">
                    <svg class="w-4 h-4 text-[#800000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span class="text-xs font-medium text-gray-700">Notes (Optional)</span>
                  </label>
                  <textarea 
                    id="edit-notes" 
                    rows="2"
                    class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000] resize-y"
                    placeholder="Add any notes or special instructions..."
                  >${appointment.notes || ''}</textarea>
                </div>
              </div>

              <div class="flex gap-2 mt-5">
                <button 
                  id="cancelBtn2"
                  class="flex-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  id="confirmBtn"
                  class="flex-1 px-3 py-1.5 bg-[#800000] hover:bg-[#660000] text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        `;
        
        document.body.appendChild(modal);
        
        const cancelBtn = modal.querySelector('#cancelBtn');
        const cancelBtn2 = modal.querySelector('#cancelBtn2');
        const confirmBtn = modal.querySelector('#confirmBtn');
        
        const closeModal = () => {
          modal.remove();
          resolve(null);
        };

        cancelBtn?.addEventListener('click', closeModal);
        cancelBtn2?.addEventListener('click', closeModal);
        
        confirmBtn?.addEventListener('click', () => {
          const date = (modal.querySelector('#edit-date') as HTMLInputElement)?.value;
          const time = (modal.querySelector('#edit-time') as HTMLInputElement)?.value;
          const notes = (modal.querySelector('#edit-notes') as HTMLTextAreaElement)?.value;
          
          if (!date || !time) {
            showAlert('warning', 'Missing Information', 'Please select both date and time');
            return;
          }
          
          modal.remove();
          resolve({ date, time, notes });
        });
        
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.remove();
            resolve(null);
          }
        });
      });

      if (formValues) {
        try {
          await updateAppointment(appointment.id, {
            appointment_date: formValues.date,
            appointment_time: formValues.time,
            notes: formValues.notes
          });

          // Refresh the student's appointments
          fetchStudentHistory();
          // Update main appointments list
          onAppointmentUpdate?.();
          showAlert('success', 'Updated!', 'Appointment has been updated successfully.');
        } catch (error) {
          console.error('Error updating appointment:', error);
          showAlert('error', 'Error', 'Failed to update appointment. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error editing appointment:', error);
      showAlert('error', 'Error', 'Failed to edit appointment.');
    }
  };

  const handleDeleteAppointment = async (appointment: Appointment) => {
    const confirmed = await new Promise<boolean>((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-white/20 backdrop-blur-md flex items-center justify-center z-50 p-4';
      modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 border border-red-200">
          <div class="p-6">
            <div class="text-center space-y-4">
              <div class="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-3">
                <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 class="text-lg font-bold text-gray-900">Delete Appointment?</h3>
              <p class="text-gray-600">Are you sure you want to delete this appointment?</p>
              <div class="bg-red-50 p-4 rounded-xl border border-red-200">
                <p class="font-semibold text-red-800 text-lg">${appointment.student_name}</p>
                <p class="text-sm text-red-600">${formatDate(appointment.appointment_date)} at ${appointment.appointment_time}</p>
              </div>
              <p class="text-sm text-gray-500">This action cannot be undone.</p>
              <div class="flex space-x-3 mt-6">
                <button id="cancelBtn" class="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-medium hover:bg-gray-200 transition-colors">Cancel</button>
                <button id="confirmBtn" class="flex-1 bg-red-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-600 transition-colors">Yes, delete it!</button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      const cancelBtn = modal.querySelector('#cancelBtn');
      const confirmBtn = modal.querySelector('#confirmBtn');
      
      cancelBtn?.addEventListener('click', () => {
        modal.remove();
        resolve(false);
      });
      confirmBtn?.addEventListener('click', () => {
        modal.remove();
        resolve(true);
      });
      
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
          resolve(false);
        }
      });
    });

    if (confirmed) {
      try {
        await deleteAppointment(appointment.id);
        // Refresh the student's appointments and student list
        fetchStudentHistory();
        fetchAllStudents();
        // Update main appointments list
        onAppointmentUpdate?.();
        showAlert('success', 'Deleted!', 'Appointment has been deleted successfully.');
      } catch (error) {
        console.error('Error deleting appointment:', error);
        showAlert('error', 'Error', 'Failed to delete appointment. Please try again.');
      }
    }
  };

  const handleStatusUpdate = async (appointmentId: number, newStatus: Appointment['status']) => {
    try {
      // Find the current appointment to preserve its notes
      const currentAppointment = appointments.find(app => app.id === appointmentId);
      
      await updateAppointment(appointmentId, { 
        status: newStatus,
        notes: currentAppointment?.notes // Preserve existing notes including walk-in indicator
      });
      
      // Refresh the student's appointments
      fetchStudentHistory();
      setExpandedAppointment(null);
      // Update main appointments list
      onAppointmentUpdate?.();
      showAlert('success', 'Status Updated!', `Appointment status changed to ${newStatus}.`);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      showAlert('error', 'Error', 'Failed to update appointment status');
    }
  };

  // Filter appointments based on status and search term
  const filteredAppointments = appointments.filter(appointment => {
    const matchesStatus = filterStatus === 'all' || appointment.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      appointment.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatDate(appointment.appointment_date).toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // Get statistics
  const stats = {
    total: appointments.length,
    scheduled: appointments.filter(a => a.status === 'Scheduled').length,
    inProgress: appointments.filter(a => a.status === 'In Progress').length,
    completed: appointments.filter(a => a.status === 'Completed').length,
    canceled: appointments.filter(a => a.status === 'Canceled').length,
    noShow: appointments.filter(a => a.status === 'No Show').length,
  };

  const handleStudentSelect = (student: {profile_id: number, student_name: string, student_email: string, appointment_count: number}) => {
    setCurrentSelectedId(student.profile_id);
    setCurrentSelectedName(student.student_name);
    fetchStudentHistory(student.profile_id);
  };

  // Filter students based on search term
  const filteredStudents = students.filter(student => 
    student.student_name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    student.student_email.toLowerCase().includes(studentSearchTerm.toLowerCase())
  );

  if (!currentSelectedId) {
    return (
      <div id="schedule-history-section" className={`mt-6 rounded-2xl shadow-2xl backdrop-blur-sm border overflow-hidden transition-all duration-300 hover:shadow-3xl ${
        darkMode 
          ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/50' 
          : 'bg-gradient-to-br from-white/90 to-gray-50/90 border-gray-200/50'
      }`}>
        {/* Modern Header with Gradient */}
        <div className={`p-6 border-b backdrop-blur-sm ${
          darkMode 
            ? 'border-gray-700/50 bg-gradient-to-r from-purple-900/20 to-indigo-900/20' 
            : 'border-gray-200/50 bg-gradient-to-r from-purple-50/50 to-indigo-50/50'
        }`}>
          <div className="flex items-center gap-4 mb-6">
            <div className={`p-4 rounded-2xl shadow-lg transition-all duration-300 hover:scale-110 ${
              darkMode 
                ? 'bg-gradient-to-br from-purple-600/30 to-indigo-600/30 shadow-purple-900/20' 
                : 'bg-gradient-to-br from-purple-100 to-indigo-100 shadow-purple-200/50'
            }`}>
              <FaUsers className={`text-3xl ${darkMode ? 'text-purple-300' : 'text-purple-600'}`} />
            </div>
            <div className="flex-1">
              <h3 className={`text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${
                darkMode 
                  ? 'from-purple-300 to-indigo-300' 
                  : 'from-purple-600 to-indigo-600'
              }`}>
                Schedule History
              </h3>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Select a student to view their complete appointment history
              </p>
            </div>
          </div>

          {/* Modern Search Bar */}
          <div className="relative">
            <div className={`relative rounded-2xl overflow-hidden shadow-lg backdrop-blur-sm ${
              darkMode 
                ? 'bg-gradient-to-r from-gray-800/50 to-gray-700/50 border border-gray-600/30' 
                : 'bg-gradient-to-r from-white/80 to-gray-50/80 border border-gray-200/50'
            }`}>
              <input
                type="text"
                placeholder="Search students by name or email..."
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
                className={`w-full pl-12 pr-4 py-4 text-sm bg-transparent transition-all duration-300 ${
                  darkMode 
                    ? 'text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/30' 
                    : 'text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-purple-500/30'
                } focus:outline-none`}
              />
              <FaSearch className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-sm transition-colors ${
                darkMode ? 'text-purple-400' : 'text-purple-500'
              }`} />
            </div>
          </div>
        </div>

        {/* Modern Students Grid */}
        <div className="p-6">
          {studentsLoading ? (
            <div className="text-center py-8">
              <div className={`inline-block animate-spin rounded-full h-8 w-8 border-b-2 ${
                darkMode ? 'border-purple-400' : 'border-purple-600'
              }`}></div>
              <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${
                darkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <FaUsers className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {students.length === 0 ? 'No students with appointments found' : 'No students match your search'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map((student) => (
                <button
                  key={student.profile_id}
                  onClick={() => handleStudentSelect(student)}
                  className={`group p-5 rounded-2xl border transition-all duration-300 hover:shadow-2xl hover:scale-105 text-left backdrop-blur-sm ${
                    darkMode 
                      ? 'bg-gradient-to-br from-gray-800/60 to-gray-900/60 border-gray-700/50 hover:border-purple-500/50 hover:shadow-purple-900/20' 
                      : 'bg-gradient-to-br from-white/80 to-gray-50/80 border-gray-200/50 hover:border-purple-300/50 hover:shadow-purple-200/20'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl shadow-lg transition-all duration-300 group-hover:scale-110 flex-shrink-0 ${
                      darkMode 
                        ? 'bg-gradient-to-br from-purple-600/30 to-indigo-600/30 shadow-purple-900/20' 
                        : 'bg-gradient-to-br from-purple-100 to-indigo-100 shadow-purple-200/30'
                    }`}>
                      <FaUser className={`text-base ${darkMode ? 'text-purple-300' : 'text-purple-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <h4 className={`font-semibold text-base truncate transition-colors ${
                        darkMode ? 'text-white group-hover:text-purple-300' : 'text-gray-900 group-hover:text-purple-700'
                      }`}>
                        {student.student_name}
                      </h4>
                      <div className="flex items-center gap-2">
                        <FaEnvelope className={`text-xs ${darkMode ? 'text-purple-400' : 'text-purple-500'}`} />
                        <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {student.student_email}
                        </p>
                      </div>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                        darkMode 
                          ? 'bg-gradient-to-r from-indigo-900/30 to-purple-900/30 text-indigo-300 border border-indigo-600/30' 
                          : 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-200'
                      }`}>
                        <FaCalendarAlt className="text-xs" />
                        <span>
                          {student.appointment_count} appointment{student.appointment_count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div id="schedule-history-section" className={`mt-6 rounded-2xl shadow-2xl backdrop-blur-sm border overflow-hidden transition-all duration-300 hover:shadow-3xl ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/50' 
        : 'bg-gradient-to-br from-white/90 to-gray-50/90 border-gray-200/50'
    }`}>
      {/* Modern Header with Gradient */}
      <div className={`p-6 border-b backdrop-blur-sm ${
        darkMode 
          ? 'border-gray-700/50 bg-gradient-to-r from-purple-900/20 to-indigo-900/20' 
          : 'border-gray-200/50 bg-gradient-to-r from-purple-50/50 to-indigo-50/50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl shadow-lg transition-all duration-300 hover:scale-110 ${
              darkMode 
                ? 'bg-gradient-to-br from-purple-600/30 to-indigo-600/30 shadow-purple-900/20' 
                : 'bg-gradient-to-br from-purple-100 to-indigo-100 shadow-purple-200/50'
            }`}>
              <FaHistory className={`text-3xl ${darkMode ? 'text-purple-300' : 'text-purple-600'}`} />
            </div>
            <div className="flex-1">
              <h3 className={`text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${
                darkMode 
                  ? 'from-purple-300 to-indigo-300' 
                  : 'from-purple-600 to-indigo-600'
              }`}>
                Schedule History
              </h3>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {currentSelectedName ? `${currentSelectedName}'s complete appointment history` : 'Student appointment history'}
              </p>
              <button
                onClick={() => {
                  setCurrentSelectedId(null);
                  setCurrentSelectedName('');
                  setAppointments([]);
                }}
                className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 shadow-lg ${
                  darkMode 
                    ? 'bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-gray-200 hover:text-white shadow-gray-900/20' 
                    : 'bg-gradient-to-r from-gray-200 to-gray-100 hover:from-gray-300 hover:to-gray-200 text-gray-700 hover:text-gray-900 shadow-gray-300/30'
                }`}
              >
                ← Back to student list
              </button>
            </div>
          </div>
          
        </div>

        {/* Modern Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
          <div className={`p-4 rounded-2xl shadow-xl backdrop-blur-sm border transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
            darkMode 
              ? 'bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border-blue-600/30 hover:border-blue-500/50' 
              : 'bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border-blue-200/50 hover:border-blue-300/50'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${
                darkMode ? 'bg-blue-600/20' : 'bg-blue-100'
              }`}>
                <FaCalendarAlt className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <span className={`text-xs font-medium ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>Total</span>
            </div>
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.total}</p>
          </div>
          
          <div className={`p-4 rounded-2xl shadow-xl backdrop-blur-sm border transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
            darkMode 
              ? 'bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-600/30 hover:border-blue-500/50' 
              : 'bg-gradient-to-br from-blue-50/80 to-cyan-50/80 border-blue-200/50 hover:border-blue-300/50'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${
                darkMode ? 'bg-blue-600/20' : 'bg-blue-100'
              }`}>
                <FaCalendarAlt className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <span className={`text-xs font-medium ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>Scheduled</span>
            </div>
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.scheduled}</p>
          </div>
          
          <div className={`p-4 rounded-2xl shadow-xl backdrop-blur-sm border transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
            darkMode 
              ? 'bg-gradient-to-br from-amber-900/30 to-yellow-900/30 border-amber-600/30 hover:border-amber-500/50' 
              : 'bg-gradient-to-br from-amber-50/80 to-yellow-50/80 border-amber-200/50 hover:border-amber-300/50'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${
                darkMode ? 'bg-amber-600/20' : 'bg-amber-100'
              }`}>
                <FaHourglassHalf className={`text-sm ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
              </div>
              <span className={`text-xs font-medium ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>In Progress</span>
            </div>
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.inProgress}</p>
          </div>
          
          <div className={`p-4 rounded-2xl shadow-xl backdrop-blur-sm border transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
            darkMode 
              ? 'bg-gradient-to-br from-emerald-900/30 to-green-900/30 border-emerald-600/30 hover:border-emerald-500/50' 
              : 'bg-gradient-to-br from-emerald-50/80 to-green-50/80 border-emerald-200/50 hover:border-emerald-300/50'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${
                darkMode ? 'bg-emerald-600/20' : 'bg-emerald-100'
              }`}>
                <FaCheckCircle className={`text-sm ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
              </div>
              <span className={`text-xs font-medium ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>Completed</span>
            </div>
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.completed}</p>
          </div>
          
          <div className={`p-4 rounded-2xl shadow-xl backdrop-blur-sm border transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
            darkMode 
              ? 'bg-gradient-to-br from-red-900/30 to-pink-900/30 border-red-600/30 hover:border-red-500/50' 
              : 'bg-gradient-to-br from-red-50/80 to-pink-50/80 border-red-200/50 hover:border-red-300/50'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${
                darkMode ? 'bg-red-600/20' : 'bg-red-100'
              }`}>
                <FaCalendarTimes className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
              </div>
              <span className={`text-xs font-medium ${darkMode ? 'text-red-300' : 'text-red-700'}`}>Canceled</span>
            </div>
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.canceled}</p>
          </div>
          
          <div className={`p-4 rounded-2xl shadow-xl backdrop-blur-sm border transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
            darkMode 
              ? 'bg-gradient-to-br from-gray-800/30 to-slate-800/30 border-gray-600/30 hover:border-gray-500/50' 
              : 'bg-gradient-to-br from-gray-50/80 to-slate-50/80 border-gray-200/50 hover:border-gray-300/50'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${
                darkMode ? 'bg-gray-600/20' : 'bg-gray-100'
              }`}>
                <FaUserTimes className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </div>
              <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>No Show</span>
            </div>
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.noShow}</p>
          </div>
        </div>
      </div>

      {/* History Content */}
      <div className="p-6">
          {/* Modern Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <div className={`relative rounded-2xl overflow-hidden shadow-lg backdrop-blur-sm ${
                darkMode 
                  ? 'bg-gradient-to-r from-gray-800/50 to-gray-700/50 border border-gray-600/30' 
                  : 'bg-gradient-to-r from-white/80 to-gray-50/80 border border-gray-200/50'
              }`}>
                <input
                  type="text"
                  placeholder="Search by notes or date..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 text-sm bg-transparent transition-all duration-300 ${
                    darkMode 
                      ? 'text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/30' 
                      : 'text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-purple-500/30'
                  } focus:outline-none`}
                />
                <FaSearch className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-sm ${
                  darkMode ? 'text-purple-400' : 'text-purple-500'
                }`} />
              </div>
            </div>
            
            <div className="relative">
              <div className={`relative rounded-2xl overflow-hidden shadow-lg backdrop-blur-sm ${
                darkMode 
                  ? 'bg-gradient-to-r from-gray-800/50 to-gray-700/50 border border-gray-600/30' 
                  : 'bg-gradient-to-r from-white/80 to-gray-50/80 border border-gray-200/50'
              }`}>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={`w-full pl-12 pr-10 py-3 text-sm transition-all duration-300 appearance-none ${
                    darkMode 
                      ? 'bg-gray-800 text-white focus:ring-2 focus:ring-purple-500/30' 
                      : 'bg-white text-gray-900 focus:ring-2 focus:ring-purple-500/30'
                  } focus:outline-none cursor-pointer`}
                >
                  <option value="all" className={darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>All Status</option>
                  <option value="Scheduled" className={darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>Scheduled</option>
                  <option value="In Progress" className={darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>In Progress</option>
                  <option value="Completed" className={darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>Completed</option>
                  <option value="Canceled" className={darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>Canceled</option>
                  <option value="No Show" className={darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>No Show</option>
                </select>
                <FaFilter className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-sm ${
                  darkMode ? 'text-purple-400' : 'text-purple-500'
                }`} />
                <FaChevronDown className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-sm ${
                  darkMode ? 'text-purple-400' : 'text-purple-500'
                } pointer-events-none`} />
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className={`inline-block animate-spin rounded-full h-8 w-8 border-b-2 ${
                darkMode ? 'border-purple-400' : 'border-purple-600'
              }`}></div>
              <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading history...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-red-900/20 border-red-600/30' : 'bg-red-50 border-red-200'} border`}>
              <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
            </div>
          )}

          {/* Appointments List */}
          {!loading && !error && (
            <div className="space-y-4">
              {filteredAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg ${
                    darkMode 
                      ? 'bg-gradient-to-br from-gray-700 to-gray-800' 
                      : 'bg-gradient-to-br from-gray-100 to-gray-200'
                  }`}>
                    <FaCalendarAlt className={`text-2xl ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>
                  <p className={`text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {appointments.length === 0 ? 'No appointment history found' : 'No appointments match your filters'}
                  </p>
                  <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {appointments.length === 0 ? 'This student has no recorded appointments yet.' : 'Try adjusting your search or filter criteria.'}
                  </p>
                </div>
              ) : (
                filteredAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className={`group p-6 rounded-2xl border transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] backdrop-blur-sm ${
                      darkMode 
                        ? 'bg-gradient-to-br from-gray-800/60 to-gray-900/60 border-gray-700/50 hover:border-purple-500/30 hover:shadow-purple-900/20' 
                        : 'bg-gradient-to-br from-white/80 to-gray-50/80 border-gray-200/50 hover:border-purple-300/30 hover:shadow-purple-200/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <FaCalendarAlt className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {formatDate(appointment.appointment_date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaClock className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {appointment.appointment_time}
                            </span>
                          </div>
                          {/* Walk-in indicator */}
                          {appointment.notes && appointment.notes.toLowerCase().includes('walk-in') && (
                            <div 
                              className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-[#800000] to-[#660000] text-white"
                              title="Walk-in Appointment"
                            >
                              <FaWalking className="text-xs" />
                              <span className="text-xs font-medium">Walk-in</span>
                            </div>
                          )}
                        </div>
                        
                        {appointment.notes && (
                          <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {appointment.notes}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="relative">
                            <button
                              onClick={() => {
                                setExpandedAppointment(expandedAppointment === appointment.id ? null : appointment.id);
                              }}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors hover:opacity-80 ${
                                darkMode ? statusColorsDark[appointment.status] : statusColors[appointment.status]
                              }`}
                            >
                              {statusIcons[appointment.status]}
                              {appointment.status}
                              <FaChevronDown className={`text-xs transition-transform ${expandedAppointment === appointment.id ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {/* Status Dropdown */}
                            {expandedAppointment === appointment.id && (
                              <div className={`absolute left-0 z-50 rounded-lg shadow-lg border min-w-[140px] ${
                                darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                              }`}
                              style={{
                                bottom: '100%',
                                marginBottom: '4px'
                              }}>
                                {['Scheduled', 'In Progress', 'Completed', 'Canceled', 'No Show'].map((status) => (
                                  <button
                                    key={status}
                                    onClick={() => handleStatusUpdate(appointment.id, status as Appointment['status'])}
                                    className={`w-full text-left px-3 py-2 text-xs hover:bg-opacity-80 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                                      status === appointment.status 
                                        ? darkMode 
                                          ? 'bg-gray-700 text-white font-semibold' 
                                          : 'bg-gray-100 text-gray-900 font-semibold'
                                        : darkMode 
                                          ? 'text-gray-300 hover:bg-gray-700' 
                                          : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                  >
                                    <span className="flex items-center gap-2">
                                      {statusIcons[status]}
                                      {status}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {getRelativeTime(appointment.appointment_date)}
                            </span>
                            
                            {/* Action buttons */}
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleEditAppointment(appointment)}
                                className={`p-1.5 rounded-lg transition-colors hover:scale-110 ${
                                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                                }`}
                                title="Edit appointment"
                              >
                                <FaEdit className="text-green-500 text-xs" />
                              </button>
                              <button
                                onClick={() => handleDeleteAppointment(appointment)}
                                className={`p-1.5 rounded-lg transition-colors hover:scale-110 ${
                                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                                }`}
                                title="Delete appointment"
                              >
                                <FaTrash className="text-red-500 text-xs" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
      </div>
    </div>
  );
};

export default ScheduleHistory;
