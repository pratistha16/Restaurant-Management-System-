import React, { useState } from 'react';
import api from '../api';
import { useNavigate, useParams } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { slug } = useParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Determine endpoint based on whether we have a slug (Tenant Login) or not (Super Admin Login)
      let endpoint = '/auth/login/';
      if (slug) {
        endpoint = `/tenant/${slug}/accounts/auth/login/`;
      }

      const response = await api.post(endpoint, {
        username,
        password,
      });
      
      const { role } = response.data;

      // Restriction: Only Super Admin can login without a slug
      if (!slug && role !== 'super_admin') {
        setError("Please login via your restaurant's specific URL.");
        return;
      }

      // Store tokens
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('username', username);
      
      if (role) {
        localStorage.setItem('role', role);
      }
      if (slug) {
        localStorage.setItem('restaurant_slug', slug);
      }
      
      // Redirect
      if (slug) {
          navigate(`/${slug}/dashboard`);
      } else {
          navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login failed', err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Invalid credentials');
      }
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: 'auto', padding: '20px' }}>
      <h2>{slug ? `Login to ${slug}` : 'Super Admin Login'}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <button type="submit" style={{ padding: '10px 20px' }}>Login</button>
      </form>
    </div>
  );
};

export default Login;
