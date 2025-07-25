// Debug double elimination bracket structure
const axios = require('axios');

async function debugDoubleElim() {
    const apiUrl = 'https://staging.mrvl.net/api';
    const eventId = 8;
    
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
        
        // Get current event format
        const eventResponse = await authApi.get(`/events/${eventId}`);
        console.log('Current event format:', eventResponse.data.data.format);
        
        // Get bracket
        const bracketResponse = await authApi.get(`/events/${eventId}/bracket`);
        console.log('\nBracket response structure:', JSON.stringify(bracketResponse.data, null, 2));
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

debugDoubleElim();