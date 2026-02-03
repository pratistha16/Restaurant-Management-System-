import React, { useState, useEffect } from 'react';
import api from '../../api';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const RestaurantList = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [installing, setInstalling] = useState(null); // Track which restaurant is being installed

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const response = await api.get('/superadmin/tenants/');
      setRestaurants(response.data);
      setError('');
    } catch (err) {
      console.error("Failed to fetch restaurants", err);
      setError('Could not load restaurant data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async (tenantId) => {
    setInstalling(tenantId);
    setError('');
    try {
      await api.post(`/superadmin/tenants/${tenantId}/install/`);
      // Refresh the list to show the updated status
      fetchRestaurants();
    } catch (err) {
      console.error(`Failed to install restaurant ${tenantId}`, err);
      setError(`Installation failed for restaurant ${tenantId}.`);
    } finally {
      setInstalling(null);
    }
  };

  const getStatusIcon = (restaurant) => {
    if (restaurant.is_active) {
      return <CheckCircle className="text-green-500" />;
    }
    if (restaurant.subscription_status === 'suspended') {
      return <AlertTriangle className="text-red-500" />;
    }
    return <Clock className="text-yellow-500" />;
  };

  if (loading) {
    return <div className="text-center p-4">Loading restaurants...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-gray-700 mb-6">All Restaurants</h2>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase tracking-wider">Name</th>
              <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase tracking-wider">Owner</th>
              <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase tracking-wider">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {restaurants.map((res) => (
              <tr key={res.tenant_id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-4">{res.name}</td>
                <td className="py-3 px-4">{res.owner_email}</td>
                <td className="py-3 px-4 flex items-center">
                  {getStatusIcon(res)}
                  <span className="ml-2 capitalize">{res.is_active ? 'Active' : 'Pending'}</span>
                </td>
                <td className="py-3 px-4">
                  {!res.is_active && (
                    <button
                      onClick={() => handleInstall(res.tenant_id)}
                      disabled={installing === res.tenant_id}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                    >
                      {installing === res.tenant_id ? 'Installing...' : 'Install'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RestaurantList;
