import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoginForm from './components/LoginForm';
import { useAuthStore } from './useAuthStore'; 
import TestCalendar from './components/TestCalendar';

function App() {
  const { user, setLogin, logout, statusMessage, statusType } = useAuthStore();
  const [message, setMessage] = useState('');

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
  }, [statusMessage]);

  const handleLoginSuccess = (data) => {
    const { access_token, user } = data;

    setLogin(access_token, user);

    console.log("Login successful. Token and user stored in Zustand.");
  };

  const handleLogout = async () => {
  try {
    const { logoutUser } = await import('./api/auth');
    await logoutUser();
  } catch (err) {
    console.error('Logout failed:', err);
  } finally {
    logout();
  }
};

  return (
    <div className="App">

      {statusMessage && (
        <div className={`status-banner ${statusType}`}>
          {statusMessage}
        </div>
      )}
      <main className="App-main">
        <LoginForm onLoginSuccess={handleLoginSuccess} />
        {user && (
          <div className="user-dashboard">
            <h2>Welcome, {user.email}!</h2>
            <p>User ID: {user.id}</p>
            <p>Email verified: {user.is_email_verified ? 'Yes' : 'No'}</p>
           <button onClick={handleLogout}>Logout</button>
          </div>
        )}
        <TestCalendar />
      </main>
    </div>
  );
}

export default App;