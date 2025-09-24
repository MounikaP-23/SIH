const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAuth() {
  try {
    console.log('Testing authentication endpoints...\n');

    // Test 1: Check if server is running
    console.log('1. Testing server connection...');
    try {
      const response = await axios.get('http://localhost:5000/');
      console.log('✅ Server is running:', response.data.message);
    } catch (error) {
      console.log('❌ Server is not running:', error.message);
      return;
    }

    // Test 2: Test signup
    console.log('\n2. Testing signup...');
    try {
      const signupData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'Student',
        classLevel: 5,
        languagePreference: 'en'
      };
      
      const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, signupData);
      console.log('✅ Signup successful:', signupResponse.data.user.name);
      
      // Test 3: Test login with the created user
      console.log('\n3. Testing login...');
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
      console.log('✅ Login successful:', loginResponse.data.user.name);
      
      // Test 4: Test protected route
      console.log('\n4. Testing protected route...');
      const token = loginResponse.data.token;
      const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Protected route access successful:', meResponse.data.user.name);
      
    } catch (error) {
      if (error.response) {
        console.log('❌ API Error:', error.response.status, error.response.data.message);
      } else {
        console.log('❌ Network Error:', error.message);
      }
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testAuth();

