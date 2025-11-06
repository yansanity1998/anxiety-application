import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  FaHandshake, 
  FaUserMd,
  FaPlus,
  FaSearch,
  FaFilter,
  FaTrash,
  FaEdit,
  FaInfoCircle,
  FaClock,
  FaCheck,
  FaDownload,
  FaFileWord,
  FaFilePdf,
  FaTimes,
  FaUpload,
  FaPaperclip,
  FaSave
} from 'react-icons/fa';

interface Student {
  id: string;
  full_name: string;
  email: string;
}

interface Referral {
  id: string;
  student_id: string;
  student_name: string;
  
  // Referral source
  referred_by_faculty: boolean;
  referred_by_staff: boolean;
  referred_by_parent_guardian: boolean;
  referred_by_peer: boolean;
  referred_by_self: boolean;
  referred_by_others: boolean;
  referred_by_others_specify?: string;
  
  // Preferred counseling mode
  preferred_face_to_face_individual: boolean;
  preferred_face_to_face_group: boolean;
  preferred_online: boolean;
  
  // Reasons for referral
  reason_academic_concerns: boolean;
  reason_behavioral_issues: boolean;
  reason_emotional_psychological_concerns: boolean;
  reason_career_counseling: boolean;
  reason_peer_relationship_social_adjustment: boolean;
  reason_family_concerns: boolean;
  reason_personal_concerns: boolean;
  reason_psychological_assessment_request: boolean;
  reason_others: boolean;
  reason_others_specify?: string;
  
  // Form content
  brief_description_of_concern: string;
  immediate_action_taken?: string;
  
  // Signatures
  requested_by_signature?: string;
  requested_by_printed_name?: string;
  noted_by_principal_dean?: string;
  
  // System fields
  urgency_level: string;
  referral_status: string;
  created_at: string;
  email_sent: boolean;
  attachments?: AttachedFile[];
}

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content?: string;
  url?: string;
  file?: File;
}

interface ReferralProps {
  darkMode: boolean;
}

