import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const CreateRestaurant = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    owner_name: '',
    owner_email: '',
    owner_phone: '',
    username: '',
    password: '',
    plan: 1 // Default plan ID
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'super_admin') {
      navigate('/login');
    }

    const username = localStorage.getItem('username');
    if (username) {
      setFormData(prevData => ({
        ...prevData,
        owner_email: username,
        owner_name: username.split('@')[0]
      }));
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Log the exact data being sent
    console.log('Sending restaurant creation data:', JSON.stringify(formData, null, 2));
    
    try {
      const response = await api.post('/superadmin/tenants/', formData);
      console.log('Restaurant created successfully:', response.data);
      
      // Store the created restaurant data for potential install process
      localStorage.setItem('created_restaurant', JSON.stringify(response.data));
      
      // Navigate to the installation page
      navigate('/install-restaurant');
    } catch (err) {
      console.error('Restaurant creation failed:', err);
      console.error('Full error response:', err.response);
      console.error('Error data:', err.response?.data);
      
      // Extract detailed error message from backend response
      let errorMessage = 'Failed to create restaurant. Please try again.';
      
      if (err.response?.data) {
        const errorData = err.response.data;
        
        // Handle different error response formats
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (Object.keys(errorData).length > 0) {
          // Handle field-specific errors
          const fieldErrors = [];
          for (const [field, messages] of Object.entries(errorData)) {
            if (Array.isArray(messages)) {
              fieldErrors.push(`${field}: ${messages.join(', ')}`);
            } else {
              fieldErrors.push(`${field}: ${messages}`);
            }
          }
          errorMessage = fieldErrors.join('; ');
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Create New Restaurant</h1>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
                    <label className="block text-gray-700 font-bold mb-2">Owner Username</label>
                    <input 
                      type="text" 
                      name="username" 
                      value={formData.username} 
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      required 
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-2">Owner Password</label>
                    <input 
                      type="password" 
                      name="password" 
                      value={formData.password} 
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      required 
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-2">Restaurant Name</label>
                    <input 
                      type="text" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      required 
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-2">Owner Name</label>
                    <input 
                      type="text" 
                      name="owner_name" 
                      value={formData.owner_name} 
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      required 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 font-bold mb-2">Owner Email</label>
                      <input 
                        type="email" 
                        name="owner_email" 
                        value={formData.owner_email} 
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-bold mb-2">Owner Phone</label>
                      <input 
                        type="text" 
                        name="owner_phone" 
                        value={formData.owner_phone} 
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>
                  </div>

          <div className="flex justify-end space-x-4">
            <button 
              type="button" 
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-200"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Creating...' : 'Create Restaurant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRestaurant;
