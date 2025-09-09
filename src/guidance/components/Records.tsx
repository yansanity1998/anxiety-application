import { useState, useEffect } from 'react';
import { FaFileAlt, FaCalendarAlt, FaBrain, FaVideo, FaTasks, FaSearch, FaTimes, FaSpinner, FaUser, FaEnvelope, FaSchool, FaCheck, FaPlay, FaPause, FaBookOpen, FaEye, FaUsers, FaFileCsv, FaFileWord, FaFileExcel, FaClipboardList, FaFilePdf } from 'react-icons/fa';
import { supabase } from '../../lib/supabase';

interface RecordsProps {
  darkMode: boolean;
}

interface StudentProfile {
  id: number;
  user_id: string;
  full_name: string;
  email: string;
  id_number: string;
  age: number;
  gender: string;
  school: string;
  course: string;
  year_level: number;
  phone_number: string;
  guardian_name: string;
  guardian_phone_number: string;
  address: string;
  role: string;
  created_at: string;
  last_sign_in: string;
  streak: number;
  last_activity_date: string;
}

interface Appointment {
  id: number;
  student_profile_id?: number;
  profile_id?: number;
  student_name: string;
  student_email: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes?: string;
  meeting_notes?: string;
  meeting_duration_minutes?: number;
  created_at: string;
}

interface CBTModule {
  id: number;
  profile_id: number;
  module_title: string;
  module_description: string;
  module_status: string;
  module_date_started?: string;
  module_date_complete?: string;
  created_at: string;
}

interface AnxietyVideo {
  id: number;
  profile_id: number;
  video_title: string;
  video_description: string;
  video_url: string;
  video_status: string;
  video_date_started?: string;
  video_date_completed?: string;
  created_at: string;
}

interface AnxietyAssessment {
  id: string;
  total_score: number;
  percentage: number;
  anxiety_level: string;
  answers: number[];
  created_at: string;
  updated_at: string;
}

interface TodoItem {
  id: number;
  profile_id: number;
  title: string;
  description?: string;
  category?: string;
  status: string;
  priority: number;
  due_at?: string;
  completed_at?: string;
  created_at: string;
}

interface StudentRecord {
  profile: StudentProfile;
  appointments: Appointment[];
  cbtModules: CBTModule[];
  anxietyVideos: AnxietyVideo[];
  todoItems: TodoItem[];
  anxietyAssessments: AnxietyAssessment[];
}

