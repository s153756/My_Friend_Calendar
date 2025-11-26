import React, { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';

function App() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    console.log("Attempting to fetch from backend...");

    fetch('http://localhost:5000/api/users/first')
      .then(res => res.json())
      .then(data => {
        console.log("Data received:", data);
        setMessage(data.email || data.message);
      })
      .catch(err => {
        console.error("Error fetching:", err);
        setMessage("Error connecting to backend");
      });
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
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
