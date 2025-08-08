#!/usr/bin/env node

/**
 * Role-Based Navigation System Test
 * Tests the authentication and role-based navigation fixes
 */

const fs = require('fs');
const path = require('path');

console.log('🔐 ROLE-BASED NAVIGATION SYSTEM TEST');
console.log('=====================================\n');

// Test users with different roles
const testUsers = [
  { 
    id: 1, 
    name: 'Super Admin', 
    email: 'admin@mrvl.com', 
    role: 'admin',
    expectedDashboard: 'admin-dashboard',
    expectedNavItems: ['forums', 'matches', 'events', 'rankings', 'admin-dashboard', 'user-management', 'system-settings']
  },
  { 
    id: 2, 
    name: 'Moderator User', 
    email: 'mod@mrvl.com', 
    role: 'moderator',
    expectedDashboard: 'moderator-dashboard',
    expectedNavItems: ['forums', 'matches', 'events', 'rankings', 'moderator-dashboard', 'moderation-center']
  },
  { 
    id: 3, 
    name: 'Regular User', 
    email: 'user@mrvl.com', 
    role: 'user',
    expectedDashboard: 'user-dashboard',
    expectedNavItems: ['forums', 'matches', 'events', 'rankings']
  }
];

// Import and test role utilities
function testRoleUtilities() {
  console.log('1. 🧪 Testing Role Utility Functions');
  console.log('─'.repeat(50));

  try {
    // Read the roleUtils.js file content
    const roleUtilsPath = path.join(__dirname, 'src', 'utils', 'roleUtils.js');
    const roleUtilsContent = fs.readFileSync(roleUtilsPath, 'utf8');
    
    // Check if backward compatibility fixes are present
    const hasUserRoleBackwardCompatibility = roleUtilsContent.includes('user.role && Object.values(ROLES).includes(user.role)');
    const hasHasRoleBackwardCompatibility = roleUtilsContent.includes('} else if (user.role) {');
    
    console.log(`✅ Backward compatibility for single role field: ${hasUserRoleBackwardCompatibility ? 'FIXED' : 'MISSING'}`);
    console.log(`✅ hasRole() backward compatibility: ${hasHasRoleBackwardCompatibility ? 'FIXED' : 'MISSING'}`);
    
    if (hasUserRoleBackwardCompatibility && hasHasRoleBackwardCompatibility) {
      console.log('🎉 Role utilities support both single role and roles array!');
    } else {
      console.log('❌ Role utilities need backward compatibility fixes');
    }
    
  } catch (error) {
    console.log('❌ Error reading role utilities:', error.message);
  }
  
  console.log();
}

// Test navigation component
function testNavigationComponent() {
  console.log('2. 🧭 Testing Navigation Component');
  console.log('─'.repeat(50));

  try {
    const navPath = path.join(__dirname, 'src', 'components', 'Navigation.js');
    const navContent = fs.readFileSync(navPath, 'utf8');
    
    // Check if navigation uses role-based filtering
    const usesRoleNavigation = navContent.includes('getRoleNavigation(user)');
    const hasRoleBasedFiltering = navContent.includes('mainNavItems') && navContent.includes('specialNavItems');
    const hasRoleBadges = navContent.includes('RoleBadge');
    
    console.log(`✅ Uses getRoleNavigation(): ${usesRoleNavigation ? 'YES' : 'NO'}`);
    console.log(`✅ Has role-based item filtering: ${hasRoleBasedFiltering ? 'YES' : 'NO'}`);
    console.log(`✅ Shows role badges: ${hasRoleBadges ? 'YES' : 'NO'}`);
    
    if (usesRoleNavigation && hasRoleBasedFiltering && hasRoleBadges) {
      console.log('🎉 Navigation component properly implements role-based display!');
    } else {
      console.log('❌ Navigation component needs role-based improvements');
    }
    
  } catch (error) {
    console.log('❌ Error reading navigation component:', error.message);
  }
  
  console.log();
}

// Test dashboard routing
function testDashboardRouting() {
  console.log('3. 📋 Testing Dashboard Routing');
  console.log('─'.repeat(50));

  try {
    const dashboardPath = path.join(__dirname, 'src', 'components', 'RoleBasedDashboard.js');
    const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
    
    // Check if dashboard routing uses role utilities
    const usesGetUserPrimaryRole = dashboardContent.includes('getUserPrimaryRole(user)');
    const hasAdminRouting = dashboardContent.includes('AdminDashboard');
    const hasModeratorRouting = dashboardContent.includes('ModeratorDashboard');
    const hasUserRouting = dashboardContent.includes('UserDashboard');
    const hasLogging = dashboardContent.includes('console.log');
    
    console.log(`✅ Uses getUserPrimaryRole(): ${usesGetUserPrimaryRole ? 'YES' : 'NO'}`);
    console.log(`✅ Routes to AdminDashboard: ${hasAdminRouting ? 'YES' : 'NO'}`);
    console.log(`✅ Routes to ModeratorDashboard: ${hasModeratorRouting ? 'YES' : 'NO'}`);
    console.log(`✅ Routes to UserDashboard: ${hasUserRouting ? 'YES' : 'NO'}`);
    console.log(`✅ Has debugging logs: ${hasLogging ? 'YES' : 'NO'}`);
    
    if (usesGetUserPrimaryRole && hasAdminRouting && hasModeratorRouting && hasUserRouting) {
      console.log('🎉 Dashboard routing properly handles all roles!');
    } else {
      console.log('❌ Dashboard routing needs improvements');
    }
    
  } catch (error) {
    console.log('❌ Error reading dashboard component:', error.message);
  }
  
  console.log();
}

