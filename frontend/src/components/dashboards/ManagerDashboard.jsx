import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const ManagerDashboard = () => {
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
                <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">Manager Dashboard</h1>
                <p className="text-gray-500 mt-2">Operational oversight and control</p>
            </div>
            <div className="space-x-3">
                 <ActionButton onClick={() => navigate(`/pos/${slug}`)} label="Open POS" color="green" />
                 <ActionButton onClick={() => navigate(`/${slug}/inventory`)} label="Inventory" color="blue" />
                 <ActionButton onClick={() => navigate(`/${slug}/staff`)} label="Staff" color="gray" />
            </div>
        </header>

      {/* Sales & Orders */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-700 mb-6 flex items-center">
             <span className="mr-2">🧾</span> Sales & Orders
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <MetricCard title="Today's Sales" value={`$${data.sales_orders?.today_sales || 0}`} color="green" />
            <MetricCard title="Orders in Queue" value={data.sales_orders?.orders_in_queue || 0} color="yellow" />
            <MetricCard title="Completed Orders" value={data.sales_orders?.completed_orders || 0} color="blue" />
            <MetricCard title="Cancelled Orders" value={data.sales_orders?.cancelled_orders || 0} color="red" />
        </div>
      </section>

      {/* Inventory & Staff */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
          <div className="bg-white p-6 rounded-xl shadow-md h-full">
            <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">📦 Inventory Monitoring</h2>
             <ul className="space-y-4">
                <li className="flex justify-between items-center text-lg">
                    <span className="text-gray-600">Low Stock Alerts:</span> 
                    <span className="font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full">{data.inventory?.low_stock_alerts || 0}</span>
                </li>
                <li className="flex justify-between items-center text-lg">
                    <span className="text-gray-600">Fast Moving Items:</span> 
                    <span className="font-bold text-gray-800">--</span>
                </li>
                 <li className="flex justify-between items-center text-lg">
                    <span className="text-gray-600">Stock Expiry Alerts:</span> 
                    <span className="font-bold text-yellow-600">--</span>
                </li>
            </ul>
            <div className="mt-6 text-right">
                <button onClick={() => navigate(`/${slug}/inventory`)} className="text-blue-600 hover:underline font-semibold">Manage Inventory &rarr;</button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md h-full">
             <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">👥 Staff Activity</h2>
             <ul className="space-y-4">
                <li className="flex justify-between items-center text-lg">
                    <span className="text-gray-600">Active Staff:</span> 
                    <span className="font-bold text-gray-800">{data.staff?.active_staff || 0}</span>
                </li>
                <li className="flex justify-between items-center text-lg">
                    <span className="text-gray-600">Orders/Waiter:</span> 
                    <span className="font-bold text-gray-800">--</span>
                </li>
                 <li className="flex justify-between items-center text-lg">
                    <span className="text-gray-600">Kitchen Prep Time:</span> 
                    <span className="font-bold text-gray-800">--</span>
                </li>
            </ul>
            <div className="mt-6 text-right">
                <button onClick={() => navigate(`/${slug}/staff`)} className="text-blue-600 hover:underline font-semibold">Manage Staff &rarr;</button>
            </div>
          </div>
      </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, color = "gray" }) => {
    const colors = {
        blue: "border-blue-500 text-blue-600",
        green: "border-green-500 text-green-600",
        red: "border-red-500 text-red-600",
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
        gray: "bg-gray-600 hover:bg-gray-700",
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

export default ManagerDashboard;
