// Simple browser test for guidance system
// This script can be run in the browser console to test the guidance login

console.log('🧪 Testing Guidance System in Browser...\n');

// Test 1: Check if guidance route exists
console.log('1. Checking if guidance route exists...');
if (window.location.pathname === '/guidance') {
  console.log('✅ Currently on guidance route');
} else {
  console.log('ℹ️  Not on guidance route (current:', window.location.pathname, ')');
}

// Test 2: Check if guidance dashboard component is loaded
console.log('\n2. Checking if guidance dashboard is loaded...');
const guidanceElements = document.querySelectorAll('[class*="guidance"], [class*="Guidance"]');
if (guidanceElements.length > 0) {
  console.log('✅ Guidance dashboard elements found:', guidanceElements.length);
} else {
  console.log('ℹ️  No guidance-specific elements found (may be on different page)');
}

// Test 3: Check if we can access Supabase (if available)
console.log('\n3. Checking Supabase access...');
if (window.supabase) {
  console.log('✅ Supabase client available');
  
  // Test if we can access the current user
  window.supabase.auth.getUser().then(({ data, error }) => {
    if (error) {
      console.log('ℹ️  No user logged in or error:', error.message);
    } else if (data.user) {
      console.log('✅ User logged in:', data.user.email);
      
      // Check if this is a guidance user
      if (data.user.email === 'guidance@gmail.com') {
        console.log('✅ This is the guidance account!');
      } else {
        console.log('ℹ️  This is not the guidance account');
      }
    }
  });
} else {
  console.log('ℹ️  Supabase client not available in this context');
}

// Test 4: Check for guidance-specific UI elements
console.log('\n4. Looking for guidance-specific UI elements...');
const guidanceTitle = document.querySelector('h1');
if (guidanceTitle && guidanceTitle.textContent.includes('Guidance')) {
  console.log('✅ Guidance dashboard title found:', guidanceTitle.textContent);
} else {
  console.log('ℹ️  Guidance dashboard title not found');
}

// Test 5: Check for student data tables
console.log('\n5. Checking for student data access...');
const tables = document.querySelectorAll('table');
if (tables.length > 0) {
  console.log('✅ Tables found:', tables.length);
  tables.forEach((table, index) => {
    const rows = table.querySelectorAll('tbody tr');
    console.log(`   Table ${index + 1}: ${rows.length} data rows`);
  });
} else {
  console.log('ℹ️  No tables found');
}

console.log('\n🎯 Guidance System Browser Test Complete!');
console.log('\n📋 To test the full system:');
console.log('1. Go to the login page');
console.log('2. Login with guidance@gmail.com / guidance123');
console.log('3. You should be redirected to /guidance');
console.log('4. The guidance dashboard should load with student data');
console.log('\n🚀 If you see any errors, check the browser console and network tab'); 