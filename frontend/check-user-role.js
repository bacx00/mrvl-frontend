// Check user role and update if needed
const axios = require('axios');

async function checkUserRole() {
    const apiUrl = 'https://staging.mrvl.net/api';
    
    try {
        // Login
        const loginResponse = await axios.post(`${apiUrl}/auth/login`, {
            email: 'jhonny@ar-mediia.com',
            password: 'password123'
        });
        
        const token = loginResponse.data.token;
        const authApi = axios.create({
            baseURL: apiUrl,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        console.log('👤 Current user data:', loginResponse.data.user);
        
        // Get user profile
        try {
            const profileResponse = await authApi.get('/user');
            console.log('\n📋 User profile:', profileResponse.data);
        } catch (e) {
            console.log('Could not fetch profile:', e.response?.data);
        }
        
        // Try to get users list to see roles
        try {
            const usersResponse = await authApi.get('/users');
            const users = usersResponse.data.data || usersResponse.data;
            const currentUser = users.find(u => u.email === 'jhonny@ar-mediia.com');
            if (currentUser) {
                console.log('\n✅ Found user in list:', currentUser);
            }
        } catch (e) {
            console.log('Could not fetch users:', e.response?.data?.message);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

checkUserRole();