import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoginForm from './components/LoginForm';
import { useAuthStore } from './useAuthStore';

function App() {
  const { user, setLogin, logout } = useAuthStore();
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
  }, []);

  const handleLoginSuccess = (data) => {
    const { access_token, user } = data;

    setLogin(access_token, user);

    console.log("Login successful. Token and user stored in Zustand.");
  };

  const handleLogout = () => {
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Docker Test</h1>
        <p>
          Backend says: <strong>{message || "Loading..."}</strong>
        </p>
      </header>
      <main className="App-main">
        {user ? (
          <div className="user-dashboard">
            <h2>Welcome, {user.email}!</h2>
            <p>User ID: {user.id}</p>
            <p>Email verified: {user.is_email_verified ? 'Yes' : 'No'}</p>
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
