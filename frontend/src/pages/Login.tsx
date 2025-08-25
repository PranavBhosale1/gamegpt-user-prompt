import React, { useState } from 'react';
import { Layout } from "@/components/Layout";
import axios from './axiosInstance';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import environment from './environment'; 
const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const isFormValid = username.trim() !== '' && password.trim() !== '';

  const handleLogin = async () => {
    if (!isFormValid) return;

    setIsSubmitting(true);
    setMessage('');

    try {
     const response = await axios.post(`${environment.apiUrl}/api/login`, {
        username,
        password
      });

      console.log('response.data',response.data.token)

      if (response.status === 200 && response.data?.user) {
        const { id, email,fullname } = response.data.user;
        localStorage.setItem('userId', id);
        localStorage.setItem('email', email);
        localStorage.setItem('fullname', fullname);
const role = response.data.user.role; // Assuming the role is returned in the user object
console.log('User role:', role); // Debugging line
        setMessage('✅ Login successful');
       if (role === 'admin') {
    navigate('/index');
   } 
   //else if (role === 'admin') {
  //   navigate('/dashboard'); // or '/observations' if that’s your admin page
  // } 
  else {
    navigate('/'); // fallback
  }
      } else {
        setMessage('❌ Login failed');
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || '❌ Login failed');
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <form className="login-form" onSubmit={e => e.preventDefault()}>
          <h2 className="form-title">MantraMinds</h2>

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter your username"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="btn btn-primary style={{ marginleft: auto }}"
            onClick={handleLogin}
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>

          {message && <div className="error-message">{message}</div>}
        </form>
      </div>
    </div>
  );
};

export default Login;
