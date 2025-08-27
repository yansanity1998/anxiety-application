# CBT Module System

## Overview

The CBT (Cognitive Behavioral Therapy) Module System is a comprehensive feature that allows administrators and guidance counselors to create, manage, and assign CBT modules to students. Students can then view, interact with, and track their progress through these modules.

## Features

### For Administrators & Guidance Counselors
- **Create CBT Modules**: Add new modules with title, description, and optional image
- **Assign to Students**: Assign modules to specific students
- **Manage Modules**: Edit, delete, and update module status
- **View All Modules**: See all modules across all students
- **Filter & Search**: Filter modules by status and user
- **Status Management**: Change module status (not started, in progress, completed, paused)

### For Students
- **View Assigned Modules**: See only modules assigned to them
- **Module Details**: View comprehensive module information
- **Progress Tracking**: Update module status and track progress
- **Filter Options**: Filter modules by status
- **Interactive Interface**: Beautiful, responsive design with animations

## Database Schema

### Table: `cbt_module`

```sql
CREATE TABLE cbt_module (
    id BIGSERIAL PRIMARY KEY,
    profile_id BIGINT REFERENCES profiles(id) ON DELETE CASCADE,
    module_title TEXT NOT NULL,
    module_description TEXT,
    module_status TEXT DEFAULT 'not_started' CHECK (module_status IN ('not_started', 'in_progress', 'completed', 'paused')),
    module_date_started TIMESTAMP WITH TIME ZONE,
    module_date_complete TIMESTAMP WITH TIME ZONE,
    module_image TEXT, -- URL or path to the module image
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
```

### Key Features:
- **Row Level Security (RLS)**: Users can only access their own modules
- **Automatic Timestamps**: `created_at` and `updated_at` are automatically managed
- **Status Tracking**: Tracks when modules are started and completed
- **Image Support**: Optional image URLs for visual content

## File Structure

```
src/
├── lib/
│   └── cbtModuleService.ts          # Service layer for CBT operations
├── admin/
│   └── components/
│       └── CBTModules.tsx           # Admin CBT management interface
├── guidance/
│   └── components/
│       └── CBTModules.tsx           # Guidance CBT management interface
├── user/
│   └── components/
│       └── CBTModules.tsx           # Student CBT viewing interface
└── App.tsx                          # Routes for CBT modules
```

## Service Layer

### `cbtModuleService.ts`

The service layer provides the following methods:

```typescript
// Get modules for current user
getCurrentUserModules(): Promise<CBTModule[]>

// Get all modules (admin/guidance)
getAllModules(): Promise<CBTModule[]>

// Get modules by profile
getModulesByProfile(profileId: number): Promise<CBTModule[]>

// Get modules by status
getModulesByStatus(profileId: number, status: string): Promise<CBTModule[]>

// Create new module
createModule(moduleData: CreateCBTModuleData): Promise<CBTModule>

// Update module
updateModule(moduleData: UpdateCBTModuleData): Promise<CBTModule>

// Update module status
updateModuleStatus(id: number, status: string): Promise<CBTModule>

// Delete module
deleteModule(id: number): Promise<void>
```

## Components

### Admin/Guidance CBT Modules Component
- **Location**: `src/admin/components/CBTModules.tsx` and `src/guidance/components/CBTModules.tsx`
- **Features**:
  - Grid view of all modules
  - Add/Edit/Delete functionality
  - User assignment dropdown
  - Status filtering
  - Image upload support
  - Modal forms for editing

### Student CBT Modules Component
- **Location**: `src/user/components/CBTModules.tsx`
- **Features**:
  - Card-based module display
  - Status filtering
  - Module detail modal
  - Progress tracking
  - Responsive design
  - Smooth animations

## Usage

### For Administrators/Guidance Counselors

1. **Access CBT Modules**:
   - Navigate to Admin or Guidance Dashboard
   - Click on "CBT Modules" in the navigation

2. **Create a New Module**:
   - Click "Add Module" button
   - Fill in required fields:
     - Assign to User (select from dropdown)
     - Module Title
     - Description
     - Image URL (optional)
   - Click "Add Module"

3. **Manage Existing Modules**:
   - Use filters to find specific modules
   - Click "Edit" to modify module details
   - Click "Delete" to remove modules
   - Use status buttons to change module status

### For Students

1. **Access CBT Modules**:
   - From Dashboard, click "CBT Modules" in the Wellness Toolkit
   - Or navigate to `/cbt-modules`

2. **View Modules**:
   - See all assigned modules in card format
   - Use status filter to view specific modules
   - Click "View Details" for more information

3. **Update Progress**:
   - Use status buttons to update module progress
   - Start, pause, complete, or reset modules
   - Track start and completion dates

## API Endpoints

The system uses Supabase for data operations:

- **GET** `/cbt_module` - Fetch modules (with RLS)
- **POST** `/cbt_module` - Create new module
- **PUT** `/cbt_module/:id` - Update module
- **DELETE** `/cbt_module/:id` - Delete module

## Security

### Row Level Security (RLS) Policies

```sql
-- Users can view their own modules
CREATE POLICY "Users can view their own CBT modules"
    ON cbt_module FOR SELECT
    USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Users can insert their own modules
CREATE POLICY "Users can insert their own CBT modules"
    ON cbt_module FOR INSERT
    WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Users can update their own modules
CREATE POLICY "Users can update their own CBT modules"
    ON cbt_module FOR UPDATE
    USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Admins can view all modules
CREATE POLICY "Admins can view all CBT modules"
    ON cbt_module FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));
```

## Testing

Run the test script to verify functionality:

```bash
node scripts/test_cbt_modules.js
```

This will test:
- Database connectivity
- CRUD operations
- RLS policies
- Status updates
- Error handling

## Sample Data

The system includes sample CBT modules:

```sql
INSERT INTO cbt_module (profile_id, module_title, module_description, module_status, module_image) VALUES
(1, 'Understanding Anxiety', 'Learn about the basics of anxiety and how it affects your daily life', 'not_started', '/images/anxiety-basics.jpg'),
(1, 'Cognitive Restructuring', 'Identify and challenge negative thought patterns', 'not_started', '/images/cognitive-restructuring.jpg'),
(1, 'Exposure Therapy', 'Gradually face your fears in a safe environment', 'not_started', '/images/exposure-therapy.jpg'),
(1, 'Relaxation Techniques', 'Master breathing exercises and progressive muscle relaxation', 'not_started', '/images/relaxation-techniques.jpg'),
(1, 'Mindfulness and Meditation', 'Develop present-moment awareness and reduce stress', 'not_started', '/images/mindfulness.jpg');
```

## Future Enhancements

Potential improvements for the CBT module system:

1. **Content Management**: Rich text editor for module content
2. **Progress Tracking**: More detailed progress metrics
3. **Notifications**: Reminders for incomplete modules
4. **Analytics**: Progress reports and insights
5. **Mobile App**: Native mobile application
6. **Offline Support**: Work offline and sync when online
7. **Multimedia**: Video and audio content support
8. **Gamification**: Points and achievements for completion

## Troubleshooting

### Common Issues

1. **Modules not appearing**: Check RLS policies and user authentication
2. **Permission errors**: Verify user role and profile association
3. **Image not loading**: Check image URL validity and CORS settings
4. **Status not updating**: Ensure proper authentication and module ownership

### Debug Steps

1. Check browser console for errors
2. Verify Supabase connection
3. Test RLS policies manually
4. Check user authentication status
5. Verify profile association

## Support

For issues or questions about the CBT module system:

1. Check the troubleshooting section above
2. Review the test script output
3. Verify database schema and policies
4. Check user permissions and roles 