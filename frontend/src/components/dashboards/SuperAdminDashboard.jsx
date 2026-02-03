import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import RestaurantList from '../../pages/RestaurantList';

const SuperAdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/superadmin/dashboard/');
        setData(response.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
        // Fallback or error state logic
        setData({
          metrics: {
            total_restaurants: '--',
            active_restaurants: '--',
            suspended_restaurants: '--',
            total_users: '--'
          }
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen text-xl text-gray-600">Loading...</div>;
  if (!data) return <div className="flex items-center justify-center min-h-screen text-xl text-red-600">Error loading data</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-10">
            <div>
                <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">Super Admin Dashboard</h1>
                <p className="text-gray-500 mt-2">System overview and management</p>
            </div>
            <div className="space-x-4 flex items-center">
                <button 
                    onClick={() => navigate('/create-restaurant')} 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition duration-200"
                >
                    + Create Restaurant
                </button>
                <button 
                    onClick={handleLogout} 
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow transition duration-200"
                >
                    Logout
                </button>
            </div>
        </header>

        {/* System Metrics */}
        <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-700 mb-6 flex items-center">
                <span className="mr-2">📊</span> System Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <MetricCard 
                    title="Total Restaurants" 
                    value={data.total_tenants || data.metrics?.total_restaurants || 0} 
                    color="blue"
                />
                <MetricCard 
                    title="Active Restaurants" 
                    value={data.active_tenants || data.metrics?.active_restaurants || 0} 
                    color="green"
                />
                <MetricCard 
                    title="Suspended Restaurants" 
                    value={data.suspended_tenants || data.metrics?.suspended_restaurants || 0} 
                    color="red"
                />
                <MetricCard 
                    title="Total Users" 
                    value={data.metrics?.total_users || 0} 
                    color="purple"
                />
            </div>
        </section>

        {/* Restaurant List & Management */}
        <section className="mb-12">
            <RestaurantList />
        </section>

        {/* Recent Logs / Activity */}
        <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-700 mb-6 flex items-center">
                <span className="mr-2">📜</span> Recent System Activity
            </h2>
            {data.recent_logs && data.recent_logs.length > 0 ? (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <ul className="divide-y divide-gray-200">
                        {data.recent_logs.map((log) => (
                            <li key={log.id} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{log.action}</p>
                                    <p className="text-xs text-gray-500">{JSON.stringify(log.details)}</p>
                                </div>
                                <span className="text-xs text-gray-400">
                                    {new Date(log.created_at).toLocaleString()}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <p className="text-gray-500">No recent activity logs.</p>
            )}
        </section>

      </div>
    </div>
  );
};

const MetricCard = ({ title, value, subtext, color = "gray" }) => {
    const colors = {
        blue: "border-blue-500 text-blue-600",
        green: "border-green-500 text-green-600",
        red: "border-red-500 text-red-600",
        purple: "border-purple-500 text-purple-600",
        indigo: "border-indigo-500 text-indigo-600",
        teal: "border-teal-500 text-teal-600",
        yellow: "border-yellow-500 text-yellow-600",
        gray: "border-gray-500 text-gray-600"
    };

    return (
        <div className={`bg-white p-6 rounded-xl shadow-md border-t-4 ${colors[color].split(" ")[0]} transition hover:-translate-y-1 hover:shadow-lg`}>
            <h3 className="text-gray-500 font-medium uppercase tracking-wider mb-2">{title}</h3>
            <p className={`text-4xl font-bold ${colors[color].split(" ")[1]}`}>{value}</p>
            {subtext && <p className="text-sm text-gray-400 mt-2">{subtext}</p>}
        </div>
    );
};

export default SuperAdminDashboard;
