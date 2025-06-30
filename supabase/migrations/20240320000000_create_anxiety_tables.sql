-- Create profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create anxiety_assessments table
CREATE TABLE anxiety_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    total_score INTEGER NOT NULL,
    percentage INTEGER NOT NULL,
    anxiety_level TEXT NOT NULL,
    answers INTEGER[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_anxiety_assessments_profile_id ON anxiety_assessments(profile_id);
CREATE INDEX idx_anxiety_assessments_created_at ON anxiety_assessments(created_at);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE anxiety_assessments ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Create policies for anxiety_assessments
CREATE POLICY "Users can view their own assessments"
    ON anxiety_assessments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = anxiety_assessments.profile_id
            AND profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own assessments"
    ON anxiety_assessments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = anxiety_assessments.profile_id
            AND profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own assessments"
    ON anxiety_assessments FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = anxiety_assessments.profile_id
            AND profiles.user_id = auth.uid()
        )
    );

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER handle_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_anxiety_assessments_updated_at
    BEFORE UPDATE ON anxiety_assessments
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at(); 