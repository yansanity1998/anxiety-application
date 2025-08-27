import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import lotus from '../../../public/lotus.png';
import { FaCalendarAlt, FaUser, FaClock, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaSpinner, FaChevronDown, FaEye, FaTrash, FaPrint, FaDownload, FaCalendarTimes, FaUserTimes } from 'react-icons/fa';
import { getAllAppointments, updateAppointment, deleteAppointment } from '../../lib/appointmentService';
import type { Appointment } from '../../lib/appointmentService';
import Swal from 'sweetalert2';

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedAppointment, setExpandedAppointment] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');


  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setIsLoading(true);
        const data = await getAllAppointments();
        setAppointments(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setError('Failed to load appointments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (expandedAppointment !== null && !target.closest('.dropdown-container')) {
        setExpandedAppointment(null);
        setDropdownPosition(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [expandedAppointment]);

  const handleStatusUpdate = async (appointmentId: number, newStatus: Appointment['status']) => {
    try {
      await updateAppointment(appointmentId, { status: newStatus });
      // Refresh appointments
      const data = await getAllAppointments();
      setAppointments(data);
      setExpandedAppointment(null);
      setDropdownPosition(null);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update appointment status',
      });
    }
  };

  const showStudentInfo = (appointment: Appointment) => {
    Swal.fire({
      title: 'Student Information',
      html: `
        <div class="text-left space-y-6">
          <div class="text-center mb-6">
            <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#800000]/10 to-[#800000]/20 rounded-full mb-4 shadow-lg">
              <svg class="w-10 h-10 text-[#800000]" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-[#800000] mb-2">${appointment.student_name}</h3>
            <p class="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full inline-block">${appointment.student_email}</p>
          </div>
          <div class="bg-gradient-to-br from-[#800000]/5 to-[#800000]/10 p-6 rounded-2xl border border-[#800000]/20 shadow-inner">
            <h4 class="font-bold text-[#800000] mb-4 flex items-center text-lg">
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Appointment Details
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div class="bg-white/90 p-4 rounded-xl border border-[#800000]/10 shadow-sm hover:shadow-md transition-shadow">
                <div class="flex items-center mb-2">
                  <svg class="w-4 h-4 text-[#800000] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p class="text-xs font-bold text-gray-700 uppercase tracking-wide">Date</p>
                </div>
                <p class="text-base font-bold text-[#800000]">${formatDate(appointment.appointment_date)}</p>
              </div>
              <div class="bg-white/90 p-4 rounded-xl border border-[#800000]/10 shadow-sm hover:shadow-md transition-shadow">
                <div class="flex items-center mb-2">
                  <svg class="w-4 h-4 text-[#800000] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p class="text-xs font-bold text-gray-700 uppercase tracking-wide">Time</p>
                </div>
                <p class="text-base font-bold text-[#800000]">${appointment.appointment_time}</p>
              </div>
            </div>
            <div class="bg-white/90 p-4 rounded-xl border border-[#800000]/10 shadow-sm mb-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <svg class="w-4 h-4 text-[#800000] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p class="text-xs font-bold text-gray-700 uppercase tracking-wide">Status</p>
                </div>
                <span class="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${statusColors[appointment.status]} shadow-sm">
                  ${appointment.status}
                </span>
              </div>
            </div>
            ${appointment.notes ? `
              <div class="bg-white/90 p-4 rounded-xl border border-[#800000]/10 shadow-sm">
                <div class="flex items-center mb-2">
                  <svg class="w-4 h-4 text-[#800000] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <p class="text-xs font-bold text-gray-700 uppercase tracking-wide">Notes</p>
                </div>
                <p class="text-sm text-gray-800 leading-relaxed bg-gray-50 p-3 rounded-lg">${appointment.notes}</p>
              </div>
            ` : ''}
          </div>
          <div class="flex gap-3 mt-6">
            <button 
              onclick="window.print()"
              class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
            <button 
              onclick="this.closest('.swal2-popup').querySelector('.swal2-confirm').click()"
              class="flex-1 bg-[#800000] hover:bg-[#660000] text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Close
            </button>
          </div>
        </div>
      `,
      showConfirmButton: false,
      showCancelButton: false,
      width: '450px',
      customClass: {
        popup: 'rounded-2xl shadow-2xl border-2 border-[#800000]/20',
        title: 'hidden',
        htmlContainer: 'p-0',
        icon: 'hidden'
      }
    });
  };

  const handleDeleteAppointment = async (appointment: Appointment) => {
    const result = await Swal.fire({
      title: 'Delete Appointment',
      html: `
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
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      width: '400px',
      customClass: {
        popup: 'rounded-2xl shadow-2xl border border-red-200',
        title: 'hidden',
        htmlContainer: 'p-0',
        confirmButton: 'bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 px-5 rounded-lg transition-colors shadow-lg hover:shadow-xl',
        cancelButton: 'bg-gray-500 hover:bg-gray-600 text-white font-medium py-2.5 px-5 rounded-lg transition-colors shadow-lg hover:shadow-xl'
      }
    });

    if (result.isConfirmed) {
      try {
        await deleteAppointment(appointment.id);
        const data = await getAllAppointments();
        setAppointments(data);
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Appointment has been deleted successfully.',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (error) {
        console.error('Error deleting appointment:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete appointment. Please try again.',
        });
      }
    }
  };

  const handleEditAppointment = async (appointment: Appointment) => {
    try {
      const { value: formValues } = await Swal.fire({
        title: 'Edit Appointment',
        html: `
          <div class="space-y-6">
            <!-- User Info Header -->
            <div class="text-center mb-6">
              <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#800000]/10 to-[#800000]/20 rounded-full mb-4 shadow-lg">
                <svg class="w-8 h-8 text-[#800000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 class="text-xl font-bold text-[#800000] mb-2">Edit Appointment</h3>
              <div class="bg-[#800000]/5 px-4 py-2 rounded-lg border border-[#800000]/20">
                <p class="text-sm font-semibold text-gray-800">${appointment.student_name}</p>
                <p class="text-xs text-gray-600">Current: ${formatDate(appointment.appointment_date)} at ${appointment.appointment_time}</p>
              </div>
            </div>

            <!-- Form Fields -->
            <div class="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
              <!-- Date Selection -->
              <div class="space-y-3 mb-5">
                <label class="flex items-center text-sm font-bold text-gray-700 mb-2">
                  <div class="w-8 h-8 bg-[#800000]/10 rounded-lg flex items-center justify-center mr-3">
                    <svg class="w-4 h-4 text-[#800000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  New Appointment Date
                </label>
                <div class="relative">
                  <input 
                    type="date" 
                    id="edit-date" 
                    value="${appointment.appointment_date}"
                    min="${new Date().toISOString().split('T')[0]}"
                    class="w-full p-4 border-2 rounded-xl bg-white border-gray-300 text-gray-900 focus:ring-4 focus:ring-[#800000]/20 focus:border-[#800000] transition-all duration-200 text-base font-medium shadow-sm hover:shadow-lg hover:border-[#800000]/50" 
                  />
                </div>
              </div>

              <!-- Time Selection -->
              <div class="space-y-3 mb-5">
                <label class="flex items-center text-sm font-bold text-gray-700 mb-2">
                  <div class="w-8 h-8 bg-[#800000]/10 rounded-lg flex items-center justify-center mr-3">
                    <svg class="w-4 h-4 text-[#800000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  New Appointment Time
                </label>
                <div class="relative">
                  <input 
                    type="time" 
                    id="edit-time" 
                    value="${appointment.appointment_time}"
                    class="w-full p-4 border-2 rounded-xl bg-white border-gray-300 text-gray-900 focus:ring-4 focus:ring-[#800000]/20 focus:border-[#800000] transition-all duration-200 text-base font-medium shadow-sm hover:shadow-lg hover:border-[#800000]/50" 
                  />
                </div>
              </div>

              <!-- Notes -->
              <div class="space-y-3">
                <label class="flex items-center text-sm font-bold text-gray-700 mb-2">
                  <div class="w-8 h-8 bg-[#800000]/10 rounded-lg flex items-center justify-center mr-3">
                    <svg class="w-4 h-4 text-[#800000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  Notes (Optional)
                </label>
                <textarea 
                  id="edit-notes" 
                  class="w-full p-4 border-2 rounded-xl bg-white border-gray-300 text-gray-900 focus:ring-4 focus:ring-[#800000]/20 focus:border-[#800000] transition-all duration-200 text-base font-medium shadow-sm hover:shadow-lg hover:border-[#800000]/50 resize-none" 
                  rows="3"
                  placeholder="Add any additional notes or special instructions..."
                >${appointment.notes || ''}</textarea>
              </div>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Update Appointment',
        confirmButtonColor: '#800000',
        cancelButtonText: 'Cancel',
        focusConfirm: false,
        preConfirm: () => {
          const date = (document.getElementById('edit-date') as HTMLInputElement)?.value;
          const time = (document.getElementById('edit-time') as HTMLInputElement)?.value;
          const notes = (document.getElementById('edit-notes') as HTMLTextAreaElement)?.value;
          if (!date || !time) {
            Swal.showValidationMessage('Please select both date and time');
            return false;
          }
          return { date, time, notes };
        },
        width: '400px',
        customClass: {
          popup: 'rounded-xl shadow-xl border-2 border-[#800000] bg-white',
          title: 'text-lg font-bold text-[#800000] mb-3',
          htmlContainer: 'text-gray-700',
          confirmButton: 'bg-[#800000] hover:bg-[#660000] text-white font-semibold py-2.5 px-5 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105',
          cancelButton: 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 border-2 font-semibold py-2.5 px-5 rounded-lg transition-all duration-200 shadow hover:shadow-md',
          icon: 'hidden'
        }
      });

      if (formValues) {
        try {
          // Update appointment
          await updateAppointment(appointment.id, {
            appointment_date: formValues.date,
            appointment_time: formValues.time,
            notes: formValues.notes
          });

          // Refresh appointments
          const data = await getAllAppointments();
          setAppointments(data);

          Swal.fire({
            icon: 'success',
            title: 'Updated!',
            text: 'Appointment has been updated successfully.',
            timer: 1500,
            showConfirmButton: false
          });
        } catch (error) {
          console.error('Error updating appointment:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to update appointment. Please try again.',
          });
        }
      }
    } catch (error) {
      console.error('Error editing appointment:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to edit appointment.',
      });
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

  // Print functionality
  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Student Appointments Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #800000; padding-bottom: 20px; }
            .status-section { margin-bottom: 30px; }
            .status-title { background: #f5f5f5; padding: 10px; font-weight: bold; border-left: 4px solid #800000; }
            .appointment { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
            .student-name { font-weight: bold; color: #800000; font-size: 16px; }
            .appointment-details { margin-top: 10px; }
            .status-badge { padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; }
            .scheduled { background: #dbeafe; color: #1e40af; }
            .in-progress { background: #fef3c7; color: #92400e; }
            .completed { background: #d1fae5; color: #065f46; }
            .canceled { background: #fee2e2; color: #991b1b; }
            .no-show { background: #f3f4f6; color: #374151; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Student Appointments Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            <p>Total Appointments: ${appointments.length}</p>
          </div>
          ${statusOptions.map(status => {
            const statusAppointments = groupedAppointments[status] || [];
            if (statusAppointments.length === 0) return '';
            return `
              <div class="status-section">
                <div class="status-title">${status} Appointments (${statusAppointments.length})</div>
                ${statusAppointments.map(app => `
                  <div class="appointment">
                    <div class="student-name">${app.student_name}</div>
                    <div class="appointment-details">
                      <p><strong>Email:</strong> ${app.student_email}</p>
                      <p><strong>Date:</strong> ${formatDate(app.appointment_date)}</p>
                      <p><strong>Time:</strong> ${app.appointment_time}</p>
                      <p><strong>Status:</strong> <span class="status-badge ${status.toLowerCase().replace(' ', '-')}">${app.status}</span></p>
                      ${app.notes ? `<p><strong>Notes:</strong> ${app.notes}</p>` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            `;
          }).join('')}
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  // Export to CSV functionality
  const handleExportCSV = () => {
    const csvContent = [
      ['Student Name', 'Email', 'Date', 'Time', 'Status', 'Notes'],
      ...appointments.map(app => [
        app.student_name,
        app.student_email,
        app.appointment_date,
        app.appointment_time,
        app.status,
        app.notes || ''
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `appointments_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section
      className={`relative rounded-xl shadow-lg p-6 md:p-8 transition-all border ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
      style={{ minHeight: '60vh' }}
    >
      <img src={lotus} alt="Lotus" className="absolute top-4 right-6 w-14 h-14 opacity-20 pointer-events-none select-none" />
      {/* Enhanced Header with Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="flex items-center">
          <FaCalendarAlt className={`mr-3 text-3xl ${darkMode ? 'text-indigo-300' : 'text-indigo-500'}`} />
          <div>
            <h2 className={`text-2xl md:text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Student Appointments</h2>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage and track all student appointments</p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md ${
              darkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            title="Print appointments report"
          >
            <FaPrint className="text-sm" />
            <span className="hidden sm:inline">Print</span>
          </button>
          
          <button
            onClick={handleExportCSV}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md ${
              darkMode 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
            title="Export to CSV"
          >
            <FaDownload className="text-sm" />
            <span className="hidden sm:inline">Export</span>
          </button>
          
          <div className={`px-3 py-2 rounded-lg border-2 ${
            darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-white'
          }`}>
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Total: <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{filteredAppointments.length}</span>
              {searchTerm && (
                <span className={`ml-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  of {appointments.length}
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative max-w-sm">
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
        {searchTerm && (
          <p className={`mt-1.5 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {filteredAppointments.length} result{filteredAppointments.length !== 1 ? 's' : ''} for "{searchTerm}"
          </p>
        )}
      </div>
      
      {/* Status Legend */}
      <div className="mb-6">
        <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Status Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {statusOptions.map(status => {
            const colors = darkMode ? statusCardColorsDark[status] : statusCardColors[status];
            return (
              <div key={status} className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                colors.bg
              } ${colors.border} shadow-lg backdrop-blur-sm`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-xl mr-4 ${colors.iconBg} shadow-md`}>
                      <span className="text-xl text-white">
                        {statusIcons[status]}
                      </span>
                    </div>
                    <span className={`text-base font-bold ${colors.textColor}`}>
                      {status}
                    </span>
                  </div>
                  <span className={`text-3xl font-bold ${colors.countColor} drop-shadow-sm`}>
                    {getStatusCount(status)}
                  </span>
                </div>
                <div className="relative">
                  <div className={`h-2 rounded-full bg-white/30 overflow-hidden`}>
                    <div className={`h-full rounded-full ${colors.progressBg} transition-all duration-500 shadow-sm`} 
                         style={{ width: `${Math.min(100, (getStatusCount(status) / Math.max(1, appointments.length)) * 100)}%` }}>
                    </div>
                  </div>
                  <div className={`text-xs font-medium mt-2 ${colors.textColor} opacity-75`}>
                    {Math.round((getStatusCount(status) / Math.max(1, appointments.length)) * 100)}% of total
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Appointments by Status */}
      <div className="w-full">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <FaSpinner className="animate-spin text-2xl text-blue-500 mr-3" />
            <span className="text-gray-500">Loading appointments...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500 text-base">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : appointments.length === 0 ? (
          <div className={`rounded-lg p-8 border shadow transition-all text-center ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            <FaCalendarAlt className={`mx-auto mb-4 text-4xl ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`text-base italic ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No appointments scheduled yet.</p>
            <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Student appointments will appear here organized by status.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {statusOptions.map(status => {
              const statusAppointments = groupedAppointments[status] || [];
              if (statusAppointments.length === 0) return null;
              
              return (
                <div key={status} className={`rounded-lg border shadow transition-all ${
                  darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  {/* Status Section Header */}
                  <div className={`px-5 py-3 border-b flex items-center justify-between ${
                    darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                  }`}>
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full mr-3 ${statusColors[status].replace('text-', 'bg-').replace('100', '200')}`}>
                        <span className={`text-lg ${statusColors[status].split(' ')[1]}`}>
                          {statusIcons[status]}
                        </span>
                      </div>
                      <div>
                        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {status} Appointments
                        </h3>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {statusAppointments.length} appointment{statusAppointments.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[status]}`}>
                      {statusAppointments.length}
                    </span>
                  </div>
                  
                  {/* Appointments Grid */}
                  <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {statusAppointments.map(app => {
                        const cardColors = darkMode ? statusCardColorsDark[app.status] : statusCardColors[app.status];
                        return (
                        <div
                          key={app.id}
                          className={`relative overflow-visible z-10 p-5 rounded-xl shadow-lg border-2 transition-all group hover:shadow-xl hover:scale-[1.03] ${
                            cardColors.bg
                          } ${cardColors.border} backdrop-blur-sm`}
                        >
                          {/* Status indicator bar */}
                          <div className={`absolute top-0 left-0 right-0 h-2 rounded-t-xl ${cardColors.progressBg}`}></div>
                          
                          {/* Header with student name and actions */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div className={`p-2 rounded-lg ${cardColors.iconBg} shadow-sm`}>
                                <FaUser className="text-white text-xs" />
                              </div>
                              <span className={`font-bold text-sm truncate ${cardColors.textColor}`} title={app.student_name}>
                                {app.student_name}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => showStudentInfo(app)}
                                className="p-1.5 rounded-full hover:bg-blue-50 transition-colors"
                                title="View details"
                              >
                                <FaEye className="text-blue-600 text-xs" />
                              </button>
                              <button
                                onClick={() => handleEditAppointment(app)}
                                className="p-1.5 rounded-full hover:bg-green-50 transition-colors"
                                title="Edit appointment"
                              >
                                <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteAppointment(app)}
                                className="p-1.5 rounded-full hover:bg-red-50 transition-colors"
                                title="Delete appointment"
                              >
                                <FaTrash className="text-red-500 text-xs" />
                              </button>
                            </div>
                          </div>

                          {/* Date and time */}
                          <div className={`flex items-center text-xs mb-3 ${cardColors.textColor} opacity-80`}>
                            <FaCalendarAlt className="mr-1" />
                            <span className="font-medium">{formatDate(app.appointment_date)}</span>
                            <FaClock className="ml-3 mr-1" />
                            <span className="font-medium">{app.appointment_time}</span>
                          </div>

                          {/* Status badge with dropdown */}
                          <div className="flex items-center justify-between">
                            <div className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold ${cardColors.iconBg} text-white shadow-md relative w-full justify-between`}>
                              <span className="flex items-center">
                                <span className="text-sm mr-2">{statusIcons[app.status]}</span>
                                <span className="font-bold">{app.status}</span>
                              </span>
                              <span className="ml-2">
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
                                  className="p-1 rounded-full hover:bg-white/20 transition-colors"
                                  title="Change status"
                                >
                                  <FaChevronDown className={`text-white text-xs transition-transform ${expandedAppointment === app.id ? 'rotate-180' : ''}`} />
                                </button>
                              </span>
                            </div>
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
        )}
      </div>
      
      {/* Dropdown rendered using Portal to ensure it's above everything */}
      {expandedAppointment && dropdownPosition && createPortal(
        <div 
          className="dropdown-container fixed bg-white border border-gray-300 rounded-md shadow-md z-[99999] min-w-20 py-0.5" 
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
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
    </section>
  );
};

export default Schedule;
