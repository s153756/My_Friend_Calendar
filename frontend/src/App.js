import React, { useEffect, useState } from 'react';

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    console.log("Attempting to fetch from backend...");

    fetch('http://localhost:5000/api/test-db')
      .then(res => res.json())
      .then(data => {
        console.log("Data received:", data);
        setMessage(data.message);
      })
      .catch(err => {
        console.error("Error fetching:", err);
        setMessage("Error connecting to backend");
      });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Docker Test</h1>
        <p>
          Backend says: <strong>{message || "Loading..."}</strong>
        </p>
      </header>
    </div>
  );
}

export default App;