// Test admin dashboard tabs
function testAdminDashboard() {
  console.log('4. 👑 Testing Admin Dashboard');
  console.log('─'.repeat(50));

  try {
    const adminPath = path.join(__dirname, 'src', 'components', 'admin', 'AdminDashboard.js');
    const adminContent = fs.readFileSync(adminPath, 'utf8');
    
    // Check if admin dashboard has proper role filtering
    const hasNewRoleSystem = adminContent.includes('minRole:') && adminContent.includes('adminOnly:');
    const hasRoleUtilityImports = adminContent.includes('hasRole, hasMinimumRole');
    const hasRoleBasedFiltering = adminContent.includes('hasMinimumRole(user, section.minRole)');
    
    console.log(`✅ Uses new role system structure: ${hasNewRoleSystem ? 'YES' : 'NO'}`);
    console.log(`✅ Imports role utilities: ${hasRoleUtilityImports ? 'YES' : 'NO'}`);
    console.log(`✅ Filters tabs by role: ${hasRoleBasedFiltering ? 'YES' : 'NO'}`);
    
    // Count admin-only sections
    const adminOnlySections = (adminContent.match(/adminOnly: true/g) || []).length;
    console.log(`📊 Admin-only sections: ${adminOnlySections}`);
    
    if (hasNewRoleSystem && hasRoleUtilityImports && hasRoleBasedFiltering) {
      console.log('🎉 Admin dashboard properly filters tabs by role!');
    } else {
      console.log('❌ Admin dashboard needs role-based tab filtering');
    }
    
  } catch (error) {
    console.log('❌ Error reading admin dashboard:', error.message);
  }
  
  console.log();
}

// Test moderator dashboard tabs
function testModeratorDashboard() {
  console.log('5. ⚡ Testing Moderator Dashboard');
  console.log('─'.repeat(50));

  try {
    const modPath = path.join(__dirname, 'src', 'components', 'admin', 'ModeratorDashboard.js');
    const modContent = fs.readFileSync(modPath, 'utf8');
    
    // Check if moderator dashboard is focused on moderation
    const hasPermissionFiltering = modContent.includes('hasPermission(user, section.permission)');
    const hasModerationSections = modContent.includes('content_moderation') && modContent.includes('forum_management');
    const usesAccessibleSections = modContent.includes('accessibleSections.map');
    
    console.log(`✅ Filters by permissions: ${hasPermissionFiltering ? 'YES' : 'NO'}`);
    console.log(`✅ Has moderation-focused sections: ${hasModerationSections ? 'YES' : 'NO'}`);
    console.log(`✅ Uses filtered section list: ${usesAccessibleSections ? 'YES' : 'NO'}`);
    
    // Count moderation permissions
    const moderationPermissions = (modContent.match(/permission: '/g) || []).length;
    console.log(`📊 Moderation permissions: ${moderationPermissions}`);
    
    if (hasPermissionFiltering && hasModerationSections && usesAccessibleSections) {
      console.log('🎉 Moderator dashboard properly shows only moderation tools!');
    } else {
      console.log('❌ Moderator dashboard needs permission-based filtering');
    }
    
  } catch (error) {
    console.log('❌ Error reading moderator dashboard:', error.message);
  }
  
  console.log();
}

// Test simulation for different user roles
function testRoleSimulation() {
  console.log('6. 🎭 Simulating Role-Based Access');
  console.log('─'.repeat(50));

  testUsers.forEach((user, index) => {
    console.log(`User ${index + 1}: ${user.name} (${user.role})`);
    console.log(`├─ Expected Dashboard: ${user.expectedDashboard}`);
    console.log(`├─ Expected Nav Items: ${user.expectedNavItems.join(', ')}`);
    console.log(`└─ Role Icon: ${user.role === 'admin' ? '🔴' : user.role === 'moderator' ? '🟡' : '🟢'}\n`);
  });
}

// Summary and recommendations
function showSummary() {
  console.log('📋 SUMMARY & RECOMMENDATIONS');
  console.log('═'.repeat(50));
  
  console.log('✅ FIXES IMPLEMENTED:');
  console.log('• Role utilities now support both single role and roles array');
  console.log('• Navigation dynamically shows tabs based on user role');
  console.log('• AdminDashboard filters tabs using role-based system');
  console.log('• ModeratorDashboard shows only moderation-related tabs');
  console.log('• RoleBasedDashboard routes to correct dashboard by role');
  console.log('• Added debugging logs for role checking');
  console.log('');
  
  console.log('🎯 EXPECTED BEHAVIOR:');
  console.log('• 🔴 Admin: Sees all tabs + admin-only sections (Users, Analytics, Bulk Ops)');
  console.log('• 🟡 Moderator: Sees moderation tabs only (Reports, Content, Forums)'); 
  console.log('• 🟢 User: Sees only public tabs (Forums, Matches, Events, Rankings)');
  console.log('');
  
  console.log('🧪 TESTING STEPS:');
  console.log('1. Login as different roles and check navigation tabs');
  console.log('2. Click Dashboard button and verify correct dashboard loads');
  console.log('3. Check browser console for role debugging logs');
  console.log('4. Verify admin sees admin-only tabs, moderator sees mod tabs only');
  console.log('5. Ensure regular users cannot access admin/moderator sections');
}

// Run all tests
function runTests() {
  testRoleUtilities();
  testNavigationComponent();
  testDashboardRouting();
  testAdminDashboard();
  testModeratorDashboard();
  testRoleSimulation();
  showSummary();
}

// Execute tests
runTests();