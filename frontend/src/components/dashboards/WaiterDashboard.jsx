import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const WaiterDashboard = () => {
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
                <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">Waiter Dashboard</h1>
                <p className="text-gray-500 mt-2">Order management and table service</p>
            </div>
            <div className="space-x-3">
                 <ActionButton onClick={() => navigate(`/pos/${slug}`)} label="Take Order" color="green" />
                 <ActionButton onClick={() => navigate(`/pos/${slug}`)} label="Send KOT" color="blue" />
            </div>
        </header>

      {/* Order Summary */}
       <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-700 mb-6 flex items-center">
             <span className="mr-2">📋</span> Order Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <MetricCard title="Pending" value={data.orders?.pending || 0} color="yellow" />
            <MetricCard title="Ready to Serve" value={data.orders?.ready_to_serve || 0} color="green" />
            <MetricCard title="Served Today" value={data.orders?.served_today || 0} color="blue" />
        </div>
      </section>

      {/* Assigned Tables */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-700 mb-6 flex items-center">
            <span className="mr-2">🪑</span> Assigned Tables ({data.tables?.assigned_count || 0})
        </h2>
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="min-w-full leading-normal">
                <thead>
                    <tr>
                        <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Table No</th>
                        <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Order</th>
                        <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Placeholder for table rows */}
                    <tr>
                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm" colSpan="4">
                             <div className="text-center text-gray-500 py-4">No active tables assigned currently.</div>
                        </td>
                    </tr>
                </tbody>
            </table>
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
        yellow: "border-yellow-500 text-yellow-600",
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
        blue: "bg-blue-600 hover:bg-blue-700",
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

export default WaiterDashboard;
