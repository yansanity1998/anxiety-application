import { supabase } from '../../lib/supabase';

export async function archiveUser(profileId: number) {
	// First, get the current role to save it as original_role
	const { data: profile, error: fetchError } = await supabase
		.from('profiles')
		.select('role')
		.eq('id', profileId)
		.single();

	if (fetchError) {
		throw new Error(`Failed to fetch user role: ${fetchError.message}`);
	}

	// Update the profile with archived role and save the original role
	const { error } = await supabase
		.from('profiles')
		.update({ 
			role: 'archived',
			original_role: profile.role // Save the current role before archiving
		})
		.eq('id', profileId);

	if (error) {
		throw new Error(`Failed to archive user: ${error.message}`);
	}
}

export async function unarchiveUser(profileId: number) {
	// Get the original role to restore it
	const { data: profile, error: fetchError } = await supabase
		.from('profiles')
		.select('original_role')
		.eq('id', profileId)
		.single();

	if (fetchError) {
		throw new Error(`Failed to fetch original role: ${fetchError.message}`);
	}

	// Restore the original role, defaulting to 'student' if no original_role was saved
	const roleToRestore = profile.original_role || 'student';

	const { error } = await supabase
		.from('profiles')
		.update({ 
			role: roleToRestore,
			original_role: null // Clear the original_role field after restoration
		})
		.eq('id', profileId);

	if (error) {
		throw new Error(`Failed to unarchive user: ${error.message}`);
	}

	return roleToRestore; // Return the restored role so UI can update accordingly
}

export function isArchived(role?: string): boolean {
	return (role || '').toLowerCase() === 'archived';
} 