import { supabase } from '../../lib/supabase';

export async function archiveUser(profileId: number) {
	const { error } = await supabase
		.from('profiles')
		.update({ role: 'archived' })
		.eq('id', profileId);

	if (error) {
		throw new Error(`Failed to archive user: ${error.message}`);
	}
}

export async function unarchiveUser(profileId: number) {
	const { error } = await supabase
		.from('profiles')
		.update({ role: 'student' })
		.eq('id', profileId);

	if (error) {
		throw new Error(`Failed to unarchive user: ${error.message}`);
	}
}

export function isArchived(role?: string): boolean {
	return (role || '').toLowerCase() === 'archived';
} 