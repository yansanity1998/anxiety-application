import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
// import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { FaCalendarAlt, FaUser, FaClock, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaChevronDown, FaEye, FaTrash, FaCalendarTimes, FaUserTimes, FaWalking } from 'react-icons/fa';
import { getAllAppointments, updateAppointment, deleteAppointment } from '../../lib/appointmentService';
import type { Appointment } from '../../lib/appointmentService';
import WalkInModal from './WalkInModal';
// Removed SweetAlert2 - using modern alerts instead

interface ScheduleProps {
  darkMode: boolean;
}

const statusColors: Record<string, string> = {
  'Scheduled': 'bg-blue-100 text-blue-800',
  'In Progress': 'bg-yellow-100 text-yellow-600',
  'Completed': 'bg-green-100 text-green-800',
  'Canceled': 'bg-transparent text-red-600',
  'No Show': 'bg-transparent text-gray-600',
};

// Enhanced status card colors with gradients
const statusCardColors: Record<string, { bg: string; border: string; iconBg: string; textColor: string; countColor: string; progressBg: string }> = {
  'Scheduled': {
    bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
    border: 'border-blue-200',
    iconBg: 'bg-blue-500',
    textColor: 'text-blue-900',
    countColor: 'text-blue-700',
    progressBg: 'bg-blue-400'
  },
  'In Progress': {
    bg: 'bg-gradient-to-br from-amber-50 to-yellow-100',
    border: 'border-amber-200',
    iconBg: 'bg-amber-500',
    textColor: 'text-amber-900',
    countColor: 'text-amber-700',
    progressBg: 'bg-amber-400'
  },
  'Completed': {
    bg: 'bg-gradient-to-br from-emerald-50 to-green-100',
    border: 'border-emerald-200',
    iconBg: 'bg-emerald-500',
    textColor: 'text-emerald-900',
    countColor: 'text-emerald-700',
    progressBg: 'bg-emerald-400'
  },
  'Canceled': {
    bg: 'bg-gradient-to-br from-red-50 to-red-100',
    border: 'border-red-200',
    iconBg: 'bg-red-500',
    textColor: 'text-red-900',
    countColor: 'text-red-700',
    progressBg: 'bg-red-400'
  },
  'No Show': {
    bg: 'bg-gradient-to-br from-gray-50 to-gray-100',
    border: 'border-gray-200',
    iconBg: 'bg-gray-500',
    textColor: 'text-gray-900',
    countColor: 'text-gray-700',
    progressBg: 'bg-gray-400'
  }
};

// Dark mode status card colors
const statusCardColorsDark: Record<string, { bg: string; border: string; iconBg: string; textColor: string; countColor: string; progressBg: string }> = {
  'Scheduled': {
    bg: 'bg-gradient-to-br from-blue-900/20 to-blue-800/30',
    border: 'border-blue-600/30',
    iconBg: 'bg-blue-600',
    textColor: 'text-blue-100',
    countColor: 'text-blue-200',
    progressBg: 'bg-blue-500'
  },
  'In Progress': {
    bg: 'bg-gradient-to-br from-amber-900/20 to-amber-800/30',
    border: 'border-amber-600/30',
    iconBg: 'bg-amber-600',
    textColor: 'text-amber-100',
    countColor: 'text-amber-200',
    progressBg: 'bg-amber-500'
  },
  'Completed': {
    bg: 'bg-gradient-to-br from-emerald-900/20 to-emerald-800/30',
    border: 'border-emerald-600/30',
    iconBg: 'bg-emerald-600',
    textColor: 'text-emerald-100',
    countColor: 'text-emerald-200',
    progressBg: 'bg-emerald-500'
  },
  'Canceled': {
    bg: 'bg-gradient-to-br from-red-900/20 to-red-800/30',
    border: 'border-red-600/30',
    iconBg: 'bg-red-600',
    textColor: 'text-red-100',
    countColor: 'text-red-200',
    progressBg: 'bg-red-500'
  },
  'No Show': {
    bg: 'bg-gradient-to-br from-gray-800/20 to-gray-700/30',
    border: 'border-gray-600/30',
    iconBg: 'bg-gray-600',
    textColor: 'text-gray-100',
    countColor: 'text-gray-200',
    progressBg: 'bg-gray-500'
  }
};

const statusOptions = ['Scheduled', 'In Progress', 'Completed', 'Canceled', 'No Show'];

