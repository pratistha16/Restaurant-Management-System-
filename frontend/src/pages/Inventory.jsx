import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const Inventory = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch inventory items (mock for now if endpoint not ready, but assuming /inventory/items exists)
    const fetchInventory = async () => {
      try {
        // const response = await api.get(`/tenant/${slug}/inventory/items/`);
        // setItems(response.data);
        // Using mock data for UI demo if backend is empty
        setItems([
          { id: 1, name: 'Tomatoes', quantity: 50, unit: 'kg', threshold: 10 },
          { id: 2, name: 'Onions', quantity: 30, unit: 'kg', threshold: 5 },
          { id: 3, name: 'Chicken', quantity: 100, unit: 'kg', threshold: 20 },
        ]);
      } catch (error) {
        console.error("Failed to fetch inventory", error);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchInventory();
  }, [slug]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Inventory Management</h1>
          <div className="space-x-4">
             <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Back to Dashboard</button>
             <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">+ Add Item</button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Loading inventory...</p>
          </div>
        ) : (

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full leading-normal">
            <thead>
              <tr>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Item Name</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Quantity</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Unit</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{item.name}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{item.quantity}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{item.unit}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <span className={`relative inline-block px-3 py-1 font-semibold leading-tight ${item.quantity < item.threshold ? 'text-red-900' : 'text-green-900'}`}>
                      <span aria-hidden className={`absolute inset-0 ${item.quantity < item.threshold ? 'bg-red-200' : 'bg-green-200'} opacity-50 rounded-full`}></span>
                      <span className="relative">{item.quantity < item.threshold ? 'Low Stock' : 'In Stock'}</span>
                    </span>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <button className="text-blue-600 hover:text-blue-900 mr-4">Edit</button>
                    <button className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