const Records = ({ darkMode }: RecordsProps) => {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);

  useEffect(() => {
    fetchAllStudentData();
  }, []);

  // Cleanup effect to restore scroll when component unmounts
  useEffect(() => {
    return () => {
      // Only restore scroll if we actually modified it
      if (showStudentModal) {
        document.body.style.overflow = '';
      }
    };
  }, [showStudentModal]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showStudentModal) {
        closeStudentModal();
      }
    };

    if (showStudentModal) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [showStudentModal]);

  const fetchAllStudentData = async () => {
    try {
      setLoading(true);
      
      // Fetch all students
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('full_name');

      if (profilesError) throw profilesError;

      if (!profiles) return;

      // Fetch all related data
      const [appointments, cbtModules, anxietyVideos, todoItems, anxietyAssessments] = await Promise.all([
        supabase.from('appointments').select('*'),
        supabase.from('cbt_module').select('*'),
        supabase.from('anxiety_video').select('*'),
        supabase.from('todo_items').select('*'),
        supabase.from('anxiety_assessments').select('*').order('created_at', { ascending: false })
      ]);

      // Check for errors in data fetching
      if (appointments.error) {
        console.error('Error fetching appointments:', appointments.error);
      }
      if (cbtModules.error) {
        console.error('Error fetching CBT modules:', cbtModules.error);
      }
      if (anxietyVideos.error) {
        console.error('Error fetching anxiety videos:', anxietyVideos.error);
      }
      if (todoItems.error) {
        console.error('Error fetching todo items:', todoItems.error);
      }
      if (anxietyAssessments.error) {
        console.error('Error fetching anxiety assessments:', anxietyAssessments.error);
      }

      // Debug: Log the appointments data to see what we're getting
      console.log('Appointments data:', appointments.data);
      console.log('Profiles data:', profiles);

      // Combine data for each student
      const studentRecords: StudentRecord[] = profiles.map(profile => {
        // Try different possible field names for appointment matching
        let studentAppointments = appointments.data?.filter(apt => 
          apt.student_profile_id === profile.id || 
          apt.profile_id === profile.id ||
          apt.student_profile_id === profile.user_id ||
          apt.profile_id === profile.user_id
        ) || [];
        
        // If no appointments found, try to match by email as a fallback
        if (studentAppointments.length === 0 && appointments.data) {
          studentAppointments = appointments.data.filter(apt => 
            apt.student_email === profile.email
          );
        }
        
        console.log(`Student ${profile.full_name} (ID: ${profile.id}, Email: ${profile.email}) appointments:`, studentAppointments);
        console.log(`Appointment fields available:`, appointments.data ? Object.keys(appointments.data[0] || {}) : 'No appointments data');
        
        return {
          profile,
          appointments: studentAppointments,
          cbtModules: cbtModules.data?.filter(module => module.profile_id === profile.id) || [],
          anxietyVideos: anxietyVideos.data?.filter(video => video.profile_id === profile.id) || [],
          todoItems: todoItems.data?.filter(todo => todo.profile_id === profile.id) || [],
          anxietyAssessments: anxietyAssessments.data?.filter(assessment => assessment.profile_id === profile.id) || []
        };
      });

      setStudents(studentRecords);
    } catch (error) {
      console.error('Error fetching student data:', error);
      setError('Failed to fetch student data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const fullName = student.profile.full_name?.toLowerCase() || '';
    const email = student.profile.email?.toLowerCase() || '';
    const idNumber = student.profile.id_number?.toLowerCase() || '';
    
    return fullName.includes(searchLower) ||
           email.includes(searchLower) ||
           idNumber.includes(searchLower);
  });

  const openStudentModal = (student: StudentRecord) => {
    setSelectedStudent(student);
    setShowStudentModal(true);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  };

  const closeStudentModal = () => {
    setShowStudentModal(false);
    setSelectedStudent(null);
    // Restore body scroll when modal is closed
    document.body.style.overflow = '';
  };

  // Export functions
  const exportToCSV = (student: StudentRecord) => {
    const csvData = [
      ['Field', 'Value'],
      ['Full Name', student.profile.full_name],
      ['Email', student.profile.email],
      ['ID Number', student.profile.id_number],
      ['Age', student.profile.age?.toString() || ''],
      ['Gender', student.profile.gender],
      ['School', student.profile.school],
      ['Course', student.profile.course],
      ['Year Level', student.profile.year_level?.toString() || ''],
      ['Phone', student.profile.phone_number || ''],
      ['Guardian', student.profile.guardian_name || ''],
      ['Guardian Phone', student.profile.guardian_phone_number || ''],
      ['Address', student.profile.address || ''],
      ['Last Activity', new Date(student.profile.last_activity_date).toLocaleDateString()],
      ['Streak', student.profile.streak?.toString() || '0'],
      ['', ''],
      ['APPOINTMENTS', ''],
      ...student.appointments.map(apt => [
        `Appointment ${apt.id}`,
        `${new Date(apt.appointment_date).toLocaleDateString()} at ${apt.appointment_time} - ${apt.status}`
      ]),
      ['', ''],
      ['CBT MODULES', ''],
      ...student.cbtModules.map(module => [
        module.module_title,
        `Status: ${module.module_status} | Started: ${module.module_date_started ? new Date(module.module_date_started).toLocaleDateString() : 'Not started'}`
      ]),
      ['', ''],
      ['ANXIETY VIDEOS', ''],
      ...student.anxietyVideos.map(video => [
        video.video_title,
        `Status: ${video.video_status}`
      ]),
      ['', ''],
      ['ANXIETY ASSESSMENTS', ''],
      ...student.anxietyAssessments.map(assessment => [
        `Assessment ${assessment.id.substring(0, 8)}`,
        `Level: ${assessment.anxiety_level} | Score: ${assessment.total_score}/21 (${assessment.percentage}%) | Date: ${new Date(assessment.created_at).toLocaleDateString()}`
      ]),
      ['', ''],
      ['TODO ITEMS', ''],
      ...student.todoItems.map(todo => [
        todo.title,
        `Status: ${todo.status} | Priority: ${getPriorityText(todo.priority)} | Due: ${todo.due_at ? new Date(todo.due_at).toLocaleDateString() : 'No due date'}${todo.description ? ` | Description: ${todo.description}` : ''}`
      ])
    ];

    const csvContent = "data:text/csv;charset=utf-8," + 
      csvData.map(row => 
        row.map(field => `"${field?.toString().replace(/"/g, '""') || ''}"`).join(',')
      ).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${student.profile.full_name.replace(/\s+/g, '_')}_record.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = (student: StudentRecord) => {
    // Create proper Excel workbook with enhanced styling
    const excelContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <meta name="ProgId" content="Excel.Sheet">
        <meta name="Generator" content="Microsoft Excel 15">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Student Record</x:Name>
                <x:WorksheetSource HRef="sheet001.htm"/>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          .header { background-color: #2563eb; color: white; font-weight: bold; text-align: center; font-size: 14pt; padding: 10px; }
          .section-header { background-color: #3b82f6; color: white; font-weight: bold; text-align: center; font-size: 12pt; padding: 8px; }
          .label { background-color: #f1f5f9; font-weight: bold; padding: 6px; border: 1px solid #cbd5e1; }
          .value { padding: 6px; border: 1px solid #cbd5e1; }
          .table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
          .assessment-minimal { background-color: #dcfce7; color: #166534; }
          .assessment-mild { background-color: #dbeafe; color: #1e40af; }
          .assessment-moderate { background-color: #fef3c7; color: #92400e; }
          .assessment-severe { background-color: #fee2e2; color: #dc2626; }
          .status-completed { background-color: #dcfce7; color: #166534; }
          .status-in-progress { background-color: #dbeafe; color: #1e40af; }
          .status-pending { background-color: #fef3c7; color: #92400e; }
        </style>
      </head>
      <body>
        <table class="table">
          <tr><td colspan="2" class="header">STUDENT RECORD - ${student.profile.full_name.toUpperCase()}</td></tr>
          <tr><td colspan="2" style="text-align: center; padding: 10px; font-style: italic;">Generated on ${new Date().toLocaleDateString()}</td></tr>
        </table>

        <table class="table">
          <tr><td colspan="2" class="section-header">PERSONAL INFORMATION</td></tr>
          <tr><td class="label">Full Name</td><td class="value">${student.profile.full_name}</td></tr>
          <tr><td class="label">Student ID</td><td class="value">${student.profile.id_number}</td></tr>
          <tr><td class="label">Email Address</td><td class="value">${student.profile.email}</td></tr>
          <tr><td class="label">Age</td><td class="value">${student.profile.age || 'Not provided'}</td></tr>
          <tr><td class="label">Gender</td><td class="value">${student.profile.gender}</td></tr>
          <tr><td class="label">School</td><td class="value">${student.profile.school}</td></tr>
          <tr><td class="label">Course</td><td class="value">${student.profile.course}</td></tr>
          <tr><td class="label">Year Level</td><td class="value">${student.profile.year_level || 'Not provided'}</td></tr>
          <tr><td class="label">Phone Number</td><td class="value">${student.profile.phone_number || 'Not provided'}</td></tr>
          <tr><td class="label">Guardian Name</td><td class="value">${student.profile.guardian_name || 'Not provided'}</td></tr>
          <tr><td class="label">Guardian Phone</td><td class="value">${student.profile.guardian_phone_number || 'Not provided'}</td></tr>
          <tr><td class="label">Address</td><td class="value">${student.profile.address || 'Not provided'}</td></tr>
          <tr><td class="label">Last Activity</td><td class="value">${new Date(student.profile.last_activity_date).toLocaleDateString()}</td></tr>
          <tr><td class="label">Activity Streak</td><td class="value">${student.profile.streak || 0} days</td></tr>
        </table>

        <table class="table">
          <tr><td colspan="3" class="section-header">COUNSELING APPOINTMENTS (${student.appointments.length})</td></tr>
          ${student.appointments.length > 0 ? `
            <tr><td class="label">Date</td><td class="label">Time</td><td class="label">Status</td></tr>
            ${student.appointments.map(apt => `
              <tr>
                <td class="value">${new Date(apt.appointment_date).toLocaleDateString()}</td>
                <td class="value">${apt.appointment_time}</td>
                <td class="value status-${apt.status.toLowerCase().replace(' ', '-')}">${apt.status}</td>
              </tr>
            `).join('')}
          ` : '<tr><td colspan="3" class="value" style="text-align: center; font-style: italic;">No appointments scheduled</td></tr>'}
        </table>

        <table class="table">
          <tr><td colspan="3" class="section-header">CBT MODULES (${student.cbtModules.length})</td></tr>
          ${student.cbtModules.length > 0 ? `
            <tr><td class="label">Module Title</td><td class="label">Status</td><td class="label">Date Started</td></tr>
            ${student.cbtModules.map(module => `
              <tr>
                <td class="value">${module.module_title}</td>
                <td class="value status-${module.module_status.replace('_', '-')}">${module.module_status.replace('_', ' ')}</td>
                <td class="value">${module.module_date_started ? new Date(module.module_date_started).toLocaleDateString() : 'Not started'}</td>
              </tr>
            `).join('')}
          ` : '<tr><td colspan="3" class="value" style="text-align: center; font-style: italic;">No CBT modules assigned</td></tr>'}
        </table>

        <table class="table">
          <tr><td colspan="2" class="section-header">ANXIETY VIDEOS (${student.anxietyVideos.length})</td></tr>
          ${student.anxietyVideos.length > 0 ? `
            <tr><td class="label">Video Title</td><td class="label">Status</td></tr>
            ${student.anxietyVideos.map(video => `
              <tr>
                <td class="value">${video.video_title}</td>
                <td class="value status-${video.video_status.replace('_', '-')}">${video.video_status.replace('_', ' ')}</td>
              </tr>
            `).join('')}
          ` : '<tr><td colspan="2" class="value" style="text-align: center; font-style: italic;">No videos assigned</td></tr>'}
        </table>

        <table class="table">
          <tr><td colspan="4" class="section-header">ANXIETY ASSESSMENTS (${student.anxietyAssessments.length})</td></tr>
          ${student.anxietyAssessments.length > 0 ? `
            <tr><td class="label">Date</td><td class="label">Anxiety Level</td><td class="label">Score</td><td class="label">Percentage</td></tr>
            ${student.anxietyAssessments.map(assessment => `
              <tr>
                <td class="value">${new Date(assessment.created_at).toLocaleDateString()}</td>
                <td class="value assessment-${assessment.anxiety_level.toLowerCase()}">${assessment.anxiety_level}</td>
                <td class="value">${assessment.total_score}/21</td>
                <td class="value">${assessment.percentage}%</td>
              </tr>
            `).join('')}
          ` : '<tr><td colspan="4" class="value" style="text-align: center; font-style: italic;">No assessments completed</td></tr>'}
        </table>

        <table class="table">
          <tr><td colspan="4" class="section-header">ASSIGNED TASKS (${student.todoItems.length})</td></tr>
          ${student.todoItems.length > 0 ? `
            <tr><td class="label">Task Title</td><td class="label">Status</td><td class="label">Priority</td><td class="label">Due Date</td></tr>
            ${student.todoItems.map(todo => `
              <tr>
                <td class="value">${todo.title}</td>
                <td class="value status-${todo.status.replace('_', '-')}">${todo.status.replace('_', ' ')}</td>
                <td class="value">${getPriorityText(todo.priority)}</td>
                <td class="value">${todo.due_at ? new Date(todo.due_at).toLocaleDateString() : 'No due date'}</td>
              </tr>
            `).join('')}
          ` : '<tr><td colspan="4" class="value" style="text-align: center; font-style: italic;">No tasks assigned</td></tr>'}
        </table>

        <table class="table">
          <tr><td style="text-align: center; padding: 15px; font-size: 10pt; color: #666;">
            This document was generated by the Anxiety Management System on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
          </td></tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${student.profile.full_name.replace(/\s+/g, '_')}_record.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = (student: StudentRecord) => {
    const currentDate = new Date();
    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Student Record - ${student.profile.full_name}</title>
        <style>
          @page { 
            margin: 0.75in; 
            size: A4;
          }
          * {
            box-sizing: border-box;
          }
          body { 
            font-family: 'Arial', sans-serif; 
            font-size: 11pt; 
            line-height: 1.4; 
            color: #333; 
            margin: 0; 
            padding: 0;
            background: white;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #800000;
            padding-bottom: 20px;
            margin-bottom: 25px;
            background: linear-gradient(135deg, #fdf2f8 0%, #f3e8ff 100%);
            padding: 20px;
            border-radius: 8px;
          }
          .logo {
            font-size: 24pt;
            font-weight: bold;
            color: #800000;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .subtitle {
            font-size: 14pt;
            color: #991b1b;
            margin-bottom: 15px;
            font-style: italic;
          }
          .document-title {
            font-size: 18pt;
            font-weight: bold;
            color: #450a0a;
            margin: 15px 0;
          }
          .student-name {
            font-size: 20pt;
            font-weight: bold;
            color: #800000;
            margin: 10px 0;
          }
          .generation-info {
            font-size: 10pt;
            color: #991b1b;
            margin-top: 10px;
          }
          .section {
            margin: 20px 0;
            page-break-inside: avoid;
          }
          .section-header {
            font-size: 14pt;
            font-weight: bold;
            color: white;
            background: linear-gradient(90deg, #800000, #991b1b);
            padding: 10px 15px;
            margin-bottom: 15px;
            border-radius: 6px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
          }
          .info-item {
            background: #fdf2f8;
            border: 1px solid #f3e8ff;
            border-radius: 6px;
            padding: 12px;
          }
          .info-label {
            font-weight: bold;
            color: #800000;
            font-size: 10pt;
            margin-bottom: 4px;
          }
          .info-value {
            color: #450a0a;
            font-size: 11pt;
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(128,0,0,0.1);
          }
          .data-table th {
            background: linear-gradient(90deg, #800000, #991b1b);
            color: white;
            font-weight: bold;
            padding: 12px 10px;
            text-align: left;
            font-size: 10pt;
            border-bottom: 2px solid #800000;
          }
          .data-table td {
            padding: 10px;
            border-bottom: 1px solid #f3e8ff;
            font-size: 10pt;
            vertical-align: top;
          }
          .data-table tr:nth-child(even) {
            background-color: #fdf2f8;
          }
          .data-table tr:hover {
            background-color: #f8fafc;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 9pt;
            font-weight: bold;
            text-transform: uppercase;
          }
          .status-completed { background-color: #dcfce7; color: #166534; }
          .status-in-progress { background-color: #dbeafe; color: #1e40af; }
          .status-pending { background-color: #fef3c7; color: #92400e; }
          .status-scheduled { background-color: #dbeafe; color: #1e40af; }
          .anxiety-minimal { background-color: #dcfce7; color: #166534; }
          .anxiety-mild { background-color: #dbeafe; color: #1e40af; }
          .anxiety-moderate { background-color: #fef3c7; color: #92400e; }
          .anxiety-severe { background-color: #fee2e2; color: #dc2626; }
          .priority-urgent { background-color: #fee2e2; color: #dc2626; }
          .priority-high { background-color: #fed7aa; color: #ea580c; }
          .priority-medium { background-color: #fef3c7; color: #92400e; }
          .priority-low { background-color: #dbeafe; color: #1e40af; }
          .priority-very-low { background-color: #f1f5f9; color: #64748b; }
          .no-data {
            text-align: center;
            font-style: italic;
            color: #991b1b;
            padding: 20px;
            background: #fdf2f8;
            border-radius: 6px;
            border: 1px dashed #f3e8ff;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #f3e8ff;
            text-align: center;
            font-size: 9pt;
            color: #991b1b;
            page-break-inside: avoid;
          }
          .confidential {
            background: #fee2e2;
            color: #dc2626;
            padding: 8px;
            border-radius: 4px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          @media print {
            body { print-color-adjust: exact; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Anxiety Management System</div>
          <div class="subtitle">Student Mental Health & Wellness Program</div>
          <div class="document-title">Official Student Record</div>
          <div class="student-name">${student.profile.full_name}</div>
          <div class="generation-info">
            <strong>Student ID:</strong> ${student.profile.id_number} | 
            <strong>Generated:</strong> ${currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${currentDate.toLocaleTimeString()}
          </div>
        </div>

        <div class="section">
          <div class="section-header">Personal Information</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Full Name</div>
              <div class="info-value">${student.profile.full_name}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Student ID</div>
              <div class="info-value">${student.profile.id_number}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Email Address</div>
              <div class="info-value">${student.profile.email}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Age</div>
              <div class="info-value">${student.profile.age || 'Not provided'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Gender</div>
              <div class="info-value">${student.profile.gender}</div>
            </div>
            <div class="info-item">
              <div class="info-label">School</div>
              <div class="info-value">${student.profile.school}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Course</div>
              <div class="info-value">${student.profile.course}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Year Level</div>
              <div class="info-value">${student.profile.year_level || 'Not provided'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Phone Number</div>
              <div class="info-value">${student.profile.phone_number || 'Not provided'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Guardian</div>
              <div class="info-value">${student.profile.guardian_name || 'Not provided'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Guardian Phone</div>
              <div class="info-value">${student.profile.guardian_phone_number || 'Not provided'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Last Activity</div>
              <div class="info-value">${new Date(student.profile.last_activity_date).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">Counseling Appointments (${student.appointments.length})</div>
          ${student.appointments.length > 0 ? `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                ${student.appointments.map(apt => `
                  <tr>
                    <td>${new Date(apt.appointment_date).toLocaleDateString()}</td>
                    <td>${apt.appointment_time}</td>
                    <td><span class="status-badge status-${apt.status.toLowerCase().replace(' ', '-')}">${apt.status}</span></td>
                    <td>${apt.notes || apt.meeting_notes || 'No notes'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<div class="no-data">No counseling appointments scheduled or completed.</div>'}
        </div>

        <div class="section">
          <div class="section-header">CBT Modules (${student.cbtModules.length})</div>
          ${student.cbtModules.length > 0 ? `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Module Title</th>
                  <th>Status</th>
                  <th>Date Started</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                ${student.cbtModules.map(module => `
                  <tr>
                    <td><strong>${module.module_title}</strong></td>
                    <td><span class="status-badge status-${module.module_status.replace('_', '-')}">${module.module_status.replace('_', ' ')}</span></td>
                    <td>${module.module_date_started ? new Date(module.module_date_started).toLocaleDateString() : 'Not started'}</td>
                    <td>${module.module_description}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<div class="no-data">No CBT modules have been assigned to this student.</div>'}
        </div>

        <div class="section">
          <div class="section-header">Educational Videos (${student.anxietyVideos.length})</div>
          ${student.anxietyVideos.length > 0 ? `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Video Title</th>
                  <th>Status</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                ${student.anxietyVideos.map(video => `
                  <tr>
                    <td><strong>${video.video_title}</strong></td>
                    <td><span class="status-badge status-${video.video_status.replace('_', '-')}">${video.video_status.replace('_', ' ')}</span></td>
                    <td>${video.video_description}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<div class="no-data">No educational videos have been assigned to this student.</div>'}
        </div>

        <div class="section">
          <div class="section-header">Anxiety Assessments (${student.anxietyAssessments.length})</div>
          ${student.anxietyAssessments.length > 0 ? `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Anxiety Level</th>
                  <th>Score</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                ${student.anxietyAssessments.map(assessment => `
                  <tr>
                    <td>${new Date(assessment.created_at).toLocaleDateString()}</td>
                    <td><span class="status-badge anxiety-${assessment.anxiety_level.toLowerCase()}">${assessment.anxiety_level}</span></td>
                    <td>${assessment.total_score}/21</td>
                    <td>${assessment.percentage}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<div class="no-data">No anxiety assessments have been completed by this student.</div>'}
        </div>

        <div class="section">
          <div class="section-header">Assigned Tasks (${student.todoItems.length})</div>
          ${student.todoItems.length > 0 ? `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Task Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                ${student.todoItems.map(todo => `
                  <tr>
                    <td><strong>${todo.title}</strong>${todo.description ? `<br><small style="color: #64748b;">${todo.description}</small>` : ''}</td>
                    <td><span class="status-badge status-${todo.status.replace('_', '-')}">${todo.status.replace('_', ' ')}</span></td>
                    <td><span class="status-badge priority-${getPriorityText(todo.priority).toLowerCase().replace(' ', '-')}">${getPriorityText(todo.priority)}</span></td>
                    <td>${todo.due_at ? new Date(todo.due_at).toLocaleDateString() : 'No due date'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<div class="no-data">No tasks or activities have been assigned to this student.</div>'}
        </div>

        <div class="footer">
          <div class="confidential">CONFIDENTIAL DOCUMENT</div>
          <p>This document contains sensitive mental health information and should be handled in accordance with privacy regulations.</p>
          <p><strong>Generated by:</strong> Anxiety Management System | <strong>Date:</strong> ${currentDate.toLocaleDateString()} | <strong>Time:</strong> ${currentDate.toLocaleTimeString()}</p>
          <p><strong>Document ID:</strong> ${student.profile.id_number}-${currentDate.getFullYear()}${(currentDate.getMonth() + 1).toString().padStart(2, '0')}${currentDate.getDate().toString().padStart(2, '0')}</p>
        </div>
      </body>
      </html>
    `;

    // Create downloadable PDF using HTML content
    const blob = new Blob([pdfContent], { type: 'text/html' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${student.profile.full_name.replace(/\s+/g, '_')}_record.html`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToWord = (student: StudentRecord) => {
    const currentDate = new Date();
    const wordContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>Official Student Record - ${student.profile.full_name}</title>
          <style>
            @page { 
              margin: 0.75in; 
              size: A4;
            }
            * {
              box-sizing: border-box;
            }
            body { 
              font-family: 'Arial', sans-serif; 
              font-size: 11pt; 
              line-height: 1.4; 
              color: #333; 
              margin: 0; 
              padding: 0;
              background: white;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #800000;
              padding-bottom: 20px;
              margin-bottom: 25px;
              background: linear-gradient(135deg, #fdf2f8 0%, #f3e8ff 100%);
              padding: 20px;
              border-radius: 8px;
            }
            .logo {
              font-size: 24pt;
              font-weight: bold;
              color: #800000;
              margin-bottom: 8px;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            .subtitle {
              font-size: 14pt;
              color: #991b1b;
              margin-bottom: 15px;
              font-style: italic;
            }
            .document-title {
              font-size: 18pt;
              font-weight: bold;
              color: #450a0a;
              margin: 15px 0;
            }
            .student-name {
              font-size: 20pt;
              font-weight: bold;
              color: #800000;
              margin: 10px 0;
            }
            .generation-info {
              font-size: 10pt;
              color: #991b1b;
              margin-top: 10px;
            }
            .section {
              margin: 20px 0;
              page-break-inside: avoid;
            }
            .section-header {
              font-size: 14pt;
              font-weight: bold;
              color: white;
              background: linear-gradient(90deg, #800000, #991b1b);
              padding: 10px 15px;
              margin-bottom: 15px;
              border-radius: 6px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 20px;
            }
            .info-item {
              background: #fdf2f8;
              border: 1px solid #f3e8ff;
              border-radius: 6px;
              padding: 12px;
            }
            .info-label {
              font-weight: bold;
              color: #800000;
              font-size: 10pt;
              margin-bottom: 4px;
            }
            .info-value {
              color: #450a0a;
              font-size: 11pt;
            }
            .data-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              background: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 1px 3px rgba(128,0,0,0.1);
            }
            .data-table th {
              background: linear-gradient(90deg, #800000, #991b1b);
              color: white;
              font-weight: bold;
              padding: 12px 10px;
              text-align: left;
              font-size: 10pt;
              border-bottom: 2px solid #800000;
            }
            .data-table td {
              padding: 10px;
              border-bottom: 1px solid #f3e8ff;
              font-size: 10pt;
              vertical-align: top;
            }
            .data-table tr:nth-child(even) {
              background-color: #fdf2f8;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 9pt;
              font-weight: bold;
              text-transform: uppercase;
            }
            .status-completed { background-color: #dcfce7; color: #166534; }
            .status-in-progress { background-color: #dbeafe; color: #1e40af; }
            .status-pending { background-color: #fef3c7; color: #92400e; }
            .status-scheduled { background-color: #dbeafe; color: #1e40af; }
            .anxiety-minimal { background-color: #dcfce7; color: #166534; }
            .anxiety-mild { background-color: #dbeafe; color: #1e40af; }
            .anxiety-moderate { background-color: #fef3c7; color: #92400e; }
            .anxiety-severe { background-color: #fee2e2; color: #dc2626; }
            .priority-urgent { background-color: #fee2e2; color: #dc2626; }
            .priority-high { background-color: #fed7aa; color: #ea580c; }
            .priority-medium { background-color: #fef3c7; color: #92400e; }
            .priority-low { background-color: #dbeafe; color: #1e40af; }
            .priority-very-low { background-color: #f1f5f9; color: #64748b; }
            .no-data {
              text-align: center;
              font-style: italic;
              color: #991b1b;
              padding: 20px;
              background: #fdf2f8;
              border-radius: 6px;
              border: 1px dashed #f3e8ff;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px solid #f3e8ff;
              text-align: center;
              font-size: 9pt;
              color: #991b1b;
              page-break-inside: avoid;
            }
            .confidential {
              background: #fee2e2;
              color: #dc2626;
              padding: 8px;
              border-radius: 4px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .signature-section {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
            }
            .signature-box {
              width: 45%;
              border-top: 1px solid #800000;
              padding-top: 10px;
              text-align: center;
            }
            @media print {
              body { print-color-adjust: exact; }
              .section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">ANXIETY MANAGEMENT SYSTEM</div>
            <div class="subtitle">Student Mental Health & Wellness Program</div>
            <div class="document-title">OFFICIAL STUDENT RECORD</div>
            <div class="student-name">${student.profile.full_name}</div>
            <div class="generation-info">
              <strong>Student ID:</strong> ${student.profile.id_number} | 
              <strong>Generated:</strong> ${currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          <div class="confidential">
            ⚠️ CONFIDENTIAL STUDENT RECORD - For Authorized Personnel Only
          </div>

          <!-- Basic Information -->
          <div class="section">
            <div class="section-header">📋 Personal Information</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Full Name</div>
                <div class="info-value">${student.profile.full_name}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Email Address</div>
                <div class="info-value">${student.profile.email}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Student ID</div>
                <div class="info-value">${student.profile.id_number}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Phone Number</div>
                <div class="info-value">${student.profile.phone_number || 'Not provided'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Emergency Contact</div>
                <div class="info-value">${student.profile.guardian_name || 'Not provided'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Emergency Phone</div>
                <div class="info-value">${student.profile.guardian_phone_number || 'Not provided'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Registration Date</div>
                <div class="info-value">${new Date(student.profile.created_at).toLocaleDateString()}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Account Status</div>
                <div class="info-value">
                  <span class="status-badge status-completed">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-header">📅 Counseling Appointments${student.appointments.length > 1 ? ` (${student.appointments.length} Sessions)` : ''}</div>
            ${student.appointments.length > 0 ? `
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Session</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  ${student.appointments.map((apt, index) => `
                    <tr>
                      <td>Session ${index + 1}</td>
                      <td>${new Date(apt.appointment_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}<br>${apt.appointment_time}</td>
                      <td><span class="status-badge status-${apt.status.toLowerCase().replace(' ', '-')}">${apt.status}</span></td>
                      <td>${apt.meeting_duration_minutes ? `${apt.meeting_duration_minutes} min` : 'N/A'}</td>
                      <td>${apt.meeting_notes || apt.notes || 'No notes recorded'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<div class="no-data">📅 No counseling appointments scheduled or completed.</div>'}
          </div>

          <div class="section">
            <div class="section-header">🧠 Cognitive Behavioral Therapy (CBT) Modules</div>
            ${student.cbtModules.length > 0 ? `
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Module</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Date Started</th>
                    <th>Date Completed</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  ${student.cbtModules.map((module, index) => `
                    <tr>
                      <td>Module ${index + 1}</td>
                      <td>${module.module_title}</td>
                      <td><span class="status-badge status-${module.module_status.toLowerCase().replace(' ', '-')}">${module.module_status}</span></td>
                      <td>${module.module_date_started ? new Date(module.module_date_started).toLocaleDateString() : 'Not started'}</td>
                      <td>${module.module_date_complete ? new Date(module.module_date_complete).toLocaleDateString() : 'Not completed'}</td>
                      <td>${module.module_description}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<div class="no-data">🧠 No CBT modules have been assigned to this student.</div>'}
          </div>

          <div class="section">
            <div class="section-header">📺 Educational Video Resources</div>
            ${student.anxietyVideos.length > 0 ? `
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Video</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Date Started</th>
                    <th>Date Completed</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  ${student.anxietyVideos.map((video, index) => `
                    <tr>
                      <td>Video ${index + 1}</td>
                      <td>${video.video_title}</td>
                      <td><span class="status-badge status-${video.video_status.toLowerCase().replace(' ', '-')}">${video.video_status}</span></td>
                      <td>${video.video_date_started ? new Date(video.video_date_started).toLocaleDateString() : 'Not started'}</td>
                      <td>${video.video_date_completed ? new Date(video.video_date_completed).toLocaleDateString() : 'Not completed'}</td>
                      <td>${video.video_description}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<div class="no-data">📺 No educational videos have been assigned to this student.</div>'}
          </div>

          <div class="section">
            <div class="section-header">📊 Anxiety Assessment History</div>
            ${student.anxietyAssessments.length > 0 ? `
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Assessment</th>
                    <th>Date Completed</th>
                    <th>Anxiety Level</th>
                    <th>Score</th>
                    <th>Percentage</th>
                    <th>Assessment ID</th>
                  </tr>
                </thead>
                <tbody>
                  ${student.anxietyAssessments.map((assessment, index) => {
                    const getAnxietyClass = (level: string): string => {
                      const levelLower = level.toLowerCase();
                      if (levelLower.includes('minimal')) return 'anxiety-minimal';
                      if (levelLower.includes('mild')) return 'anxiety-mild';
                      if (levelLower.includes('moderate')) return 'anxiety-moderate';
                      if (levelLower.includes('severe')) return 'anxiety-severe';
                      return 'anxiety-minimal';
                    };
                    return `
                    <tr>
                      <td>Assessment ${index + 1}</td>
                      <td>${new Date(assessment.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td><span class="status-badge ${getAnxietyClass(assessment.anxiety_level)}">${assessment.anxiety_level}</span></td>
                      <td>${assessment.total_score}/21</td>
                      <td>${assessment.percentage}%</td>
                      <td>${assessment.id.substring(0, 8)}</td>
                    </tr>
                  `}).join('')}
                </tbody>
              </table>
            ` : '<div class="no-data">📊 No anxiety assessments have been completed by this student.</div>'}
          </div>

          <div class="section">
            <div class="section-header">✅ Assigned Tasks & Activities</div>
            ${student.todoItems.length > 0 ? `
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Due Date</th>
                    <th>Completed</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  ${student.todoItems.map((todo, index) => {
                    const getPriorityClass = (priority: number): string => {
                      if (priority >= 5) return 'priority-urgent';
                      if (priority >= 4) return 'priority-high';
                      if (priority >= 3) return 'priority-medium';
                      if (priority >= 2) return 'priority-low';
                      return 'priority-very-low';
                    };
                    return `
                    <tr>
                      <td>Task ${index + 1}</td>
                      <td>${todo.title}</td>
                      <td><span class="status-badge status-${todo.status.toLowerCase().replace(' ', '-')}">${todo.status}</span></td>
                      <td><span class="status-badge ${getPriorityClass(todo.priority)}">${getPriorityText(todo.priority)}</span></td>
                      <td>${todo.due_at ? new Date(todo.due_at).toLocaleDateString() : 'No due date'}</td>
                      <td>${todo.completed_at ? new Date(todo.completed_at).toLocaleDateString() : 'Not completed'}</td>
                      <td>${todo.description || 'No description provided'}</td>
                    </tr>
                  `}).join('')}
                </tbody>
              </table>
            ` : '<div class="no-data">✅ No tasks or activities have been assigned to this student.</div>'}
          </div>

          <div class="signature-section">
            <div class="signature-box">
              <strong>Guidance Counselor</strong><br>
              Date: _______________
            </div>
            <div class="signature-box">
              <strong>Program Coordinator</strong><br>
              Date: _______________
            </div>
          </div>

          <div class="footer">
            <p><strong>CONFIDENTIAL DOCUMENT</strong></p>
            <p>This document contains sensitive mental health information and should be handled in accordance with privacy regulations.</p>
            <p>Generated by Anxiety Management System on ${currentDate.toLocaleDateString()} at ${currentDate.toLocaleTimeString()}</p>
            <p>Document ID: ${student.profile.id_number}-${currentDate.getFullYear()}${(currentDate.getMonth() + 1).toString().padStart(2, '0')}${currentDate.getDate().toString().padStart(2, '0')}</p>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([wordContent], { type: 'application/msword' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${student.profile.full_name.replace(/\s+/g, '_')}_record.doc`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <FaCheck className="text-green-500" />;
      case 'in_progress': return <FaPlay className="text-blue-500" />;
      case 'paused': return <FaPause className="text-yellow-500" />;
      default: return <FaBookOpen className="text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'text-red-600 bg-red-100';
      case 2: return 'text-orange-600 bg-orange-100';
      case 3: return 'text-yellow-600 bg-yellow-100';
      case 4: return 'text-blue-600 bg-blue-100';
      case 5: return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityText = (priority: number) => {
    switch (priority) {
      case 1: return 'Urgent';
      case 2: return 'High';
      case 3: return 'Medium';
      case 4: return 'Low';
      case 5: return 'Very Low';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
        <div className="flex items-center justify-center">
          <FaSpinner className="animate-spin text-2xl text-blue-500 mr-3" />
          <span className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Loading student records...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-xl shadow-lg p-6`}>
      
      {/* Header */}
      <div className="flex items-center mb-6">
        <div className={`p-3 rounded-xl ${darkMode ? 'bg-pink-600/20' : 'bg-pink-100'} mr-4`}>
          <FaFileAlt className={`text-2xl ${darkMode ? 'text-pink-400' : 'text-pink-600'}`} />
        </div>
        <div>
          <h2 className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Student Records</h2>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Comprehensive student data and progress tracking</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <input
            type="text"
            placeholder="Search students by name, email, or ID number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent focus:outline-none transition-all duration-200 ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 hover:border-gray-500' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 hover:border-gray-400'
            }`}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 ${
                darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-500 hover:bg-gray-200'
              }`}
            >
              <FaTimes className="text-sm" />
            </button>
          )}
        </div>
        {searchTerm && (
          <div className="mt-2 text-sm text-gray-500">
            Found {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} matching "{searchTerm}"
          </div>
        )}
      </div>

      {/* Enhanced Summary Stats with Gradients */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className={`p-4 rounded-xl bg-gradient-to-br ${
          darkMode 
            ? 'from-blue-900/20 to-blue-800/30 border-blue-600/30' 
            : 'from-blue-50 to-blue-100 border-blue-200'
        } border-2 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 backdrop-blur-sm`}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-blue-200' : 'text-blue-600'}`}>Total Students</p>
              <h3 className={`text-2xl font-bold mt-0.5 ${darkMode ? 'text-white' : 'text-blue-900'}`}>{students.length}</h3>
            </div>
            <div className={`p-2 bg-blue-500 rounded-lg`}>
              <FaUsers className="text-white text-lg" />
            </div>
          </div>
        </div>
        
        <div className={`p-4 rounded-xl bg-gradient-to-br ${
          darkMode 
            ? 'from-emerald-900/20 to-emerald-800/30 border-emerald-600/30' 
            : 'from-emerald-50 to-green-100 border-emerald-200'
        } border-2 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 backdrop-blur-sm`}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-emerald-200' : 'text-emerald-600'}`}>Total Appointments</p>
              <h3 className={`text-2xl font-bold mt-0.5 ${darkMode ? 'text-white' : 'text-emerald-900'}`}>
                {students.reduce((total, student) => total + student.appointments.length, 0)}
              </h3>
            </div>
            <div className={`p-2 bg-emerald-500 rounded-lg`}>
              <FaCalendarAlt className="text-white text-lg" />
            </div>
          </div>
        </div>
        
        <div className={`p-4 rounded-xl bg-gradient-to-br ${
          darkMode 
            ? 'from-purple-900/20 to-purple-800/30 border-purple-600/30' 
            : 'from-purple-50 to-purple-100 border-purple-200'
        } border-2 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 backdrop-blur-sm`}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-purple-200' : 'text-purple-600'}`}>Total CBT Modules</p>
              <h3 className={`text-2xl font-bold mt-0.5 ${darkMode ? 'text-white' : 'text-purple-900'}`}>
                {students.reduce((total, student) => total + student.cbtModules.length, 0)}
              </h3>
            </div>
            <div className={`p-2 bg-purple-500 rounded-lg`}>
              <FaBrain className="text-white text-lg" />
            </div>
          </div>
        </div>
        
        <div className={`p-4 rounded-xl bg-gradient-to-br ${
          darkMode 
            ? 'from-orange-900/20 to-orange-800/30 border-orange-600/30' 
            : 'from-orange-50 to-orange-100 border-orange-200'
        } border-2 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 backdrop-blur-sm`}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-orange-200' : 'text-orange-600'}`}>Total Tasks</p>
              <h3 className={`text-2xl font-bold mt-0.5 ${darkMode ? 'text-white' : 'text-orange-900'}`}>
                {students.reduce((total, student) => total + student.todoItems.length, 0)}
              </h3>
            </div>
            <div className={`p-2 bg-orange-500 rounded-lg`}>
              <FaTasks className="text-white text-lg" />
            </div>
          </div>
        </div>
        
        <div className={`p-4 rounded-xl bg-gradient-to-br ${
          darkMode 
            ? 'from-cyan-700 to-teal-900 border-cyan-600/30' 
            : 'from-cyan-50 to-teal-100 border-teal-200'
        } border-2 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 backdrop-blur-sm`}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-cyan-200' : 'text-teal-600'}`}>Total Videos</p>
              <h3 className={`text-2xl font-bold mt-0.5 ${darkMode ? 'text-white' : 'text-teal-900'}`}>
                {students.reduce((total, student) => total + student.anxietyVideos.length, 0)}
              </h3>
            </div>
            <div className={`p-2 bg-teal-500 rounded-lg`}>
              <FaVideo className="text-white text-lg" />
            </div>
          </div>
        </div>
        
        <div className={`p-4 rounded-xl bg-gradient-to-br ${
          darkMode 
            ? 'from-pink-700 to-pink-900 border-pink-600/30' 
            : 'from-pink-50 to-pink-100 border-pink-200'
        } border-2 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 backdrop-blur-sm`}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-pink-200' : 'text-pink-600'}`}>Total Assessments</p>
              <h3 className={`text-2xl font-bold mt-0.5 ${darkMode ? 'text-white' : 'text-pink-900'}`}>
                {students.reduce((total, student) => total + student.anxietyAssessments.length, 0)}
              </h3>
            </div>
            <div className={`p-2 bg-pink-500 rounded-lg`}>
              <FaClipboardList className="text-white text-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {filteredStudents.map((student) => (
          <div
            key={student.profile.id}
            className={`${
              student.profile.gender?.toLowerCase() === 'male' 
                ? darkMode 
                  ? 'border-blue-600/40' 
                  : 'border-blue-200/70'
                : student.profile.gender?.toLowerCase() === 'female'
                ? darkMode
                  ? 'border-pink-600/40'
                  : 'border-pink-200/70'
                : darkMode
                  ? 'border-yellow-600/40'
                  : 'border-yellow-200/70'
            } border-2 rounded-xl p-4 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 backdrop-blur-sm`}
            onClick={() => openStudentModal(student)}
          >
            {/* Student Header */}
            <div className="flex flex-col items-center mb-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 shadow-lg bg-gradient-to-br ${
                student.profile.gender?.toLowerCase() === 'male' 
                  ? 'from-blue-500 to-blue-600'
                  : student.profile.gender?.toLowerCase() === 'female'
                  ? 'from-pink-500 to-pink-600'
                  : 'from-yellow-500 to-yellow-600'
              }`}>
                <FaUser className="text-white text-lg" />
              </div>
              <div className="text-center w-full">
                <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                  {student.profile.full_name}
                </h3>
                <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'} font-medium truncate`}>
                  {student.profile.id_number}
                </p>
              </div>
            </div>

            {/* Student Info */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center text-xs">
                <div className={`p-1 rounded-lg mr-2 ${darkMode ? 'bg-gray-600/50' : 'bg-gray-100'}`}>
                  <FaEnvelope className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                </div>
                <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} truncate flex-1`}>
                  {student.profile.email}
                </span>
              </div>
              <div className="flex items-center text-xs">
                <div className={`p-1 rounded-lg mr-2 ${darkMode ? 'bg-gray-600/50' : 'bg-gray-100'}`}>
                  <FaSchool className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                </div>
                <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} truncate flex-1`}>
                  {student.profile.school}
                </span>
              </div>
            </div>

            {/* Compact Summary Stats - All 5 Metrics */}
            <div className="space-y-1.5 mb-3">
              {/* Row 1: Appointments & CBT Modules */}
              <div className="grid grid-cols-2 gap-1.5">
                <div className={`text-center p-1.5 rounded-md border ${
                  darkMode ? 'border-green-500/30' : 'border-green-200'
                } hover:scale-105 transition-transform`}>
                  <div className={`font-bold text-xs ${darkMode ? 'text-white' : 'text-green-900'}`}>
                    {student.appointments.length}
                  </div>
                  <div className={`text-xs font-medium ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
                    Appointments
                  </div>
                </div>
                <div className={`text-center p-1.5 rounded-md border ${
                  darkMode ? 'border-purple-500/30' : 'border-purple-200'
                } hover:scale-105 transition-transform`}>
                  <div className={`font-bold text-xs ${darkMode ? 'text-white' : 'text-purple-900'}`}>
                    {student.cbtModules.length}
                  </div>
                  <div className={`text-xs font-medium ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                    Modules
                  </div>
                </div>
              </div>
              
              {/* Row 2: Videos & Tasks */}
              <div className="grid grid-cols-2 gap-1.5">
                <div className={`text-center p-1.5 rounded-md border ${
                  darkMode ? 'border-cyan-500/30' : 'border-teal-200'
                } hover:scale-105 transition-transform`}>
                  <div className={`font-bold text-xs ${darkMode ? 'text-white' : 'text-teal-900'}`}>
                    {student.anxietyVideos.length}
                  </div>
                  <div className={`text-xs font-medium ${darkMode ? 'text-cyan-300' : 'text-teal-700'}`}>
                    Videos
                  </div>
                </div>
                <div className={`text-center p-1.5 rounded-md border ${
                  darkMode ? 'border-orange-500/30' : 'border-orange-200'
                } hover:scale-105 transition-transform`}>
                  <div className={`font-bold text-xs ${darkMode ? 'text-white' : 'text-orange-900'}`}>
                    {student.todoItems.length}
                  </div>
                  <div className={`text-xs font-medium ${darkMode ? 'text-orange-300' : 'text-orange-700'}`}>
                    Tasks
                  </div>
                </div>
              </div>
              
              {/* Row 3: Assessments (Full Width) */}
              <div className="grid grid-cols-1">
                <div className={`text-center p-1.5 rounded-md border ${
                  darkMode ? 'border-pink-500/30' : 'border-pink-200'
                } hover:scale-105 transition-transform`}>
                  <div className={`font-bold text-xs ${darkMode ? 'text-white' : 'text-pink-900'}`}>
                    {student.anxietyAssessments.length}
                  </div>
                  <div className={`text-xs font-medium ${darkMode ? 'text-pink-300' : 'text-pink-700'}`}>
                    Assessments
                  </div>
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Enhanced Student Detail Modal */}
      {showStudentModal && selectedStudent && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={closeStudentModal}
        >
          <div 
            className={`${
              darkMode 
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-600/30' 
                : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
            } rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 backdrop-blur-sm`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Enhanced Modal Header */}
            <div className={`${
              darkMode 
                ? 'bg-gradient-to-r from-gray-700/50 to-gray-800/50 border-gray-600/30' 
                : 'bg-gradient-to-r from-gray-50/50 to-gray-100/50 border-gray-200'
            } px-6 py-5 border-b flex justify-between items-center backdrop-blur-sm`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl shadow-lg ${
                  selectedStudent.profile.gender?.toLowerCase() === 'male' 
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                    : selectedStudent.profile.gender?.toLowerCase() === 'female'
                    ? 'bg-gradient-to-br from-pink-500 to-pink-600'
                    : 'bg-gradient-to-br from-yellow-500 to-yellow-600'
                }`}>
                  <FaUser className="text-white text-xl" />
                </div>
                <div>
                  <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedStudent.profile.full_name}
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Complete Student Record & Progress
                  </p>
                </div>
              </div>
              
              {/* Export Buttons */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportToCSV(selectedStudent)}
                    className={`flex items-center gap-0.5 px-1.5 py-1 rounded-md transition-all duration-200 hover:scale-105 ${
                      darkMode 
                        ? 'bg-green-600/20 hover:bg-green-600/30 text-green-300 border border-green-500/30' 
                        : 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200'
                    }`}
                    title="Export to CSV"
                  >
                    <FaFileCsv className="text-xs" />
                    <span className="text-xs">CSV</span>
                  </button>
                  
                  <button
                    onClick={() => exportToExcel(selectedStudent)}
                    className={`flex items-center gap-0.5 px-1.5 py-1 rounded-md transition-all duration-200 hover:scale-105 ${
                      darkMode 
                        ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30' 
                        : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                    }`}
                    title="Export to Excel"
                  >
                    <FaFileExcel className="text-xs" />
                    <span className="text-xs">Excel</span>
                  </button>
                  
                  <button
                    onClick={() => exportToWord(selectedStudent)}
                    className={`flex items-center gap-0.5 px-1.5 py-1 rounded-md transition-all duration-200 hover:scale-105 ${
                      darkMode 
                        ? 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30' 
                        : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                    }`}
                    title="Export to Word"
                  >
                    <FaFileWord className="text-xs" />
                    <span className="text-xs">Word</span>
                  </button>
                  
                  <button
                    onClick={() => exportToPDF(selectedStudent)}
                    className={`flex items-center gap-0.5 px-1.5 py-1 rounded-md transition-all duration-200 hover:scale-105 ${
                      darkMode 
                        ? 'bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30' 
                        : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                    }`}
                    title="Export to PDF"
                  >
                    <FaFilePdf className="text-xs" />
                    <span className="text-xs">PDF</span>
                  </button>
                </div>
                
                <button
                  onClick={closeStudentModal}
                  className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-105 ${
                    darkMode 
                      ? 'hover:bg-gray-600/50 text-gray-300 hover:text-white' 
                      : 'hover:bg-gray-200/50 text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FaTimes className="text-lg" />
                </button>
              </div>
            </div>

            {/* Enhanced Modal Content */}
            <div className="p-6 space-y-6">
              {/* Enhanced Student Information */}
              <div>
                <h4 className={`text-xl font-bold mb-4 bg-gradient-to-r ${
                  darkMode 
                    ? 'from-blue-400 to-purple-400' 
                    : 'from-blue-600 to-purple-600'
                } bg-clip-text text-transparent`}>
                  Student Information
                </h4>
                <div className={`${
                  darkMode 
                    ? 'bg-gradient-to-br from-gray-700/50 to-gray-800/50 border-gray-600/30' 
                    : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
                } rounded-xl p-6 border-2 shadow-lg backdrop-blur-sm`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Full Name</p>
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {selectedStudent.profile.full_name}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>ID Number</p>
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {selectedStudent.profile.id_number}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Email</p>
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {selectedStudent.profile.email}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Phone</p>
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {selectedStudent.profile.phone_number || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>School</p>
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {selectedStudent.profile.school}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Course & Year</p>
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {selectedStudent.profile.course} - Year {selectedStudent.profile.year_level}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Guardian</p>
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {selectedStudent.profile.guardian_name || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Last Activity</p>
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {new Date(selectedStudent.profile.last_activity_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Appointments */}
              <div>
                <h4 className={`text-xl font-bold mb-4 bg-gradient-to-r ${
                  darkMode 
                    ? 'from-green-400 to-emerald-400' 
                    : 'from-green-600 to-emerald-600'
                } bg-clip-text text-transparent`}>
                  <FaCalendarAlt className="inline mr-2 text-green-500" />
                  Appointments & Schedule{selectedStudent.appointments.length > 1 ? ` (${selectedStudent.appointments.length})` : ''}
                </h4>
                {selectedStudent.appointments.length > 0 ? (
                  <div className="grid gap-4">
                    {selectedStudent.appointments.map((apt) => (
                      <div key={apt.id} className={`p-4 rounded-xl border ${
                        darkMode 
                          ? 'bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-700/50' 
                          : 'bg-gradient-to-r from-green-50/80 to-emerald-50/80 border-green-200/50'
                      } backdrop-blur-sm`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              apt.status === 'Completed' 
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : apt.status === 'Scheduled'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : apt.status === 'In Progress'
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                : 'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}>
                              {apt.status || 'Unknown'}
                            </div>
                            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {apt.appointment_date ? new Date(apt.appointment_date).toLocaleDateString() : 'Date not set'}
                              {apt.appointment_time ? ` at ${apt.appointment_time}` : ''}
                            </span>
                          </div>
                        </div>
                        {(apt.notes || apt.meeting_notes) && (
                          <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            <strong>Notes:</strong> {apt.notes || apt.meeting_notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} italic`}>
                    No appointments scheduled yet.
                  </p>
                )}
              </div>

              {/* CBT Modules */}
              <div>
                <h4 className={`text-xl font-bold mb-4 bg-gradient-to-r ${
                  darkMode 
                    ? 'from-purple-400 to-violet-400' 
                    : 'from-purple-600 to-violet-600'
                } bg-clip-text text-transparent`}>
                  <FaBrain className="inline mr-2 text-purple-500" />
                  CBT Modules Assigned ({selectedStudent.cbtModules.length})
                </h4>
                {selectedStudent.cbtModules.length > 0 ? (
                  <div className="grid gap-4">
                    {selectedStudent.cbtModules.map((module) => (
                      <div key={module.id} className={`p-4 rounded-xl border ${
                        darkMode 
                          ? 'bg-gradient-to-r from-purple-900/20 to-violet-900/20 border-purple-700/50' 
                          : 'bg-gradient-to-r from-purple-50/80 to-violet-50/80 border-purple-200/50'
                      } backdrop-blur-sm`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              module.module_status === 'completed' 
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : module.module_status === 'in_progress'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : module.module_status === 'paused'
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                : 'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}>
                              {module.module_status.replace('_', ' ')}
                            </div>
                            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {module.module_title}
                            </span>
                          </div>
                          <div className="flex items-center">
                            {getStatusIcon(module.module_status)}
                          </div>
                        </div>
                        <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                          <strong>Description:</strong> {module.module_description}
                        </div>
                        {module.module_date_started && (
                          <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            <strong>Started:</strong> {new Date(module.module_date_started).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} italic`}>
                    No CBT modules assigned yet.
                  </p>
                )}
              </div>

              {/* Anxiety Videos */}
              <div>
                <h4 className={`text-xl font-bold mb-4 bg-gradient-to-r ${
                  darkMode 
                    ? 'from-cyan-400 to-teal-400' 
                    : 'from-cyan-600 to-teal-600'
                } bg-clip-text text-transparent`}>
                  <FaVideo className="inline mr-2 text-teal-500" />
                  Anxiety Videos Assigned ({selectedStudent.anxietyVideos.length})
                </h4>
                {selectedStudent.anxietyVideos.length > 0 ? (
                  <div className="grid gap-4">
                    {selectedStudent.anxietyVideos.map((video) => (
                      <div key={video.id} className={`p-4 rounded-xl border ${
                        darkMode 
                          ? 'bg-gradient-to-r from-cyan-900/20 to-teal-900/20 border-cyan-700/50' 
                          : 'bg-gradient-to-r from-cyan-50/80 to-teal-50/80 border-teal-200/50'
                      } backdrop-blur-sm`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              video.video_status === 'completed' 
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : video.video_status === 'in_progress'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : video.video_status === 'paused'
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                : 'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}>
                              {video.video_status.replace('_', ' ')}
                            </div>
                            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {video.video_title}
                            </span>
                          </div>
                          <div className="flex items-center">
                            {getStatusIcon(video.video_status)}
                          </div>
                        </div>
                        <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                          <strong>Description:</strong> {video.video_description}
                        </div>
                        <a 
                          href={video.video_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={`text-sm font-medium text-blue-500 hover:text-blue-700 transition-colors inline-flex items-center gap-1`}
                        >
                          <FaEye className="text-xs" />
                          View Video
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} italic`}>
                    No anxiety videos assigned yet.
                  </p>
                )}
              </div>

              {/* Anxiety Assessments */}
              <div>
                <h4 className={`text-xl font-bold mb-4 bg-gradient-to-r ${
                  darkMode 
                    ? 'from-purple-400 to-pink-400' 
                    : 'from-purple-600 to-pink-600'
                } bg-clip-text text-transparent`}>
                  <FaClipboardList className="inline mr-2 text-purple-500" />
                  Anxiety Assessments ({selectedStudent.anxietyAssessments.length})
                </h4>
                {selectedStudent.anxietyAssessments.length > 0 ? (
                  <div className="grid gap-4">
                    {selectedStudent.anxietyAssessments.map((assessment) => (
                      <div key={assessment.id} className={`p-4 rounded-xl border ${
                        darkMode 
                          ? 'bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-purple-700/50' 
                          : 'bg-gradient-to-r from-purple-50/80 to-pink-50/80 border-purple-200/50'
                      } backdrop-blur-sm`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              assessment.anxiety_level === 'Minimal' 
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : assessment.anxiety_level === 'Mild'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : assessment.anxiety_level === 'Moderate'
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                              {assessment.anxiety_level}
                            </div>
                            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              Score: {assessment.total_score}/21 ({assessment.percentage}%)
                            </span>
                          </div>
                          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {new Date(assessment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <strong>Assessment Date:</strong> {new Date(assessment.created_at).toLocaleDateString()} at {new Date(assessment.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} italic`}>
                    No anxiety assessments completed yet.
                  </p>
                )}
              </div>

              {/* Todo Items */}
              <div>
                <h4 className={`text-xl font-bold mb-4 bg-gradient-to-r ${
                  darkMode 
                    ? 'from-indigo-400 to-purple-400' 
                    : 'from-indigo-600 to-purple-600'
                } bg-clip-text text-transparent`}>
                  <FaTasks className="inline mr-2 text-indigo-500" />
                  Tasks & To-Do Items ({selectedStudent.todoItems.length})
                </h4>
                {selectedStudent.todoItems.length > 0 ? (
                  <div className="grid gap-4">
                    {selectedStudent.todoItems.map((todo) => (
                      <div key={todo.id} className={`p-4 rounded-xl border ${
                        darkMode 
                          ? 'bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border-indigo-700/50' 
                          : 'bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border-indigo-200/50'
                      } backdrop-blur-sm`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              todo.status === 'completed' 
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : todo.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}>
                              {todo.status.replace('_', ' ')}
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(todo.priority)} border`}>
                              {getPriorityText(todo.priority)}
                            </div>
                            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {todo.title}
                            </span>
                          </div>
                        </div>
                        {todo.description && (
                          <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                            <strong>Description:</strong> {todo.description}
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-sm">
                          {todo.category && (
                            <div className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              <strong>Category:</strong> {todo.category}
                            </div>
                          )}
                          {todo.due_at && (
                            <div className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              <strong>Due:</strong> {new Date(todo.due_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} italic`}>
                    No tasks assigned yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No students message */}
      {filteredStudents.length === 0 && (
        <div className="text-center py-8">
          <FaUsers className={`mx-auto text-4xl ${darkMode ? 'text-gray-600' : 'text-gray-400'} mb-4`} />
          <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {searchTerm ? 'No students found matching your search.' : 'No students found.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Records; 