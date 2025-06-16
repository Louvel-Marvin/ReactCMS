import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Dashboard: React.FC = () => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get('/api/dashboard', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = response.data as { message: string };
        setMessage(data.message);
      } catch (err) {
        setMessage('Access denied');
      }
    };

    fetchDashboard();
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      <p>{message}</p>
    </div>
  );
};

export default Dashboard;
