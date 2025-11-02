# Anxiety Management Application - Project Objectives

## 0. Landing Page, Authentication & User Onboarding
### 0.1. Landing Page
- **0.1.1.** Modern, responsive landing page with full-screen hero carousel featuring smooth transitions (1s duration).
- **0.1.2.** Floating transparent header with backdrop blur effects and responsive navigation.
- **0.1.3.** Scroll-triggered animations using Intersection Observer for feature cards with staggered delays.
- **0.1.4.** Mobile-first design with touch-friendly 48px minimum touch targets.
- **0.1.5.** Glass morphism effects with gradient overlays and contemporary shadows.
- **0.1.6.** Smooth scroll navigation between sections with prominent CTAs.
- **0.1.7.** Responsive typography scaling (text-3xl to text-7xl) from mobile to desktop.
- **0.1.8.** Feature showcase sections highlighting:
  - CBT modules and therapeutic interventions
  - Anxiety assessment tools (GAD-7)
  - Relaxation tools and guided exercises
  - Student-counselor collaboration features
  - Real-time monitoring and analytics
- **0.1.9.** Call-to-action buttons for Login and Register with gradient backgrounds.
- **0.1.10.** Professional visual hierarchy with proper spacing and modern UI elements.

### 0.2. User Registration System
- **0.2.1.** Comprehensive student registration form with required fields:
  - Full name, email, password (minimum 6 characters)
  - School, course, year level (First Year to Fourth Year)
  - Age, gender (Male, Female, Non-binary, Prefer not to say)
  - Phone number, address, student ID number
  - Guardian name and guardian phone number
- **0.2.2.** Password confirmation with validation and visibility toggle.
- **0.2.3.** Custom dropdown selectors for gender and year level with icons.
- **0.2.4.** Terms and conditions checkbox ("Remember me" requirement).
- **0.2.5.** Form validation with user-friendly error messages using SweetAlert2 toast notifications.
- **0.2.6.** Automatic profile creation in Supabase database with user metadata.
- **0.2.7.** Automatic streak initialization for new users.
- **0.2.8.** Real-time notification to admin and guidance counselors upon new registration.
- **0.2.9.** Modern UI with gradient backgrounds, rounded corners (rounded-2xl), and smooth animations.
- **0.2.10.** Responsive design with mobile-optimized layout.
- **0.2.11.** Seamless transition to login form with "Already have an account?" link.

### 0.3. User Login System
- **0.3.1.** Secure authentication using Supabase Auth with email and password.
- **0.3.2.** Password visibility toggle for user convenience.
- **0.3.3.** "Remember Me" functionality with encrypted credential storage in localStorage.
- **0.3.4.** Automatic credential loading for returning users.
- **0.3.5.** Role-based authentication and routing:
  - Admin users (admin@gmail.com) → Admin Dashboard
  - Guidance counselors (guidance@gmail.com) → Guidance Dashboard
  - Students → User Dashboard
- **0.3.6.** Archived user prevention - automatic logout for archived accounts.
- **0.3.7.** Streak tracking update on successful login.
- **0.3.8.** Real-time notification to admin and guidance counselors when students log in.
- **0.3.9.** SweetAlert2 toast notifications for authentication feedback.
- **0.3.10.** Loading states during authentication process.
- **0.3.11.** Modern UI with gradient backgrounds matching system design.
- **0.3.12.** Responsive layout with mobile optimization.
- **0.3.13.** Seamless transition to registration form with "Don't have an account?" link.

### 0.4. Authentication Security & Session Management
- **0.4.1.** Secure session management using Supabase Auth tokens.
- **0.4.2.** Protected routes with AuthRoute and ProtectedRoute components.
- **0.4.3.** Automatic session validation on page load.
- **0.4.4.** Redirect to landing page for unauthenticated users.
- **0.4.5.** Role verification for admin and guidance routes.
- **0.4.6.** Automatic logout for archived users.
- **0.4.7.** Session persistence across browser tabs.
- **0.4.8.** Secure password handling (never stored in plain text).

---

## 1. Admin Functions
### 1.1. System and User Management
- **1.1.1.** Secure multi-role authentication system supporting administrators, guidance counselors, and students.
- **1.1.2.** Comprehensive user profile management with personal, academic, and guardian information.
- **1.1.3.** User archiving and unarchiving system for data management.
- **1.1.4.** Real-time user activity tracking.

