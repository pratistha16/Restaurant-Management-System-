import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const TableDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const slug = localStorage.getItem('restaurant_slug');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get(`/tenant/${slug}/dashboard/`);
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchData();
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [slug]);

  if (loading) return <div className="flex items-center justify-center min-h-screen text-xl text-gray-600">Loading...</div>;
  if (!data) return <div className="flex items-center justify-center min-h-screen text-xl text-red-600">Error loading dashboard data.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">
      <div className="max-w-2xl w-full">
         <header className="mb-10 text-center">
            <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight mb-2">Welcome to Our Restaurant</h1>
            <p className="text-gray-500 text-lg">We are delighted to serve you.</p>
        </header>

      {/* Table Info */}
      <div className="bg-white p-8 rounded-2xl shadow-xl mb-8 flex flex-col md:flex-row justify-between items-center border-t-8 border-orange-500">
        <div className="mb-4 md:mb-0 text-center md:text-left">
            <h2 className="text-3xl font-bold text-gray-800">Table #{data.session?.table || '--'}</h2>
            <p className="text-gray-500 mt-1">Status: <span className="font-semibold text-green-600 uppercase">{data.session?.status || 'Active'}</span></p>
        </div>
        <div>
             <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold shadow-lg transition transform hover:scale-105">
                🔔 Call Waiter
             </button>
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-white p-8 rounded-2xl shadow-lg mb-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Your Order</h2>
        <div className="min-h-32 flex flex-col justify-center items-center text-gray-500">
            {data.order_summary?.item_count > 0 ? (
                <div className="w-full">
                     <div className="flex justify-between items-center mb-4">
                        <span className="text-lg">Items ordered</span>
                        <span className="font-bold text-xl text-gray-800">{data.order_summary?.item_count}</span>
                     </div>
                     <div className="flex justify-between items-center pt-4 border-t">
                        <span className="text-xl font-bold">Total</span>
                        <span className="font-bold text-2xl text-green-600">$ --</span>
                     </div>
                </div>
            ) : (
                <>
                    <p className="text-lg">No active orders yet.</p>
                    <p className="text-sm mt-2">Explore our menu to get started!</p>
                </>
            )}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <button onClick={() => navigate(`/${slug}/menu`)} className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-6 rounded-2xl shadow-lg text-xl font-bold transition transform hover:scale-105 flex items-center justify-center">
            📖 Browse Menu
        </button>
        <button onClick={() => navigate(`/${slug}/menu`)} className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white p-6 rounded-2xl shadow-lg text-xl font-bold transition transform hover:scale-105 flex items-center justify-center">
            🧾 Request Bill
        </button>
      </div>
      </div>
    </div>
  );
};

export default TableDashboard;