const Referral = ({ darkMode }: ReferralProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [dataCache, setDataCache] = useState<{students: Student[], referrals: Referral[], timestamp: number} | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [alert, setAlert] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    // Referral source
    referred_by_faculty: false,
    referred_by_staff: false,
    referred_by_parent_guardian: false,
    referred_by_peer: false,
    referred_by_self: false,
    referred_by_others: false,
    referred_by_others_specify: '',
    
    // Preferred counseling mode
    preferred_face_to_face_individual: false,
    preferred_face_to_face_group: false,
    preferred_online: false,
    
    // Reasons for referral
    reason_academic_concerns: false,
    reason_behavioral_issues: false,
    reason_emotional_psychological_concerns: false,
    reason_career_counseling: false,
    reason_peer_relationship_social_adjustment: false,
    reason_family_concerns: false,
    reason_personal_concerns: false,
    reason_psychological_assessment_request: false,
    reason_others: false,
    reason_others_specify: '',
    
    // Form content
    brief_description_of_concern: '',
    immediate_action_taken: '',
    
    // Signatures
    requested_by_signature: '',
    requested_by_printed_name: '',
    noted_by_principal_dean: '',
    
    // System fields
    urgency_level: 'medium'
  });

  // File attachment state
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    // Referral source
    referred_by_faculty: false,
    referred_by_staff: false,
    referred_by_parent_guardian: false,
    referred_by_peer: false,
    referred_by_self: false,
    referred_by_others: false,
    referred_by_others_specify: '',
    
    // Preferred counseling mode
    preferred_face_to_face_individual: false,
    preferred_face_to_face_group: false,
    preferred_online: false,
    
    // Reasons for referral
    reason_academic_concerns: false,
    reason_behavioral_issues: false,
    reason_emotional_psychological_concerns: false,
    reason_career_counseling: false,
    reason_peer_relationship_social_adjustment: false,
    reason_family_concerns: false,
    reason_personal_concerns: false,
    reason_psychological_assessment_request: false,
    reason_others: false,
    reason_others_specify: '',
    
    // Form content
    brief_description_of_concern: '',
    immediate_action_taken: '',
    
    // Signatures
    requested_by_signature: '',
    requested_by_printed_name: '',
    noted_by_principal_dean: '',
    
    // System fields
    urgency_level: 'medium'
  });



  const handleReferralClick = (referral: Referral) => {
    setSelectedReferral(referral);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setSelectedReferral(null);
    setShowDetailModal(false);
    setIsEditing(false);
  };


  // Edit functions
  const startEditing = () => {
    if (selectedReferral) {
      setEditFormData({
        // Referral source
        referred_by_faculty: selectedReferral.referred_by_faculty,
        referred_by_staff: selectedReferral.referred_by_staff,
        referred_by_parent_guardian: selectedReferral.referred_by_parent_guardian,
        referred_by_peer: selectedReferral.referred_by_peer,
        referred_by_self: selectedReferral.referred_by_self,
        referred_by_others: selectedReferral.referred_by_others,
        referred_by_others_specify: selectedReferral.referred_by_others_specify || '',
        
        // Preferred counseling mode
        preferred_face_to_face_individual: selectedReferral.preferred_face_to_face_individual,
        preferred_face_to_face_group: selectedReferral.preferred_face_to_face_group,
        preferred_online: selectedReferral.preferred_online,
        
        // Reasons for referral
        reason_academic_concerns: selectedReferral.reason_academic_concerns,
        reason_behavioral_issues: selectedReferral.reason_behavioral_issues,
        reason_emotional_psychological_concerns: selectedReferral.reason_emotional_psychological_concerns,
        reason_career_counseling: selectedReferral.reason_career_counseling,
        reason_peer_relationship_social_adjustment: selectedReferral.reason_peer_relationship_social_adjustment,
        reason_family_concerns: selectedReferral.reason_family_concerns,
        reason_personal_concerns: selectedReferral.reason_personal_concerns,
        reason_psychological_assessment_request: selectedReferral.reason_psychological_assessment_request,
        reason_others: selectedReferral.reason_others,
        reason_others_specify: selectedReferral.reason_others_specify || '',
        
        // Form content
        brief_description_of_concern: selectedReferral.brief_description_of_concern,
        immediate_action_taken: selectedReferral.immediate_action_taken || '',
        
        // Signatures
        requested_by_signature: selectedReferral.requested_by_signature || '',
        requested_by_printed_name: selectedReferral.requested_by_printed_name || '',
        noted_by_principal_dean: selectedReferral.noted_by_principal_dean || '',
        
        // System fields
        urgency_level: selectedReferral.urgency_level
      });
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditFormData({
      // Referral source
      referred_by_faculty: false,
      referred_by_staff: false,
      referred_by_parent_guardian: false,
      referred_by_peer: false,
      referred_by_self: false,
      referred_by_others: false,
      referred_by_others_specify: '',
      
      // Preferred counseling mode
      preferred_face_to_face_individual: false,
      preferred_face_to_face_group: false,
      preferred_online: false,
      
      // Reasons for referral
      reason_academic_concerns: false,
      reason_behavioral_issues: false,
      reason_emotional_psychological_concerns: false,
      reason_career_counseling: false,
      reason_peer_relationship_social_adjustment: false,
      reason_family_concerns: false,
      reason_personal_concerns: false,
      reason_psychological_assessment_request: false,
      reason_others: false,
      reason_others_specify: '',
      
      // Form content
      brief_description_of_concern: '',
      immediate_action_taken: '',
      
      // Signatures
      requested_by_signature: '',
      requested_by_printed_name: '',
      noted_by_principal_dean: '',
      
      // System fields
      urgency_level: 'medium'
    });
  };

  const saveEdit = async () => {
    if (!selectedReferral) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('referrals')
        .update(editFormData)
        .eq('id', selectedReferral.id);

      if (error) throw error;

      setAlert({type: 'success', message: 'Referral updated successfully!'});
      setIsEditing(false);
      fetchReferrals();
      
      // Update the selected referral with new data
      setSelectedReferral({
        ...selectedReferral,
        ...editFormData
      });
      
      setTimeout(() => setAlert(null), 4000);
    } catch (error) {
      console.error('Error updating referral:', error);
      setAlert({type: 'error', message: 'Failed to update referral. Please try again.'});
      setTimeout(() => setAlert(null), 5000);
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setInitialLoading(true);
    try {
      // Check if we have recent cached data (less than 5 minutes old)
      if (dataCache && Date.now() - dataCache.timestamp < 5 * 60 * 1000) {
        setStudents(dataCache.students);
        setReferrals(dataCache.referrals);
        setInitialLoading(false);
        return;
      }

      // Fetch both data sets in parallel for better performance
      await Promise.all([fetchStudents(), fetchReferrals()]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (showDetailModal || showCreateForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to restore scrolling when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDetailModal, showCreateForm]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .in('role', ['student', 'user'])
        .neq('role', 'admin')
        .neq('role', 'guidance')
        .order('full_name');

      if (error) throw error;
      const studentsData = data || [];
      setStudents(studentsData);
      
      // Update cache
      setDataCache(prev => ({
        students: studentsData,
        referrals: prev?.referrals || [],
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchReferrals = async () => {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          id, student_id, student_name, referred_by_faculty, referred_by_staff,
          referred_by_parent_guardian, referred_by_peer, referred_by_self, referred_by_others,
          referred_by_others_specify, preferred_face_to_face_individual, preferred_face_to_face_group,
          preferred_online, reason_academic_concerns, reason_behavioral_issues,
          reason_emotional_psychological_concerns, reason_career_counseling,
          reason_peer_relationship_social_adjustment, reason_family_concerns,
          reason_personal_concerns, reason_psychological_assessment_request,
          reason_others, reason_others_specify, brief_description_of_concern,
          immediate_action_taken, requested_by_signature, requested_by_printed_name,
          noted_by_principal_dean, urgency_level, referral_status, created_at,
          email_sent, uploaded_files,
          student:profiles!referrals_student_id_fkey(full_name),
          referred_by_profile:profiles!referrals_referred_by_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100); // Limit initial load for better performance

      if (error) throw error;
      
      const formattedReferrals = data?.map(referral => ({
        ...referral,
        student_name: (referral.student as any)?.full_name || referral.student_name || 'Unknown Student',
        attachments: referral.uploaded_files ? JSON.parse(referral.uploaded_files) : []
      })) || [];
      
      setReferrals(formattedReferrals);
      
      // Update cache
      setDataCache(prev => ({
        students: prev?.students || [],
        referrals: formattedReferrals,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error fetching referrals:', error);
      setReferrals([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      // First check if referrals table exists
      const { error: tableCheckError } = await supabase
        .from('referrals')
        .select('id')
        .limit(1);
      
      if (tableCheckError) {
        if (tableCheckError.message.includes('relation "referrals" does not exist')) {
          setAlert({type: 'error', message: 'Referrals table not found. Please run the database migration first.'});
        setTimeout(() => setAlert(null), 5000);
          setLoading(false);
          return;
        }
        throw tableCheckError;
      }
      
      // Get the profile ID for the current user (not the auth user ID)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('user_id', userData.user?.id)
        .single();
      
      if (profileError) {
        console.error('Error getting profile:', profileError);
        throw new Error('Failed to get user profile');
      }
      
      // Get student name
      const selectedStudentData = students.find(s => s.id === selectedStudent);
      
      console.log('Inserting referral with data:', {
        student_id: selectedStudent,
        student_name: selectedStudentData?.full_name,
        referred_by: profileData.id,
        ...formData
      });
      
      const { error } = await supabase
        .from('referrals')
        .insert([{
          student_id: selectedStudent,
          student_name: selectedStudentData?.full_name,
          referred_by: profileData.id,
          ...formData,
          requested_by_printed_name: formData.requested_by_printed_name || profileData.full_name,
          uploaded_files: attachedFiles.length > 0 ? JSON.stringify(await Promise.all(attachedFiles.map(async (file) => {
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(file.file as File);
            });
            return {
              id: file.id,
              name: file.name,
              size: file.size,
              type: file.type,
              content: base64
            };
          }))) : null
        }])
        .select();

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }

      setAlert({type: 'success', message: 'Referral created successfully!'});

      // Reset form
      setFormData({
        // Referral source
        referred_by_faculty: false,
        referred_by_staff: false,
        referred_by_parent_guardian: false,
        referred_by_peer: false,
        referred_by_self: false,
        referred_by_others: false,
        referred_by_others_specify: '',
        
        // Preferred counseling mode
        preferred_face_to_face_individual: false,
        preferred_face_to_face_group: false,
        preferred_online: false,
        
        // Reasons for referral
        reason_academic_concerns: false,
        reason_behavioral_issues: false,
        reason_emotional_psychological_concerns: false,
        reason_career_counseling: false,
        reason_peer_relationship_social_adjustment: false,
        reason_family_concerns: false,
        reason_personal_concerns: false,
        reason_psychological_assessment_request: false,
        reason_others: false,
        reason_others_specify: '',
        
        // Form content
        brief_description_of_concern: '',
        immediate_action_taken: '',
        
        // Signatures
        requested_by_signature: '',
        requested_by_printed_name: '',
        noted_by_principal_dean: '',
        
        // System fields
        urgency_level: 'medium'
      });
      setSelectedStudent('');
      setAttachedFiles([]);
      
      // Close modal first
      setShowCreateForm(false);
      
      // Wait a bit for the modal to close, then refresh referrals
      setTimeout(() => {
        fetchReferrals();
      }, 100);
      
      setTimeout(() => setAlert(null), 4000);
      
    } catch (error) {
      console.error('Error creating referral:', error);
      setAlert({type: 'error', message: 'Failed to create referral. Please try again.'});
      setTimeout(() => setAlert(null), 5000);
    } finally {
      setLoading(false);
    }
  };







  const deleteReferral = async (referralId: string) => {
    try {
      const { error } = await supabase
        .from('referrals')
        .delete()
        .eq('id', referralId);

      if (error) throw error;

      fetchReferrals();
      setDeleteConfirm(null);
      
      setAlert({type: 'success', message: 'Referral deleted successfully!'});
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      console.error('Error deleting referral:', error);
      setAlert({type: 'error', message: 'Failed to delete referral. Please try again.'});
      setTimeout(() => setAlert(null), 5000);
    }
  };



  const filteredReferrals = referrals.filter(referral => {
    const matchesSearch = referral.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (referral.brief_description_of_concern && referral.brief_description_of_concern.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || referral.referral_status === statusFilter;
    return matchesSearch && matchesStatus;
  });



  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '📋';
      case 'low': return '✅';
      default: return '📋';
    }
  };


  const handleStatusChange = async (referral: Referral, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('referrals')
        .update({ referral_status: newStatus })
        .eq('id', referral.id);

      if (error) throw error;

      fetchReferrals();
      setAlert({type: 'success', message: `Referral marked as ${newStatus}!`});
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      console.error('Error updating referral status:', error);
      setAlert({type: 'error', message: 'Failed to update referral status.'});
      setTimeout(() => setAlert(null), 5000);
    }
  };

  // File handling functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    addFiles(files);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const files = Array.from(event.dataTransfer.files);
    addFiles(files);
  };

  const addFiles = (files: File[]) => {
    const newFiles: AttachedFile[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    }));
    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Generate referral document content matching the exact form layout
  const generateReferralDocument = async (referral: Referral) => {
    // Fetch student data from database
    let studentData = {
      student_id: '',
      course: '',
      year_level: '',
      contact_number: '',
      email: ''
    };

    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', referral.student_id)
        .single();
      
      if (profileData) {
        studentData = {
          student_id: profileData.id_number || profileData.student_id || profileData.id || '',
          course: profileData.course || profileData.program || '',
          year_level: profileData.year_level || profileData.year || '',
          contact_number: profileData.contact_number || profileData.phone_number || profileData.phone || profileData.mobile || '',
          email: profileData.email || ''
        };
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Individual Referral Slip - ${referral.student_name}</title>
        <style>
          @page { 
            size: A4; 
            margin: 0.5in 0.75in; 
          }
          body { 
            font-family: 'Times New Roman', serif; 
            font-size: 11px; 
            line-height: 1.2; 
            color: #000; 
            margin: 0;
            padding: 0;
            position: relative;
          }
          .form-number {
            position: absolute;
            top: -10px;
            left: 0;
            font-size: 10px;
            font-weight: bold;
          }
          .date-field {
            position: absolute;
            top: -10px;
            right: 0;
            font-size: 11px;
            font-weight: bold;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 20px;
            margin-bottom: 15px;
            position: relative;
          }
          .logo {
            width: 60px;
            height: 60px;
          }
          .center-content {
            text-align: center;
            flex: 1;
            margin: 0 20px;
          }
          .college-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 2px;
          }
          .college-address {
            font-size: 10px;
            margin-bottom: 2px;
          }
          .department {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 8px;
          }
          .form-title {
            font-size: 14px;
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 20px;
          }
          .student-info {
            margin-bottom: 15px;
          }
          .info-row {
            display: flex;
            margin-bottom: 8px;
            align-items: baseline;
          }
          .info-label {
            font-weight: bold;
            margin-right: 5px;
            white-space: nowrap;
          }
          .info-line {
            border-bottom: 1px solid #000;
            flex: 1;
            min-height: 16px;
            margin-right: 15px;
            padding-left: 3px;
          }
          .checkbox-section {
            margin-bottom: 15px;
          }
          .checkbox-row {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin-bottom: 8px;
          }
          .checkbox-item {
            display: flex;
            align-items: center;
            gap: 3px;
          }
          .checkbox {
            width: 12px;
            height: 12px;
            border: 1.5px solid #000;
            display: inline-block;
            position: relative;
          }
          .checkbox.checked::after {
            content: '✓';
            position: absolute;
            left: 1px;
            top: -2px;
            font-size: 10px;
            font-weight: bold;
          }
          .section-title {
            font-weight: bold;
            margin-bottom: 8px;
            font-size: 11px;
          }
          .reason-section {
            margin-bottom: 15px;
          }
          .reason-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 5px 30px;
            margin-bottom: 8px;
          }
          .description-section {
            margin-bottom: 15px;
          }
          .description-box {
            border: 1px solid #000;
            min-height: 60px;
            padding: 5px;
            margin-top: 5px;
          }
          .action-section {
            margin-bottom: 20px;
          }
          .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
          }
          .signature-box {
            width: 45%;
          }
          .signature-line {
            border-bottom: 1px solid #000;
            height: 25px;
            margin-bottom: 3px;
          }
          .signature-label {
            text-align: center;
            font-size: 10px;
            font-style: italic;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="form-number">GSC Form No. 3-A</div>
        <div class="date-field">Date: ${new Date(referral.created_at).toLocaleDateString()}</div>
        
        <div class="header">
          <img src="/spc-logo.png" alt="SPC Logo" class="logo" />
          <div class="center-content">
            <div class="college-name">St. Peter's College</div>
            <div class="college-address">No. 042, Sabayan St., Iligan City</div>
            <div class="department">Guidance Service Center</div>
          </div>
          <img src="/spc-guidance.png" alt="Guidance Logo" class="logo" />
        </div>

        <div class="form-title">INDIVIDUAL REFERRAL SLIP</div>

        <div class="student-info">
          <div class="info-row">
            <span class="info-label">Student's Name:</span>
            <div class="info-line">${referral.student_name}</div>
            <span class="info-label">Student ID:</span>
            <div class="info-line" style="flex: 0.5;">${studentData.student_id}</div>
          </div>
          <div class="info-row">
            <span class="info-label">Course/Major:</span>
            <div class="info-line">${studentData.course}</div>
            <span class="info-label">Year level:</span>
            <div class="info-line" style="flex: 0.5;">${studentData.year_level}</div>
          </div>
          <div class="info-row">
            <span class="info-label">Contact Number:</span>
            <div class="info-line">${studentData.contact_number}</div>
            <span class="info-label">Email Address:</span>
            <div class="info-line">${studentData.email}</div>
          </div>
        </div>

        <div class="checkbox-section">
          <div class="checkbox-row">
            <span class="info-label">Referred By:</span>
            <div class="checkbox-item">
              <span class="checkbox ${referral.referred_by_faculty ? 'checked' : ''}"></span>
              <span>Faculty</span>
            </div>
            <div class="checkbox-item">
              <span class="checkbox ${referral.referred_by_staff ? 'checked' : ''}"></span>
              <span>Staff</span>
            </div>
            <div class="checkbox-item">
              <span class="checkbox ${referral.referred_by_parent_guardian ? 'checked' : ''}"></span>
              <span>Parent/Guardian</span>
            </div>
            <div class="checkbox-item">
              <span class="checkbox ${referral.referred_by_peer ? 'checked' : ''}"></span>
              <span>Peer</span>
            </div>
            <div class="checkbox-item">
              <span class="checkbox ${referral.referred_by_self ? 'checked' : ''}"></span>
              <span>Self</span>
            </div>
            <div class="checkbox-item">
              <span class="checkbox ${referral.referred_by_others ? 'checked' : ''}"></span>
              <span>Others: ${referral.referred_by_others_specify || '_______________'}</span>
            </div>
          </div>
          <div class="checkbox-row">
            <span class="info-label">Preferred mode of counseling:</span>
            <div class="checkbox-item">
              <span class="checkbox ${referral.preferred_face_to_face_individual ? 'checked' : ''}"></span>
              <span>Face-to-face individual</span>
            </div>
            <div class="checkbox-item">
              <span class="checkbox ${referral.preferred_face_to_face_group ? 'checked' : ''}"></span>
              <span>Face-to-face individual</span>
            </div>
            <div class="checkbox-item">
              <span class="checkbox ${referral.preferred_online ? 'checked' : ''}"></span>
              <span>Online</span>
            </div>
          </div>
        </div>

        <div class="reason-section">
          <div class="section-title">I. REASON FOR REFERRAL <em>(Check all that apply)</em></div>
          <div class="reason-grid">
            <div class="checkbox-item">
              <span class="checkbox ${referral.reason_academic_concerns ? 'checked' : ''}"></span>
              <span>Academic Concerns</span>
            </div>
            <div class="checkbox-item">
              <span class="checkbox ${referral.reason_peer_relationship_social_adjustment ? 'checked' : ''}"></span>
              <span>Peer Relationship/Social Adjustment</span>
            </div>
            <div class="checkbox-item">
              <span class="checkbox ${referral.reason_behavioral_issues ? 'checked' : ''}"></span>
              <span>Behavioral Issues</span>
            </div>
            <div class="checkbox-item">
              <span class="checkbox ${referral.reason_family_concerns ? 'checked' : ''}"></span>
              <span>Family Concerns</span>
            </div>
            <div class="checkbox-item">
              <span class="checkbox ${referral.reason_emotional_psychological_concerns ? 'checked' : ''}"></span>
              <span>Emotional/Psychological Concerns</span>
            </div>
            <div class="checkbox-item">
              <span class="checkbox ${referral.reason_personal_concerns ? 'checked' : ''}"></span>
              <span>Personal Concerns</span>
            </div>
            <div class="checkbox-item">
              <span class="checkbox ${referral.reason_career_counseling ? 'checked' : ''}"></span>
              <span>Career Counseling</span>
            </div>
            <div class="checkbox-item">
              <span class="checkbox ${referral.reason_psychological_assessment_request ? 'checked' : ''}"></span>
              <span>Psychological Assessment Request</span>
            </div>
          </div>
          <div class="checkbox-item" style="margin-top: 5px;">
            <span class="checkbox ${referral.reason_others ? 'checked' : ''}"></span>
            <span>Others (Please specify): ${referral.reason_others_specify || '________________________________________________'}</span>
          </div>
        </div>

        <div class="description-section">
          <div class="section-title">II. Brief Description of Concern</div>
          <div style="font-size: 10px; font-style: italic; margin-bottom: 5px;">
            (Please provide specific details regarding the reason for referral, including observed behaviors, incidents, or concerns.)
          </div>
          <div class="description-box">${referral.brief_description_of_concern}</div>
        </div>

        <div class="action-section">
          <div class="section-title">III. Immediate Action Taken (If Any)</div>
          <div style="font-size: 10px; font-style: italic; margin-bottom: 5px;">
            (Please specify any interventions or steps already taken prior to this referral.)
          </div>
          <div class="description-box">${referral.immediate_action_taken || ''}</div>
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <div style="font-weight: bold; margin-bottom: 5px;">Requested by:</div>
            <div class="signature-line" style="text-align: center; padding-top: 10px;">${referral.requested_by_signature || ''}</div>
            <div class="signature-label">Signature over Printed Name</div>
            ${referral.requested_by_printed_name ? `<div style="font-size: 10px; text-align: center; margin-top: 2px;">${referral.requested_by_printed_name}</div>` : ''}
          </div>
          <div class="signature-box">
            <div style="font-weight: bold; margin-bottom: 5px;">Noted by:</div>
            <div class="signature-line" style="text-align: center; padding-top: 10px;">${referral.noted_by_principal_dean || ''}</div>
            <div class="signature-label">Principal/Dean</div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Download as Word document
  const downloadAsWord = async (referral: Referral) => {
    const htmlContent = await generateReferralDocument(referral);
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Individual_Referral_Slip_${referral.student_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download as PDF
  const downloadAsPDF = async (referral: Referral) => {
    const htmlContent = await generateReferralDocument(referral);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Just open for preview - user can manually print if needed
      printWindow.focus();
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('text')) return '📃';
    return '📎';
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-xl shadow-lg p-3 sm:p-4 lg:p-6`}>
      {/* Header */}
      <div className={`${darkMode ? 'bg-gradient-to-r from-gray-800 to-gray-900' : 'bg-gradient-to-r from-white to-gray-50'} rounded-2xl shadow-xl p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6 backdrop-blur-sm`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-red-700 to-red-900 p-2 sm:p-3 rounded-xl mr-3 sm:mr-4">
              <FaHandshake className="text-lg sm:text-xl lg:text-2xl text-white" />
            </div>
            <div>
              <h1 className={`text-lg sm:text-xl lg:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Psychiatric Referral System
              </h1>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-1 text-xs sm:text-sm`}>
                Refer students to licensed psychiatrists when guidance interventions are insufficient
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-red-700 to-red-900 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl hover:scale-105 active:scale-95 transform transition-all duration-200 shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto"
          >
            <FaPlus className="text-sm" /> New Referral
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
          <div className="flex-1 relative">
            <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder="Search referrals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 text-sm border rounded-xl ${
                darkMode 
                  ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 placeholder-gray-500'
              } focus:ring-2 focus:ring-red-800 focus:border-transparent focus:outline-none transition-all duration-200`}
            />
          </div>
          <div className="relative w-full sm:w-auto">
            <FaFilter className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`w-full pl-10 pr-8 py-2 text-sm border rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-red-800 focus:border-transparent focus:outline-none`}
            >
              <option value="all">All Status</option>
              <option value="pending">📋 Pending</option>
              <option value="sent">📧 Sent</option>
              <option value="acknowledged">👁️ Acknowledged</option>
              <option value="accepted">✅ Accepted</option>
              <option value="declined">❌ Declined</option>
              <option value="completed">🎯 Completed</option>
            </select>
          </div>
      </div>

      {/* Referrals Grid */}
      {initialLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(8)].map((_, index) => (
            <div
              key={index}
              className={`group relative p-4 rounded-xl border transition-all duration-200 animate-pulse overflow-hidden ${
                darkMode 
                  ? 'bg-gray-700/50 border-gray-600' 
                  : 'bg-white border-gray-200'
              }`}
            >
              {/* Header skeleton */}
              <div className="flex items-start mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                  <div className="flex-1">
                    <div className={`h-4 rounded mb-2 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} style={{width: '70%'}}></div>
                    <div className={`h-3 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} style={{width: '40%'}}></div>
                  </div>
                </div>
              </div>
              
              {/* Description skeleton */}
              <div className="mb-3 space-y-2">
                <div className={`h-3 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                <div className={`h-3 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} style={{width: '80%'}}></div>
              </div>
              
              {/* Footer skeleton */}
              <div className="pt-3 border-t border-gray-200/30 space-y-2">
                <div className={`h-3 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} style={{width: '50%'}}></div>
                <div className={`h-3 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} style={{width: '60%'}}></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredReferrals.length === 0 ? (
        <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <FaHandshake className="text-6xl mx-auto mb-4 opacity-30" />
          <h3 className="text-xl font-semibold mb-2">No referrals found</h3>
          <p>Try adjusting your search or filters, or add a new referral.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {filteredReferrals.map((referral) => (
            <div
              key={referral.id}
              onClick={() => handleReferralClick(referral)}
              className={`group relative p-3 sm:p-4 rounded-xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-1 overflow-hidden cursor-pointer flex flex-col ${
                darkMode 
                  ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700' 
                  : 'bg-white border-gray-200 hover:shadow-xl'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg ${darkMode ? 'bg-red-500/10' : 'bg-red-50'}`}>
                    <FaHandshake className={`text-sm ${
                      darkMode ? 'text-red-400 group-hover:text-red-300' : 'text-red-500 group-hover:text-red-600'
                    } transition-colors`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-sm leading-tight truncate transition-colors ${
                      darkMode ? 'text-white group-hover:text-white' : 'text-gray-900 group-hover:text-gray-900'
                    }`}>
                      {referral.student_name}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Card Content - Flexible */}
              <div className="flex-1 flex flex-col">
                <div className="mb-3">
                  <p className={`text-xs leading-relaxed line-clamp-2 transition-colors ${
                    darkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-700'
                  }`}>
                    {referral.brief_description_of_concern}
                  </p>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                    referral.urgency_level === 'critical' 
                      ? 'bg-red-100 text-red-800' 
                      : referral.urgency_level === 'high'
                      ? 'bg-orange-100 text-orange-800'
                      : referral.urgency_level === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  } group-hover:bg-opacity-100`}>
                    {getUrgencyIcon(referral.urgency_level)}
                    <span className="ml-1 capitalize">{referral.urgency_level}</span>
                  </span>
                </div>

                <div className="space-y-2 pt-3 border-t border-gray-200/50">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FaInfoCircle className="text-xs" />
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                      referral.referral_status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : referral.referral_status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : referral.referral_status === 'sent'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    } group-hover:bg-opacity-100`}>
                      {referral.referral_status.replace('_', ' ').charAt(0).toUpperCase() + referral.referral_status.replace('_', ' ').slice(1)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FaClock className="text-xs" />
                    <span className={`transition-colors ${
                      darkMode ? 'group-hover:text-white' : 'group-hover:text-gray-700'
                    }`}>Created: {new Date(referral.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  {referral.attachments && referral.attachments.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <FaPaperclip className="text-xs" />
                      <span className={`transition-colors ${
                        darkMode ? 'group-hover:text-white' : 'group-hover:text-gray-700'
                      }`}>
                        {referral.attachments.length} file{referral.attachments.length !== 1 ? 's' : ''} attached
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Hover Actions */}
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedReferral(referral);
                    setShowDetailModal(true);
                    startEditing();
                  }}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    darkMode 
                      ? 'text-blue-400 hover:bg-blue-900/50 hover:text-blue-300' 
                      : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                  title="Edit referral"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm(referral.id);
                  }}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    darkMode 
                      ? 'text-red-400 hover:bg-red-900/50 hover:text-red-300' 
                      : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                  }`}
                  title="Delete referral"
                >
                  <FaTrash />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-1.5 mt-3">
                {referral.referral_status !== 'completed' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(referral, 'completed');
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <FaCheck className="text-xs" />
                    Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Referral Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl p-3 sm:p-4 lg:p-6 w-full max-w-2xl max-h-[95vh] sm:max-h-[85vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className={`text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-red-700 to-red-900 bg-clip-text text-transparent`}>
                Create New Referral
              </h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} text-xl sm:text-2xl active:scale-95`}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Student Selection */}
              <div>
                <label className={`block text-xs sm:text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Select Student *
                </label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  required
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="">Choose a student...</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.full_name} ({student.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Referred By Section */}
              <div>
                <label className={`block text-xs sm:text-sm font-semibold mb-2 sm:mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Referred By: (Check all that apply)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.referred_by_faculty}
                      onChange={(e) => setFormData({...formData, referred_by_faculty: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-xs sm:text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Faculty</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.referred_by_staff}
                      onChange={(e) => setFormData({...formData, referred_by_staff: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-xs sm:text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Staff</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.referred_by_parent_guardian}
                      onChange={(e) => setFormData({...formData, referred_by_parent_guardian: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-xs sm:text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Parent/Guardian</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.referred_by_peer}
                      onChange={(e) => setFormData({...formData, referred_by_peer: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-xs sm:text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Peer</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.referred_by_self}
                      onChange={(e) => setFormData({...formData, referred_by_self: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-xs sm:text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Self</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.referred_by_others}
                      onChange={(e) => setFormData({...formData, referred_by_others: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-xs sm:text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Others</span>
                  </label>
                </div>
                {formData.referred_by_others && (
                  <div className="mt-2 sm:mt-3">
                    <input
                      type="text"
                      value={formData.referred_by_others_specify}
                      onChange={(e) => setFormData({...formData, referred_by_others_specify: e.target.value})}
                      placeholder="Please specify..."
                      className={`w-full px-3 sm:px-4 py-2 text-sm rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                  </div>
                )}
              </div>

              {/* Preferred Mode of Counseling */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Preferred Mode of Counseling:
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.preferred_face_to_face_individual}
                      onChange={(e) => setFormData({...formData, preferred_face_to_face_individual: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Face-to-face Individual</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.preferred_face_to_face_group}
                      onChange={(e) => setFormData({...formData, preferred_face_to_face_group: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Face-to-face Group</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.preferred_online}
                      onChange={(e) => setFormData({...formData, preferred_online: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Online</span>
                  </label>
                </div>
              </div>

              {/* Reason for Referral */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  I. REASON FOR REFERRAL (Check all that apply)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.reason_academic_concerns}
                      onChange={(e) => setFormData({...formData, reason_academic_concerns: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Academic Concerns</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.reason_peer_relationship_social_adjustment}
                      onChange={(e) => setFormData({...formData, reason_peer_relationship_social_adjustment: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Peer Relationship/Social Adjustment</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.reason_behavioral_issues}
                      onChange={(e) => setFormData({...formData, reason_behavioral_issues: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Behavioral Issues</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.reason_family_concerns}
                      onChange={(e) => setFormData({...formData, reason_family_concerns: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Family Concerns</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.reason_emotional_psychological_concerns}
                      onChange={(e) => setFormData({...formData, reason_emotional_psychological_concerns: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Emotional/Psychological Concerns</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.reason_personal_concerns}
                      onChange={(e) => setFormData({...formData, reason_personal_concerns: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Personal Concerns</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.reason_career_counseling}
                      onChange={(e) => setFormData({...formData, reason_career_counseling: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Career Counseling</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.reason_psychological_assessment_request}
                      onChange={(e) => setFormData({...formData, reason_psychological_assessment_request: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Psychological Assessment Request</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.reason_others}
                      onChange={(e) => setFormData({...formData, reason_others: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Others</span>
                  </label>
                </div>
                {formData.reason_others && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={formData.reason_others_specify}
                      onChange={(e) => setFormData({...formData, reason_others_specify: e.target.value})}
                      placeholder="Please specify..."
                      className={`w-full px-4 py-2 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                  </div>
                )}
              </div>

              {/* Brief Description of Concern */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  II. Brief Description of Concern *
                </label>
                <p className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  (Please provide specific details regarding the reason for referral, including observed behaviors, incidents, or concerns.)
                </p>
                <textarea
                  value={formData.brief_description_of_concern}
                  onChange={(e) => setFormData({...formData, brief_description_of_concern: e.target.value})}
                  required
                  rows={4}
                  className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Describe the specific concerns, behaviors, or incidents that led to this referral..."
                />
              </div>

              {/* Immediate Action Taken */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  III. Immediate Action Taken (If Any)
                </label>
                <p className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  (Please specify any interventions or steps already taken prior to this referral.)
                </p>
                <textarea
                  value={formData.immediate_action_taken}
                  onChange={(e) => setFormData({...formData, immediate_action_taken: e.target.value})}
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Describe any interventions, support, or actions already taken..."
                />
              </div>

              {/* Signatures Section */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Requested by (Signature)
                  </label>
                  <input
                    type="text"
                    value={formData.requested_by_signature}
                    onChange={(e) => setFormData({...formData, requested_by_signature: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Digital signature or name"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Noted by (Principal/Dean)
                  </label>
                  <input
                    type="text"
                    value={formData.noted_by_principal_dean}
                    onChange={(e) => setFormData({...formData, noted_by_principal_dean: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Principal or Dean signature"
                  />
                </div>
              </div>

              {/* Urgency Level */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Urgency Level *
                </label>
                <select
                  value={formData.urgency_level}
                  onChange={(e) => setFormData({...formData, urgency_level: e.target.value})}
                  required
                  className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="low">🟢 Low - Routine referral</option>
                  <option value="medium">🟡 Medium - Moderate concern</option>
                  <option value="high">🟠 High - Urgent attention needed</option>
                  <option value="critical">🔴 Critical - Immediate intervention required</option>
                </select>
              </div>

              {/* File Attachments Section */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Attach Supporting Documents
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl p-6 transition-all duration-200 ${
                    isDragging
                      ? darkMode
                        ? 'border-red-400 bg-red-900/20'
                        : 'border-red-400 bg-red-50'
                      : darkMode
                      ? 'border-gray-600 hover:border-gray-500'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="text-center">
                    <FaUpload className={`mx-auto text-3xl mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                      Drag and drop files here, or
                    </p>
                    <label className="cursor-pointer">
                      <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:scale-105 transform transition-all duration-200 inline-block">
                        Browse Files
                      </span>
                      <input
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                      />
                    </label>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>
                      Supported: PDF, DOC, DOCX, JPG, PNG, TXT (Max 10MB each)
                    </p>
                  </div>
                </div>

                {/* Attached Files List */}
                {attachedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Attached Files ({attachedFiles.length})
                    </h4>
                    {attachedFiles.map((file) => (
                      <div
                        key={file.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-lg">{getFileIcon(file.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {file.name}
                            </p>
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className={`p-1 rounded-lg transition-colors ${darkMode ? 'text-red-400 hover:bg-red-900/50' : 'text-red-600 hover:bg-red-50'}`}
                        >
                          <FaTimes className="text-sm" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>



              {/* Form Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className={`flex-1 px-6 py-3 rounded-xl border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} transition-all duration-200`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:scale-105 transform transition-all duration-200 shadow-lg ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Creating...' : 'Create Referral'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800' : 'bg-gradient-to-br from-white via-gray-50 to-white'} rounded-3xl shadow-3xl p-8 w-full max-w-md border ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'} backdrop-blur-lg`}>
            <div className="text-center">
              <div className="bg-gradient-to-br from-red-500 to-red-600 p-4 rounded-2xl mx-auto w-fit mb-6">
                <FaTrash className="text-3xl text-white" />
              </div>
              <h3 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Delete Referral
              </h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-8`}>
                Are you sure you want to delete this referral? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className={`flex-1 px-6 py-3 rounded-2xl border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} transition-all duration-200 font-semibold`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteReferral(deleteConfirm)}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-2xl hover:scale-105 hover:shadow-xl transform transition-all duration-300 shadow-lg font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert System */}
      {alert && (
        <div className="fixed top-4 right-4 z-[60] animate-slideDown">
          <div className={`${
            alert.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
            alert.type === 'error' ? 'bg-gradient-to-r from-red-500 to-red-600' :
            'bg-gradient-to-r from-blue-500 to-indigo-600'
          } text-white px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-lg border border-white/20 max-w-md`}>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {alert.type === 'success' && <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">✓</div>}
                {alert.type === 'error' && <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">✕</div>}
                {alert.type === 'info' && <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">i</div>}
              </div>
              <p className="font-semibold text-sm">{alert.message}</p>
              <button
                onClick={() => setAlert(null)}
                className="ml-auto text-white/80 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Referral Detail Modal */}
      {showDetailModal && selectedReferral && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50"
          onClick={closeDetailModal}
        >
          <div 
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[85vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 lg:p-6 border-b border-gray-200/20 gap-3 sm:gap-0">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`p-2 sm:p-3 rounded-xl ${darkMode ? 'bg-red-600/20' : 'bg-red-100'}`}>
                  <FaUserMd className={`text-lg sm:text-xl lg:text-2xl ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                </div>
                <div>
                  <h2 className={`text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-red-700 to-red-900 bg-clip-text text-transparent`}>
                    Referral Details
                  </h2>
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-1 text-xs sm:text-sm`}>
                    Student: {selectedReferral.student_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                {!isEditing ? (
                  <button
                    onClick={() => downloadAsWord(selectedReferral)}
                    className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:scale-105 active:scale-95 transform transition-all duration-200 text-xs sm:text-sm font-medium flex-1 sm:flex-initial"
                    title="Download as Word Document"
                  >
                    <FaFileWord className="text-xs sm:text-sm" />
                    <span className="hidden sm:inline">Word</span>
                  </button>
                ) : (
                  <></>
                )}
                {!isEditing ? (
                  <button
                    onClick={() => downloadAsPDF(selectedReferral)}
                    className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:scale-105 active:scale-95 transform transition-all duration-200 text-xs sm:text-sm font-medium flex-1 sm:flex-initial"
                    title="Download as PDF"
                  >
                    <FaFilePdf className="text-xs sm:text-sm" />
                    <span className="hidden sm:inline">PDF</span>
                  </button>
                ) : (
                  <></>
                )}
                <button
                  onClick={closeDetailModal}
                  className={`group relative p-2 sm:p-3 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg ${
                    darkMode 
                      ? 'bg-gradient-to-br from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 border border-red-400/30 text-red-400 hover:text-red-300' 
                      : 'bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 border border-red-200/50 text-red-600 hover:text-red-700'
                  }`}
                  title="Close modal"
                >
                  <FaTimes className="text-lg" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <form onSubmit={(e) => { e.preventDefault(); saveEdit(); }} className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
              {/* Student Information - Read Only */}
              <div>
                <label className={`block text-xs sm:text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Student *
                </label>
                <div className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'} cursor-not-allowed`}>
                  {selectedReferral.student_name}
                </div>
                <p className={`text-[10px] sm:text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Student cannot be changed after referral creation
                </p>
              </div>

              {/* Referred By Section */}
              <div>
                <label className={`block text-xs sm:text-sm font-semibold mb-2 sm:mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Referred By: (Check all that apply)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editFormData.referred_by_faculty}
                      onChange={(e) => setEditFormData({...editFormData, referred_by_faculty: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-xs sm:text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Faculty</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editFormData.referred_by_staff}
                      onChange={(e) => setEditFormData({...editFormData, referred_by_staff: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Staff</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editFormData.referred_by_parent_guardian}
                      onChange={(e) => setEditFormData({...editFormData, referred_by_parent_guardian: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Parent/Guardian</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editFormData.referred_by_peer}
                      onChange={(e) => setEditFormData({...editFormData, referred_by_peer: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Peer</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editFormData.referred_by_self}
                      onChange={(e) => setEditFormData({...editFormData, referred_by_self: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Self</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editFormData.referred_by_others}
                      onChange={(e) => setEditFormData({...editFormData, referred_by_others: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Others</span>
                  </label>
                </div>
                {editFormData.referred_by_others && (
                  <div className="mt-2 sm:mt-3">
                    <input
                      type="text"
                      value={editFormData.referred_by_others_specify}
                      onChange={(e) => setEditFormData({...editFormData, referred_by_others_specify: e.target.value})}
                      placeholder="Please specify..."
                      className={`w-full px-3 sm:px-4 py-2 text-sm rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                  </div>
                )}
              </div>

              {/* Preferred Mode of Counseling */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Preferred Mode of Counseling:
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editFormData.preferred_face_to_face_individual}
                      onChange={(e) => setEditFormData({...editFormData, preferred_face_to_face_individual: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Face-to-face Individual</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editFormData.preferred_face_to_face_group}
                      onChange={(e) => setEditFormData({...editFormData, preferred_face_to_face_group: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Face-to-face Group</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editFormData.preferred_online}
                      onChange={(e) => setEditFormData({...editFormData, preferred_online: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Online</span>
                  </label>
                </div>
              </div>

              {/* Reasons for Referral */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Reasons for Referral: (Check all that apply)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editFormData.reason_academic_concerns}
                      onChange={(e) => setEditFormData({...editFormData, reason_academic_concerns: e.target.checked})}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>📚 Academic Concerns</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editFormData.reason_behavioral_issues}
                      onChange={(e) => setEditFormData({...editFormData, reason_behavioral_issues: e.target.checked})}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>⚠️ Behavioral Issues</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editFormData.reason_emotional_psychological_concerns}
                      onChange={(e) => setEditFormData({...editFormData, reason_emotional_psychological_concerns: e.target.checked})}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>💭 Emotional/Psychological Concerns</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editFormData.reason_career_counseling}
                      onChange={(e) => setEditFormData({...editFormData, reason_career_counseling: e.target.checked})}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>💼 Career Counseling</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editFormData.reason_peer_relationship_social_adjustment}
                      onChange={(e) => setEditFormData({...editFormData, reason_peer_relationship_social_adjustment: e.target.checked})}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>👥 Peer Relationship/Social Adjustment</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editFormData.reason_family_concerns}
                      onChange={(e) => setEditFormData({...editFormData, reason_family_concerns: e.target.checked})}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>👨‍👩‍👧‍👦 Family Concerns</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editFormData.reason_personal_concerns}
                      onChange={(e) => setEditFormData({...editFormData, reason_personal_concerns: e.target.checked})}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>🤔 Personal Concerns</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editFormData.reason_psychological_assessment_request}
                      onChange={(e) => setEditFormData({...editFormData, reason_psychological_assessment_request: e.target.checked})}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>🧠 Psychological Assessment Request</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editFormData.reason_others}
                      onChange={(e) => setEditFormData({...editFormData, reason_others: e.target.checked})}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>📝 Others</span>
                  </label>
                </div>
                {editFormData.reason_others && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={editFormData.reason_others_specify}
                      onChange={(e) => setEditFormData({...editFormData, reason_others_specify: e.target.value})}
                      placeholder="Please specify other reasons..."
                      className={`w-full px-4 py-2 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                    />
                  </div>
                )}
              </div>

              {/* Brief Description */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Brief Description of Concern *
                </label>
                <textarea
                  value={editFormData.brief_description_of_concern}
                  onChange={(e) => setEditFormData({...editFormData, brief_description_of_concern: e.target.value})}
                  required
                  rows={4}
                  className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
                  placeholder="Describe the specific concerns or issues that led to this referral..."
                />
              </div>

              {/* Immediate Action Taken */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Immediate Action Taken (if any)
                </label>
                <textarea
                  value={editFormData.immediate_action_taken}
                  onChange={(e) => setEditFormData({...editFormData, immediate_action_taken: e.target.value})}
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
                  placeholder="Describe any immediate actions taken before this referral..."
                />
              </div>

              {/* Urgency Level */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Urgency Level *
                </label>
                <select
                  value={editFormData.urgency_level}
                  onChange={(e) => setEditFormData({...editFormData, urgency_level: e.target.value})}
                  required
                  className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="low">🟢 Low - Routine referral</option>
                  <option value="medium">🟡 Medium - Moderate concern</option>
                  <option value="high">🟠 High - Urgent attention needed</option>
                  <option value="critical">🔴 Critical - Immediate intervention required</option>
                </select>
              </div>

              {/* Signatures Section */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Requested By (Printed Name)
                  </label>
                  <input
                    type="text"
                    value={editFormData.requested_by_printed_name}
                    onChange={(e) => setEditFormData({...editFormData, requested_by_printed_name: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Enter the name of the person making this referral"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Noted By (Principal/Dean)
                  </label>
                  <input
                    type="text"
                    value={editFormData.noted_by_principal_dean}
                    onChange={(e) => setEditFormData({...editFormData, noted_by_principal_dean: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Principal or Dean acknowledgment (optional)"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:scale-105 transform transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaSave className="text-lg" />
                  {loading ? 'Saving Changes...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:scale-105 transform transition-all duration-200 font-medium"
                >
                  <FaTimes className="text-lg" />
                  Cancel
                </button>
              </div>



              {/* Attached Files */}
              {selectedReferral.attachments && selectedReferral.attachments.length > 0 && (
                <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-white/80'} rounded-2xl p-6 border ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'} backdrop-blur-sm`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-green-600/20' : 'bg-green-100'}`}>
                      <FaPaperclip className={`text-lg ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                    </div>
                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Attached Files ({selectedReferral.attachments.length})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {selectedReferral.attachments.map((file) => (
                      <div
                        key={file.id}
                        className={`${darkMode ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-lg p-4 border ${darkMode ? 'border-gray-600/30' : 'border-gray-200'} hover:shadow-md transition-all duration-200`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-3xl">{getFileIcon(file.type)}</div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {file.name}
                            </h4>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {file.file && file.file instanceof File ? (
                              <button
                                onClick={() => {
                                  const url = URL.createObjectURL(file.file as File);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = file.name;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  URL.revokeObjectURL(url);
                                }}
                                className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-red-400 hover:bg-red-900/50' : 'text-red-800 hover:bg-red-100'}`}
                                title="Download file"
                              >
                                <FaDownload />
                              </button>
                            ) : file.url ? (
                              <a
                                href={file.url}
                                download={file.name}
                                className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-red-400 hover:bg-red-900/50' : 'text-red-800 hover:bg-red-100'}`}
                                title="Download file"
                              >
                                <FaDownload />
                              </a>
                            ) : file.content ? (
                              <button
                                onClick={() => {
                                  // Convert base64 back to blob and download
                                  if (file.content) {
                                    const byteCharacters = atob(file.content.split(',')[1]);
                                    const byteNumbers = new Array(byteCharacters.length);
                                    for (let i = 0; i < byteCharacters.length; i++) {
                                      byteNumbers[i] = byteCharacters.charCodeAt(i);
                                    }
                                    const byteArray = new Uint8Array(byteNumbers);
                                    const blob = new Blob([byteArray], { type: file.type });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = file.name;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                  }
                                }}
                                className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-red-400 hover:bg-red-900/50' : 'text-red-800 hover:bg-red-100'}`}
                                title="Download file"
                              >
                                <FaDownload />
                              </button>
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} italic text-center`}>
                                  File uploaded before content storage was enabled
                                </span>
                                <button
                                  onClick={() => {
                                    setAlert({type: 'info', message: 'This file was uploaded before full content storage. Please re-upload the file in a new referral for download capability.'});
                                    setTimeout(() => setAlert(null), 5000);
                                  }}
                                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${darkMode ? 'text-red-400 hover:bg-red-900/50 border border-red-400/30' : 'text-red-800 hover:bg-red-100 border border-red-200'}`}
                                  title="Get info about this file"
                                >
                                  More Info
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}


            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Referral;