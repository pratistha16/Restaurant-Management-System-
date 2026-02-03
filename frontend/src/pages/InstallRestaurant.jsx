import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const InstallRestaurant = () => {
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [installationStatus, setInstallationStatus] = useState('');

  useEffect(() => {
    const createdRestaurant = localStorage.getItem('created_restaurant');
    if (createdRestaurant) {
      setRestaurant(JSON.parse(createdRestaurant));
    } else {
      setError('No restaurant data found. Please create a restaurant first.');
    }
  }, []);

  const handleInstall = async () => {
    if (!restaurant) {
      setError('Cannot install without restaurant data.');
      return;
    }

    setIsLoading(true);
    setError('');
    setInstallationStatus('Starting installation...');

    try {
      await api.post(`/superadmin/tenants/${restaurant.tenant_id}/install/`);
      setInstallationStatus('Installation complete! Redirecting to login...');
      
      // Remove the restaurant data from local storage after installation
      localStorage.removeItem('created_restaurant');

      // Redirect to the new tenant's login page
      setTimeout(() => {
        navigate(`/${restaurant.slug}/login`);
      }, 2000);

    } catch (err) {
      console.error('Installation failed:', err);
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        err?.message ||
        'Installation failed.';
      setError(`Installation failed: ${detail}`);
      setInstallationStatus('');
    } finally {
      setIsLoading(false);
    }
  };

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700">{error || 'Restaurant data is missing.'}</p>
          <button 
            onClick={() => navigate('/create-restaurant')}
            className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create a Restaurant
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Install Restaurant</h1>
        <p className="text-gray-600 mb-6">
          You are about to install the restaurant: <strong>{restaurant.name}</strong>
        </p>

        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h2 className="font-bold text-lg mb-2">Details:</h2>
          <p><strong>Tenant ID:</strong> {restaurant.tenant_id}</p>
          <p><strong>Slug:</strong> {restaurant.slug}</p>
          <p><strong>Owner:</strong> {restaurant.owner_name} ({restaurant.owner_email})</p>
        </div>

        {installationStatus && (
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6">
            <p className="font-bold">Progress:</p>
            <p>{installationStatus}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button 
            onClick={() => navigate('/dashboard')}
            disabled={isLoading}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-200"
          >
            Cancel
          </button>
          <button 
            onClick={handleInstall}
            disabled={isLoading}
            className={`px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Installing...' : 'Install Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallRestaurant;