### 1.2. Dashboard Management
- **1.2.1.** Centralized admin dashboard with comprehensive user and content management.
- **1.2.2.** Real-time notification system for new registrations, logins, and user activities with Facebook-style sound notifications.
- **1.2.3.** Advanced data visualization with interactive charts (pie graphs, bar graphs, line charts) for anxiety levels, user demographics, and appointment analytics.
- **1.2.4.** User record management with edit, delete, and archive functionality.
- **1.2.5.** Real-time data refresh with automatic updates using Supabase real-time subscriptions.
- **1.2.6.** Complete CRUD operations for CBT modules, anxiety videos, relaxation tools, and todo lists with categorization and assignment features.
- **1.2.7.** Comprehensive appointment scheduling and management system with calendar view.
- **1.2.8.** Referral management system for psychiatric referrals with email integration and document export (CSV, Excel, Word).
- **1.2.9.** Smooth entrance animations for dashboard components with staggered delays.
- **1.2.10.** Modern gradient backgrounds, glass morphism effects, and responsive design.

---

## 2. Guidance Counselor Functions
### 2.1. Student Monitoring and Support
- **2.1.1.** Complete access to student anxiety assessment results (GAD-7 scores) with historical tracking and progress visualization.
- **2.1.2.** Risk assessment capabilities with predefined thresholds and automated high-risk student identification.
- **2.1.3.** Guardian contact system with phone and email integration for follow-up communications.
- **2.1.4.** Advanced appointment scheduling system with conflict prevention, status tracking, and automated notifications.
- **2.1.5.** Comprehensive student record management with session history, visit tracking, and printable reports (PDF, Excel, Word).
- **2.1.6.** Psychiatric referral system with urgency levels (critical, high, medium, low), progress summaries, and document attachments.
- **2.1.7.** Complete CRUD operations for CBT modules, anxiety videos, relaxation tools, and todo lists with categorization and assignment features.
- **2.1.8.** Anxiety history modal displaying complete assessment timeline with:
  - Summary statistics (total assessments, average percentage, current level)
  - Level distribution with visual progress bars
  - Chronological assessment timeline with trend indicators
  - Automatic action alerts for moderate/severe cases
  - Color-coded anxiety levels (green, blue, yellow, red)
- **2.1.9.** Real-time notifications with sound alerts for student activities.
- **2.1.10.** Modern UI with gradient designs and smooth animations.

---

## 3. Referral Management Functions
### 3.1. Mental Health Referral Flow
- **3.1.1.** Multi-source referral system supporting faculty, staff, parent/guardian, peer, and self-referrals.
- **3.1.2.** Comprehensive referral form with detailed reason categorization and urgency level assessment.
- **3.1.3.** Document attachment system for supporting materials and referral documentation.
- **3.1.4.** Referral trail documentation with timestamps and status updates.
- **3.1.5.** Psychiatrist contact information management.
- **3.1.6.** Student progress summary and intervention attempts documentation.
- **3.1.7.** Automated email composition with pre-filled referral details.
- **3.1.8.** Data export functionality (CSV, Excel, Word) with formatted tables and professional layouts.
- **3.1.9.** Search and filter capabilities for referrals.
- **3.1.10.** Status badges with color-coded urgency levels.

---

## 4. Student Functions
### 4.1. Anxiety Assessment and Tracking
- **4.1.1.** Standardized GAD-7 anxiety assessment with real-time scoring and anxiety level classification:
  - Minimal (0-24%): Green
  - Mild (25-49%): Blue
  - Moderate (50-74%): Yellow/Amber
  - Severe (75-100%): Red
- **4.1.2.** Personal anxiety level tracking with visual dashboards and progress monitoring.
- **4.1.3.** Streak tracking system for daily engagement and motivation.
- **4.1.4.** Assessment history modal with complete timeline and trend analysis.

### 4.2. CBT Modules
- **4.2.1.** Interactive CBT module system with assigned content, progress tracking, and status management.
- **4.2.2.** Module categorization with detailed descriptions and completion tracking.
- **4.2.3.** Modern card-based UI with gradient backgrounds and hover effects.
- **4.2.4.** Filter system by status (all, in-progress, completed) and category.

### 4.3. Relaxation Tools
- **4.3.1.** Comprehensive relaxation toolkit including guided meditation and breathing exercises.
- **4.3.2.** Nature sound integration with customizable audio experiences.
- **4.3.3.** Mood check-in system integrated with relaxation activities.
- **4.3.4.** Interactive breathing exercise with visual guidance.

### 4.4. Anxiety Videos
- **4.4.1.** Curated anxiety management video library with progress tracking and status management.
- **4.4.2.** Video categorization and search functionality.
- **4.4.3.** Modern card layout with gradient backgrounds and hover animations.

