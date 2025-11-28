import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoginForm from './components/LoginForm';
import { useAuthStore } from './useAuthStore'; 
// 1. Import apiClient and ensure the path is correct
import apiClient from './api/apiClient'; 

function App() {
  // 2. Define all state and store variables at the top level
  const { user, setLogin, logout } = useAuthStore();
  const [message, setMessage] = useState('');
  const [protectedTestResult, setProtectedTestResult] = useState(null);

  // 3. Define the async function INSIDE the component
  const runProtectedCallTest = async () => {
    // 🔑 State setters (like setProtectedTestResult) are now in scope
    setProtectedTestResult("Attempting to access /protected...");
    try {
      // 🔑 apiClient is now imported and used
      const response = await apiClient.get('/auth/protected');
      setProtectedTestResult(`✅ Access Token Test SUCCESS! Message: ${response.data.message}`);
      
    } catch (error) {
      // If the interceptor fails (e.g., refresh token expired), it should handle logout.
      let errorMessage = "❌ Access Token Test FAILED! ";
      if (error.response && error.response.status === 401) {
          errorMessage += "Token not sent or expired.";
      } else {
          errorMessage += "Check console for network/refresh errors.";
      }
      setProtectedTestResult(errorMessage);
    }
  };

  useEffect(() => {
    console.log("Attempting to fetch from backend...");

    axios.get('http://localhost:5000/api/users/first')
      .then(response => {
        const data = response.data;
        console.log("Data received:", data);
        setMessage(data.email || data.message);
      })
      .catch(error => {
        console.error("Error fetching:", error);

        if (error.response) {
            setMessage(`Backend Error: ${error.response.status}`);
        } else {
            setMessage("Error connecting to backend");
        }
      });
  }, []);

  const handleLoginSuccess = (data) => {
    const { access_token, user } = data;

    setLogin(access_token, user);

    console.log("Login successful. Token and user stored in Zustand.");

    // The function is now correctly called
    runProtectedCallTest();
  };

  const handleLogout = () => {
    logout();
    // Clear test status on logout
    setProtectedTestResult(null); 
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Docker Test</h1>
        <p>
          {/* 'message' is in scope */}
          Backend says: <strong>{message || "Loading..."}</strong>
        </p>
      </header>
      <main className="App-main">
        {/* 'user' is in scope */}
        {user ? (
          <div className="user-dashboard">
            {/* 'user.email' is in scope */}
            <h2>Welcome, {user.email}!</h2>
            
            {/* 🔑 'protectedTestResult' is in scope */}
            <p style={{ fontWeight: 'bold' }}>Test Status: {protectedTestResult}</p>
            
            <p>User ID: {user.id}</p>
            <p>Email verified: {user.is_email_verified ? 'Yes' : 'No'}</p>
            
            {/* Handlers are now correctly referenced */}
            <button onClick={runProtectedCallTest} style={{ marginRight: '10px' }}>
              Re-Test Protected Route
            </button>
            <button onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <LoginForm onLoginSuccess={handleLoginSuccess} />
        )}
      </main>
    </div>
  );
}

export default App;