const statusIcons: Record<string, React.ReactNode> = {
  'Scheduled': <FaCalendarAlt className="mr-1" />,
  'In Progress': <FaHourglassHalf className="mr-1" />,
  'Completed': <FaCheckCircle className="mr-1" />,
  'Canceled': <FaCalendarTimes className="mr-1" />,
  'No Show': <FaUserTimes className="mr-1" />,
};

// Helper function to format date in user-friendly format
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('en-US', options);
};



const Schedule = ({ darkMode }: ScheduleProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [expandedAppointment, setExpandedAppointment] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

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
    const fetchAppointments = async () => {
      try {
        const data = await getAllAppointments();
        setAppointments(data);
      } catch (err) {
        console.error('Error fetching appointments:', err);
        showAlert('error', 'Error', 'Failed to load appointments');
      }
    };

    fetchAppointments();
  }, []);

  // Close dropdown when clicking outside or scrolling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (expandedAppointment !== null && !target.closest('.dropdown-container')) {
        setExpandedAppointment(null);
        setDropdownPosition(null);
      }
    };

    const handleScroll = () => {
      if (expandedAppointment !== null) {
        setExpandedAppointment(null);
        setDropdownPosition(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('scroll', handleScroll, true); // Use capture to catch all scroll events
    window.addEventListener('resize', handleScroll);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [expandedAppointment]);

  const handleStatusUpdate = async (appointmentId: number, newStatus: Appointment['status']) => {
    try {
      // Find the current appointment to preserve its notes
      const currentAppointment = appointments.find(app => app.id === appointmentId);
      
      await updateAppointment(appointmentId, { 
        status: newStatus,
        notes: currentAppointment?.notes // Preserve existing notes including walk-in indicator
      });
      // Refresh appointments
      const data = await getAllAppointments();
      setAppointments(data);
      setExpandedAppointment(null);
      setDropdownPosition(null);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      showAlert('error', 'Error', 'Failed to update appointment status');
    }
  };

  const showStudentInfo = (appointment: Appointment) => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200">
        <div class="p-5">
          <div class="flex items-center gap-4 mb-5">
            <div class="p-3 rounded-lg bg-gradient-to-br from-[#800000]/10 to-[#800000]/20">
              <svg class="w-6 h-6 text-[#800000]" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-semibold text-gray-900 truncate">${appointment.student_name}</h3>
              <p class="text-sm text-gray-500">${appointment.student_email}</p>
            </div>
            <button 
              onclick="this.closest('.fixed').remove()"
              class="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div class="p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div class="flex items-center gap-2 mb-1.5">
                  <svg class="w-4 h-4 text-[#800000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span class="text-xs font-medium text-gray-600">Date</span>
                </div>
                <p class="text-sm font-semibold text-gray-900">${formatDate(appointment.appointment_date)}</p>
              </div>

              <div class="p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div class="flex items-center gap-2 mb-1.5">
                  <svg class="w-4 h-4 text-[#800000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="text-xs font-medium text-gray-600">Time</span>
                </div>
                <p class="text-sm font-semibold text-gray-900">${appointment.appointment_time}</p>
              </div>
            </div>

            <div class="p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div class="flex items-center gap-2 mb-1.5">
                <svg class="w-4 h-4 text-[#800000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-xs font-medium text-gray-600">Status</span>
              </div>
              <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[appointment.status]}">
                <span>${appointment.status}</span>
              </span>
            </div>

            ${appointment.notes ? `
              <div class="p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div class="flex items-center gap-2 mb-1.5">
                  <svg class="w-4 h-4 text-[#800000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span class="text-xs font-medium text-gray-600">Notes</span>
                </div>
                <p class="text-sm text-gray-700 leading-relaxed">${appointment.notes}</p>
              </div>
            ` : ''}
          </div>

          <div class="flex gap-2 mt-5">
            <button 
              onclick="window.print()"
              class="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
            <button 
              onclick="this.closest('.fixed').remove()"
              class="flex-1 px-3 py-1.5 bg-[#800000] hover:bg-[#660000] text-white text-sm font-medium rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    `;
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
    
    document.body.appendChild(modal);
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
        const data = await getAllAppointments();
        setAppointments(data);
        showAlert('success', 'Deleted!', 'Appointment has been deleted successfully.');
      } catch (error) {
        console.error('Error deleting appointment:', error);
        showAlert('error', 'Error', 'Failed to delete appointment. Please try again.');
      }
    }
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

          const data = await getAllAppointments();
          setAppointments(data);
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

  // Filter appointments based on search term
  const filteredAppointments = appointments.filter(appointment => 
    appointment.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.student_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group filtered appointments by status
  const groupedAppointments = filteredAppointments.reduce((acc, appointment) => {
    const status = appointment.status;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(appointment);
    return acc;
  }, {} as Record<string, Appointment[]>);

  // Get status counts
  const getStatusCount = (status: string) => groupedAppointments[status]?.length || 0;

  // Scroll to specific status section
  const scrollToStatus = (status: string) => {
    const element = document.getElementById(`status-section-${status.toLowerCase().replace(/\s+/g, '-')}`);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
    }
  };

  const handleAppointmentCreated = async () => {
    try {
      const data = await getAllAppointments();
      setAppointments(data);
    } catch (error) {
      console.error('Error refreshing appointments:', error);
    }
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-xl shadow-lg p-6`}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center">
          <div className={`p-3 rounded-xl ${darkMode ? 'bg-indigo-600/20' : 'bg-indigo-100'} mr-4`}>
            <FaCalendarAlt className={`text-2xl ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Student Appointments</h2>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage and track all student appointments</p>
          </div>
        </div>
        
        {/* Total Appointments Card */}
        <div className={`p-4 rounded-xl bg-gradient-to-br ${
          darkMode 
            ? 'from-gray-700 to-gray-900 border-gray-600/30' 
            : 'from-gray-50 to-gray-100 border-gray-200'
        } border-2 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${darkMode ? 'bg-indigo-500/30' : 'bg-indigo-500/10'}`}>
              <FaCalendarAlt className={`text-xl ${darkMode ? 'text-indigo-300' : 'text-indigo-600'}`} />
            </div>
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Appointments</p>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {filteredAppointments.length}
                </span>
                {searchTerm && (
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    / {appointments.length}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {statusOptions.map(status => {
          const colors = darkMode ? statusCardColorsDark[status] : statusCardColors[status];
          const hasAppointments = getStatusCount(status) > 0;
          return (
            <div 
              key={status} 
              onClick={() => hasAppointments && scrollToStatus(status)}
              className={`p-3 rounded-xl bg-gradient-to-br ${darkMode ? 'from-gray-700 to-gray-900' : 'from-gray-50 to-gray-100'} border transition-all duration-300 hover:shadow-xl hover:scale-105 ${colors.border} shadow-lg backdrop-blur-sm ${
                hasAppointments ? 'cursor-pointer' : 'cursor-default opacity-75'
              }`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{status}</p>
                  <h3 className={`text-xl font-bold mt-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{getStatusCount(status)}</h3>
                </div>
                <div className={`p-1.5 ${colors.iconBg} rounded-lg`}>
                  <span className="text-white text-sm">
                    {statusIcons[status]}
                  </span>
                </div>
              </div>
              <div className="relative">
                <div className={`h-1 rounded-full bg-white/30 overflow-hidden`}>
                  <div className={`h-full rounded-full ${colors.progressBg} transition-all duration-500 shadow-sm`} 
                       style={{ width: `${Math.min(100, (getStatusCount(status) / Math.max(1, appointments.length)) * 100)}%` }}>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search Bar with Walk-in Button */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-2xl">
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-8 pr-3 py-2 text-sm rounded-md border transition-all duration-200 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500/20' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/20'
              } focus:outline-none shadow-sm hover:shadow`}
            />
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <FaUser className={`h-3.5 w-3.5 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className={`absolute inset-y-0 right-0 pr-2.5 flex items-center ${
                  darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                } transition-colors`}
              >
                <FaTimesCircle className="h-3 w-3" />
              </button>
            )}
          </div>
          
          {/* Walk-in Button - Far Right Corner */}
          <button
            onClick={() => setIsWalkInModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#800000] to-[#660000] hover:from-[#660000] hover:to-[#4d0000] text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <FaWalking className="text-sm" />
            <span className="hidden sm:inline">Walk-in</span>
          </button>
        </div>
        {searchTerm && (
          <p className={`mt-1.5 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {filteredAppointments.length} result{filteredAppointments.length !== 1 ? 's' : ''} for "{searchTerm}"
          </p>
        )}
      </div>
      
      {/* Appointments by Status */}
      <div className="space-y-6">
        {statusOptions.map(status => {
          const statusAppointments = groupedAppointments[status] || [];
          if (statusAppointments.length === 0) return null;
          
          return (
            <div 
              key={status} 
              id={`status-section-${status.toLowerCase().replace(/\s+/g, '-')}`}
              className={`rounded-xl border shadow-lg transition-all scroll-mt-6 ${
                darkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50/50 border-gray-200'
              }`}>
              {/* Status Section Header */}
              <div className={`px-4 py-3 border-b flex items-center justify-between ${
                darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white/50'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${statusCardColorsDark[status].iconBg}`}>
                    <span className="text-white text-sm">
                      {statusIcons[status]}
                    </span>
                  </div>
                  <div>
                    <h3 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {status}
                    </h3>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {statusAppointments.length} appointment{statusAppointments.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Appointments Grid */}
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                  {statusAppointments.map(app => {
                    const cardColors = darkMode ? statusCardColorsDark[app.status] : statusCardColors[app.status];
                    return (
                      <div
                        key={app.id}
                        className={`relative p-3 rounded-xl border transition-all duration-200 group hover:shadow-lg hover:-translate-y-0.5 ${
                          darkMode 
                            ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800/80' 
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {/* Status indicator bar */}
                        <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${cardColors.progressBg}`}></div>
                        
                        {/* Header with student name and actions */}
                        <div className="flex items-start justify-between mt-1.5 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`p-1.5 rounded-lg ${cardColors.iconBg} shadow-sm`}>
                              <FaUser className="text-white text-xs" />
                            </div>
                            <span className={`font-medium text-sm truncate ${darkMode ? 'text-gray-200' : 'text-gray-700'}`} title={app.student_name}>
                              {app.student_name}
                            </span>
                            {/* Walk-in indicator */}
                            {app.notes && app.notes.toLowerCase().includes('walk-in') && (
                              <div 
                                className="p-1 rounded-full bg-gradient-to-r from-[#800000] to-[#660000] shadow-sm"
                                title="Walk-in Appointment"
                              >
                                <FaWalking className="text-white text-xs" />
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => showStudentInfo(app)}
                              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                              title="View details"
                            >
                              <FaEye className="text-blue-500 text-xs" />
                            </button>
                            <button
                              onClick={() => handleEditAppointment(app)}
                              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                              title="Edit appointment"
                            >
                              <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteAppointment(app)}
                              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                              title="Delete appointment"
                            >
                              <FaTrash className="text-red-500 text-xs" />
                            </button>
                          </div>
                        </div>

                        {/* Date and time */}
                        <div className={`flex flex-col gap-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <div className="flex items-center gap-1.5">
                            <FaCalendarAlt className="text-xs opacity-70" />
                            <span>{formatDate(app.appointment_date)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <FaClock className="text-xs opacity-70" />
                            <span>{app.appointment_time}</span>
                          </div>
                        </div>

                        {/* Status badge */}
                        <div className="mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (expandedAppointment === app.id) {
                                setExpandedAppointment(null);
                                setDropdownPosition(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setDropdownPosition({
                                  top: rect.bottom + 2,
                                  left: rect.left + (rect.width / 2)
                                });
                                setExpandedAppointment(app.id);
                              }
                            }}
                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${cardColors.iconBg} text-white`}
                          >
                            <span className="flex items-center gap-1">
                              {statusIcons[app.status]}
                              <span>{app.status}</span>
                            </span>
                            <FaChevronDown className={`text-xs transition-transform ${expandedAppointment === app.id ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Dropdown rendered using Portal to ensure it's above everything */}
      {expandedAppointment && dropdownPosition && createPortal(
        <div 
          className="dropdown-container fixed bg-white border border-gray-300 rounded-md shadow-md z-[99999] py-0.5" 
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: '100%',
            maxWidth: '200px',
            minWidth: '160px',
            transform: 'translateX(-50%)'
          }}
        >
          {statusOptions.map(status => (
            <button
              key={status}
              onClick={(e) => {
                e.stopPropagation();
                handleStatusUpdate(expandedAppointment, status as Appointment['status']);
              }}
              className={`w-full text-left px-1.5 py-0.5 text-xs hover:bg-gray-50 first:rounded-t-md last:rounded-b-md transition-colors ${
                status === appointments.find(app => app.id === expandedAppointment)?.status ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>,
        document.body
      )}

      {/* Walk-in Modal */}
      <WalkInModal
        isOpen={isWalkInModalOpen}
        onClose={() => setIsWalkInModalOpen(false)}
        darkMode={darkMode}
        onAppointmentCreated={handleAppointmentCreated}
      />
    </div>
  );
};

export default Schedule;