### 4.5. Gamification and Engagement
- **4.5.1.** Interactive anxiety relief games with collectible items.
- **4.5.2.** Streak pet system with visual feedback and daily engagement rewards.
- **4.5.3.** Brain training games for cognitive enhancement.

### 4.6. Task Management
- **4.6.1.** Personal todo list system with anxiety-related task tracking.
- **4.6.2.** Task categorization (personal, academic, wellness, therapy), priority levels (low, medium, high), and completion tracking.
- **4.6.3.** Student task creation functionality with modal form.
- **4.6.4.** Real-time synchronization with admin and guidance dashboards.
- **4.6.5.** Due date management and overdue task indicators.
- **4.6.6.** Statistics display (total, completed, in-progress, overdue).

### 4.7. Notifications and Appointments
- **4.7.1.** Real-time notification system for appointments, referrals, and activity updates.
- **4.7.2.** Appointment viewing and management capabilities.
- **4.7.3.** Calendar integration for scheduled sessions.

---

## 5. System Evaluation
### 5.1. Effectiveness Testing
- **5.1.1.** Evaluate the app's impact on anxiety reduction using a Randomized Controlled Trial (RCT) methodology.
- **5.1.2.** Compare pre- and post-intervention GAD-7 scores between the control and intervention groups.
- **5.1.3.** Track student engagement metrics (login frequency, module completion, assessment participation).
- **5.1.4.** Analyze anxiety level trends over time with visual charts.

---

## 6. Usability and Engagement Assessment
### 6.1. Test the system using the following criteria:
- **Functionality**: Ensure all features (CBT modules, assessments, gamification, authentication) work as intended.
- **Performance**: Optimize load times and responsiveness across devices with smooth animations (0.8s duration).
- **Reliability**: Minimize crashes or data loss during use with proper error handling.
- **Usability**: Assess intuitiveness via student and counselor feedback with modern UI/UX patterns.
- **Portability**: Verify compatibility with iOS and Android platforms (responsive design with mobile-first approach).
- **Accessibility**: Ensure proper color contrast, touch targets (minimum 48px), and screen reader compatibility.
- **Security**: Validate authentication flows, session management, and data protection.

---

## Design System Consistency
### Color Coding Standards:
- **Anxiety Levels**:
  - Minimal: Green (#10b981, #dcfce7)
  - Mild: Blue (#3b82f6, #dbeafe)
  - Moderate: Yellow/Amber (#f59e0b, #fef3c7)
  - Severe: Red (#ef4444, #fee2e2)

- **Status Colors**:
  - Completed: Green
  - In Progress: Yellow
  - Pending: Red
  - Scheduled: Blue

### UI/UX Standards:
- **Typography**: Poppins font family (weights 300-700)
- **Animations**: 0.8s duration with cubic-bezier(0.25, 0.46, 0.45, 0.94) easing
- **Corners**: rounded-2xl (16px) for cards and containers
- **Shadows**: shadow-xl and shadow-2xl for depth
- **Gradients**: Consistent gradient backgrounds across components
- **Glass Morphism**: backdrop-blur-sm for modern overlay effects
- **Responsive Breakpoints**: 
  - xs: < 640px (mobile phones)
  - sm: 640px+ (large phones, small tablets)
  - md: 768px+ (tablets)
  - lg: 1024px+ (laptops, desktops)
  - xl: 1280px+ (large screens)

---

## Technical Implementation
### Frontend:
- **Framework**: React with TypeScript
- **Routing**: React Router v6 with protected routes
- **Styling**: TailwindCSS with custom configurations
- **Icons**: React Icons (Font Awesome)
- **Animations**: Framer Motion and CSS keyframes
- **Charts**: Chart.js with react-chartjs-2
- **Notifications**: SweetAlert2 for toast notifications
- **State Management**: React hooks (useState, useEffect, useContext)

### Backend:
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase real-time subscriptions
- **Storage**: Supabase Storage for file uploads
- **Row Level Security**: RLS policies for data protection

### Features:
- **Real-time Updates**: Automatic data synchronization across all dashboards
- **Sound Notifications**: Web Audio API for programmatic sound generation
- **Document Export**: PDF, Excel, Word generation for reports
- **Email Integration**: Automated email composition for referrals and notifications
- **Dark Mode**: System-wide dark mode support with localStorage persistence
- **Responsive Design**: Mobile-first approach with touch-friendly interfaces

---

**Document Version**: 1.0  
**Last Updated**: October 29, 2025  
**Project**: Anxiety Management Application for Students
