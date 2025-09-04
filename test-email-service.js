// Test script for Resend email service
// Run this in your browser console to test the email functionality

// Test data
const testReferralData = {
  psychiatrist_email: 'test@example.com', // Replace with a real email for testing
  psychiatrist_name: 'Dr. Test Psychiatrist',
  student_name: 'John Doe',
  student_email: 'john.doe@student.edu',
  referral_reason: 'Student has been experiencing severe anxiety attacks during exams and presentations. Previous guidance sessions have helped but symptoms persist and are affecting academic performance.',
  urgency_level: 'high',
  psychiatrist_phone: '+1 (555) 123-4567',
  referred_by_name: 'Test Guidance Counselor',
  created_at: new Date().toISOString()
};

// Test the email service
async function testEmailService() {
  try {
    console.log(' Testing Resend email service...');
    console.log(' Test data:', testReferralData);
    
    // Import the email service (you'll need to adjust the path)
    const { sendReferralEmail } = await import('./src/lib/emailService.ts');
    
    const result = await sendReferralEmail(testReferralData);
    
    if (result.success) {
      console.log(' Email test successful!', result);
      alert('Email test successful! Check the recipient inbox.');
    } else {
      console.error(' Email test failed:', result);
      alert('Email test failed. Check console for details.');
    }
  } catch (error) {
    console.error(' Email test error:', error);
    alert('Email test error: ' + error.message);
  }
}

// Run the test
testEmailService();
