-- Add policy to allow students to view their own referrals
CREATE POLICY "Students can view their own referrals"
    ON referrals
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND id = referrals.student_id
            AND role = 'student'
        )
    );
