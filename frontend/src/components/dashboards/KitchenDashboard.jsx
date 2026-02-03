import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const KitchenDashboard = () => {
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
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    if (slug) {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }
  }, [slug]);

  if (loading) return <div className="flex items-center justify-center min-h-screen text-xl text-gray-600">Loading...</div>;
  if (!data) return <div className="flex items-center justify-center min-h-screen text-xl text-red-600">Error loading dashboard data.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-10">
            <div>
                <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">Kitchen Dashboard</h1>
                <p className="text-gray-500 mt-2">Order preparation and workflow</p>
            </div>
             <div className="space-x-3">
                 <ActionButton onClick={() => navigate(`/${slug}/kitchen`)} label="Full KDS View" color="green" />
            </div>
        </header>

      {/* Performance Metrics */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-700 mb-6 flex items-center">
             <span className="mr-2">⏱️</span> Performance Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <MetricCard title="Avg Prep Time" value={data.performance?.avg_prep_time || '--'} color="blue" />
            <MetricCard title="Items Completed" value={data.performance?.completed_today || 0} color="green" />
            <MetricCard title="Orders Preparing" value={data.queue?.orders_preparing || 0} color="orange" />
        </div>
      </section>

      {/* Live KOT Queue */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-700 mb-6 flex items-center">
             <span className="mr-2">🔥</span> Live KOT Queue (Pending: {data.queue?.pending_items || 0})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Mock KOT Card - in reality, map through pending orders */}
            <div className="bg-white p-6 rounded-xl shadow-md border-l-8 border-yellow-500">
                <div className="flex justify-between mb-4 border-b pb-2">
                    <span className="font-bold text-lg">Table 4</span>
                    <span className="text-gray-500 font-mono">#1023</span>
                </div>
                <ul className="space-y-2 mb-6">
                    <li className="flex justify-between"><span>2x Chicken Burger</span></li>
                    <li className="flex justify-between"><span>1x Coke</span></li>
                </ul>
                <div className="flex justify-between items-center">
                    <span className="text-red-500 font-bold animate-pulse">05:23</span>
                    <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition">Mark Ready</button>
                </div>
            </div>
             <div className="bg-gray-100 p-6 rounded-xl border-dashed border-2 border-gray-300 flex items-center justify-center text-gray-400">
                Waiting for new orders...
            </div>
        </div>
      </section>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, color = "gray" }) => {
    const colors = {
        green: "border-green-500 text-green-600",
        blue: "border-blue-500 text-blue-600",
        orange: "border-orange-500 text-orange-600",
        gray: "border-gray-500 text-gray-600"
    };

    return (
        <div className={`bg-white p-6 rounded-xl shadow-md border-t-4 ${colors[color].split(" ")[0]} transition hover:-translate-y-1 hover:shadow-lg`}>
            <h3 className="text-gray-500 font-medium uppercase tracking-wider mb-2">{title}</h3>
            <p className={`text-4xl font-bold ${colors[color].split(" ")[1]}`}>{value}</p>
        </div>
    );
};

const ActionButton = ({ onClick, label, color }) => {
     const colorClasses = {
        green: "bg-green-600 hover:bg-green-700",
    };
    return (
        <button 
            onClick={onClick} 
            className={`${colorClasses[color]} text-white px-4 py-2 rounded-lg shadow transition duration-200 font-medium`}
        >
            {label}
        </button>
    )
}

export default KitchenDashboard;
