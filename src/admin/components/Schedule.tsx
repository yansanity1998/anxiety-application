import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import lotus from '../../../public/lotus.png';
import { FaCalendarAlt, FaUser, FaClock, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaSpinner, FaChevronDown, FaEye, FaTrash } from 'react-icons/fa';
import { getAllAppointments, updateAppointment, deleteAppointment } from '../../lib/appointmentService';
import type { Appointment } from '../../lib/appointmentService';
import Swal from 'sweetalert2';

interface ScheduleProps {
  darkMode: boolean;
}

const statusColors: Record<string, string> = {
  'Scheduled': 'bg-blue-100 text-blue-800',
  'In Progress': 'bg-yellow-100 text-yellow-800',
  'Completed': 'bg-green-100 text-green-800',
  'Canceled': 'bg-red-100 text-red-800',
  'No Show': 'bg-gray-100 text-gray-800',
};

const statusOptions = ['Scheduled', 'In Progress', 'Completed', 'Canceled', 'No Show'];

const statusIcons: Record<string, React.ReactNode> = {
  'Scheduled': <FaCalendarAlt className="mr-1" />,
  'In Progress': <FaHourglassHalf className="mr-1" />,
  'Completed': <FaCheckCircle className="mr-1" />,
  'Canceled': <FaTimesCircle className="mr-1" />,
  'No Show': <FaTimesCircle className="mr-1" />,
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

  const getStudentIconColor = () => 'text-blue-600';

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
        <div class="text-left space-y-4">
          <div class="text-center mb-4">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-[#800000]/10 rounded-full mb-3">
              <svg class="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-[#800000] mb-1">${appointment.student_name}</h3>
            <p class="text-sm text-gray-600">${appointment.student_email}</p>
          </div>
          <div class="bg-gradient-to-br from-[#800000]/5 to-[#800000]/10 p-4 rounded-xl border border-[#800000]/20">
            <h4 class="font-semibold text-[#800000] mb-3 flex items-center">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Appointment Details
            </h4>
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-white/80 p-3 rounded-lg border border-[#800000]/10">
                <p class="text-xs font-medium text-gray-600 mb-1">Date</p>
                <p class="text-sm font-semibold text-[#800000]">${formatDate(appointment.appointment_date)}</p>
              </div>
              <div class="bg-white/80 p-3 rounded-lg border border-[#800000]/10">
                <p class="text-xs font-medium text-gray-600 mb-1">Time</p>
                <p class="text-sm font-semibold text-[#800000]">${appointment.appointment_time}</p>
              </div>
            </div>
            <div class="mt-3 bg-white/80 p-3 rounded-lg border border-[#800000]/10 flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-gray-600 mb-1">Status</p>
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusColors[appointment.status]}">
                  ${appointment.status}
                </span>
              </div>
            </div>
            ${appointment.notes ? `
              <div class="mt-3 bg-white/80 p-3 rounded-lg border border-[#800000]/10">
                <p class="text-xs font-medium text-gray-600 mb-1">Notes</p>
                <p class="text-sm text-gray-800">${appointment.notes}</p>
              </div>
            ` : ''}
          </div>
          <div class="flex gap-2 mt-4">
            <button 
              onclick="this.closest('.swal2-popup').querySelector('.swal2-confirm').click()"
              class="flex-1 bg-[#800000] hover:bg-[#660000] text-white font-medium py-2 px-4 rounded-lg transition-colors shadow-lg hover:shadow-xl"
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
          <div class="space-y-4">
            <!-- User Info Header -->
            <div class="text-center mb-3">
              <div class="inline-flex items-center justify-center w-12 h-12 bg-[#800000]/10 rounded-full mb-2">
                <svg class="w-6 h-6 text-[#800000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 class="text-base font-semibold text-gray-800 mb-1">Edit Appointment for ${appointment.student_name}</h3>
              <p class="text-xs text-gray-600">Current: ${formatDate(appointment.appointment_date)} at ${appointment.appointment_time}</p>
            </div>

            <!-- Date Selection -->
            <div class="space-y-2">
              <label class="block text-xs font-medium text-gray-700 mb-1">
                <svg class="inline w-3 h-3 mr-1 text-[#800000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                New Appointment Date
              </label>
              <div class="relative">
                <input 
                  type="date" 
                  id="edit-date" 
                  value="${appointment.appointment_date}"
                  min="${new Date().toISOString().split('T')[0]}"
                  class="w-full p-2.5 border-2 rounded-lg bg-white border-gray-200 text-gray-900 focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000] transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md" 
                />
              </div>
            </div>

            <!-- Time Selection -->
            <div class="space-y-2">
              <label class="block text-xs font-medium text-gray-700 mb-1">
                <svg class="inline w-3 h-3 mr-1 text-[#800000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                New Appointment Time
              </label>
              <div class="relative">
                <input 
                  type="time" 
                  id="edit-time" 
                  value="${appointment.appointment_time}"
                  class="w-full p-2.5 border-2 rounded-lg bg-white border-gray-200 text-gray-900 focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000] transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md" 
                />
              </div>
            </div>

            <!-- Notes -->
            <div class="space-y-2">
              <label class="block text-xs font-medium text-gray-700 mb-1">
                <svg class="inline w-3 h-3 mr-1 text-[#800000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Notes (Optional)
              </label>
              <textarea 
                id="edit-notes" 
                class="w-full p-2.5 border-2 rounded-lg bg-white border-gray-200 text-gray-900 focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000] transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md" 
                rows="2"
                placeholder="Add any additional notes..."
              >${appointment.notes || ''}</textarea>
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

  return (
    <section
      className={`relative rounded-xl shadow-lg p-6 md:p-8 transition-all border ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
      style={{ minHeight: '60vh' }}
    >
      <img src={lotus} alt="Lotus" className="absolute top-4 right-6 w-14 h-14 opacity-20 pointer-events-none select-none" />
      <div className="flex items-center mb-6">
        <FaCalendarAlt className={`mr-3 text-3xl ${darkMode ? 'text-indigo-300' : 'text-indigo-500'}`} />
        <h2 className={`text-2xl md:text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Upcoming Appointments</h2>
      </div>
      
      <div className="w-full">
        <div className={`rounded-lg p-5 border shadow transition-all flex flex-col gap-4 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
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
            <p className="text-gray-400 text-base italic">No appointments scheduled yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
              {appointments.map(app => (
                <div
                  key={app.id}
                  className={`relative overflow-visible z-10 p-3 rounded-lg shadow-sm border transition-all group hover:shadow-md hover:scale-[1.02] ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}
                >
                  {/* Header with student name and actions */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <FaUser className={getStudentIconColor() + " text-sm"} />
                      <span className="font-semibold text-sm truncate" title={app.student_name}>
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
                  <div className="flex items-center text-xs text-gray-500 mb-2">
                    <FaCalendarAlt className="mr-1" />
                    <span>{formatDate(app.appointment_date)}</span>
                    <FaClock className="ml-2 mr-1" />
                    <span>{app.appointment_time}</span>
                  </div>

                  {/* Status and actions */}
                  <div className="flex items-center justify-between">
                    <span className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold ${statusColors[app.status]} relative w-full justify-between`}>
                      <span className="flex items-center">
                        {statusIcons[app.status]} {app.status}
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
                          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                          title="Change status"
                        >
                          <FaChevronDown className={`text-gray-600 text-xs transition-transform ${expandedAppointment === app.id ? 'rotate-180' : ''}`} />
                        </button>

                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
