import React, { useState, useEffect } from 'react';
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

const Schedule = ({ darkMode }: ScheduleProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedAppointment, setExpandedAppointment] = useState<number | null>(null);

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

  const handleStatusUpdate = async (appointmentId: number, newStatus: Appointment['status']) => {
    try {
      await updateAppointment(appointmentId, { status: newStatus });
      // Refresh appointments
      const data = await getAllAppointments();
      setAppointments(data);
      setExpandedAppointment(null);
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
        <div class="text-left space-y-3">
          <div class="bg-gray-50 p-3 rounded-lg">
            <h3 class="font-semibold text-gray-800 mb-2">Appointment Details</h3>
            <p><strong>Student:</strong> ${appointment.student_name}</p>
            <p><strong>Email:</strong> ${appointment.student_email}</p>
            <p><strong>Date:</strong> ${appointment.appointment_date}</p>
            <p><strong>Time:</strong> ${appointment.appointment_time}</p>
            <p><strong>Status:</strong> <span class="px-2 py-1 rounded-full text-xs font-semibold ${statusColors[appointment.status]}">${appointment.status}</span></p>
            ${appointment.notes ? `<p><strong>Notes:</strong> ${appointment.notes}</p>` : ''}
          </div>
        </div>
      `,
      confirmButtonText: 'Close',
      confirmButtonColor: '#3085d6',
    });
  };

  const handleDeleteAppointment = async (appointment: Appointment) => {
    const result = await Swal.fire({
      title: 'Delete Appointment',
      html: `
        <div class="text-center">
          <p class="text-gray-600 mb-3">Are you sure you want to delete this appointment?</p>
          <div class="bg-red-50 p-3 rounded-lg border border-red-200">
            <p class="font-semibold text-red-800">${appointment.student_name}</p>
            <p class="text-sm text-red-600">${appointment.appointment_date} at ${appointment.appointment_time}</p>
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        await deleteAppointment(appointment.id);
        // Refresh appointments
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

  return (
    <section
      className={`relative rounded-xl shadow-lg p-6 md:p-8 transition-all overflow-hidden border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
      style={{ minHeight: '60vh' }}
    >
      <div className="flex items-center mb-6">
        <FaCalendarAlt className={`mr-3 text-3xl ${darkMode ? 'text-indigo-300' : 'text-indigo-500'}`} />
        <h2 className={`text-2xl md:text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Upcoming Appointments</h2>
      </div>
      <div className="max-w-4xl mx-auto">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {appointments.map(app => (
                <div
                  key={app.id}
                  className={`p-3 rounded-lg shadow-sm border transition-all group hover:shadow-md hover:scale-[1.02] ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                >
                  {/* Header with student name and actions */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <FaUser className="text-blue-600 text-sm" />
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
                    <span>{app.appointment_date}</span>
                    <FaClock className="ml-2 mr-1" />
                    <span>{app.appointment_time}</span>
                  </div>

                  {/* Status and actions */}
                  <div className="flex items-center justify-between">
                    <span className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold ${statusColors[app.status]}`}>
                      {statusIcons[app.status]} {app.status}
                    </span>
                    
                    <div className="relative">
                      <button
                        onClick={() => setExpandedAppointment(expandedAppointment === app.id ? null : app.id)}
                        className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                        title="Change status"
                      >
                        <FaChevronDown className={`text-gray-600 text-xs transition-transform ${expandedAppointment === app.id ? 'rotate-180' : ''}`} />
                      </button>
                      {expandedAppointment === app.id && (
                        <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-28">
                          {statusOptions.map(status => (
                            <button
                              key={status}
                              onClick={() => handleStatusUpdate(app.id, status as Appointment['status'])}
                              className={`w-full text-left px-2 py-1.5 text-xs hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                                status === app.status ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Schedule; 