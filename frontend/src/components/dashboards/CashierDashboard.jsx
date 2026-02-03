import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const CashierDashboard = () => {
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
                <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">Cashier Dashboard</h1>
                <p className="text-gray-500 mt-2">Billing and table management</p>
            </div>
            <div className="space-x-3">
                 <ActionButton onClick={() => navigate(`/pos/${slug}`)} label="Generate Bill" color="green" />
                 <ActionButton onClick={() => navigate(`/pos/${slug}`)} label="Accept Payment" color="blue" />
            </div>
        </header>
      
      {/* Billing Overview */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-700 mb-6 flex items-center">
            <span className="mr-2">💳</span> Billing Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <MetricCard title="Open Bills" value={data.billing?.open_bills || 0} color="orange" />
            <MetricCard title="Pending Payments" value={`$${data.billing?.pending_payments || 0}`} color="red" />
            <MetricCard title="Completed Bills" value={data.billing?.completed_bills_today || 0} color="green" />
            <MetricCard title="Refunds Today" value="--" color="gray" />
        </div>
      </section>

      {/* Table Status */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-700 mb-6 flex items-center">
             <span className="mr-2">🍽️</span> Table Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <MetricCard title="Available" value={data.tables?.available || 0} color="green" />
           <MetricCard title="Occupied" value={data.tables?.occupied || 0} color="red" />
           <MetricCard title="Reserved" value={data.tables?.reserved || 0} color="yellow" />
        </div>
      </section>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, color = "gray" }) => {
    const colors = {
        green: "border-green-500 text-green-600",
        red: "border-red-500 text-red-600",
        orange: "border-orange-500 text-orange-600",
        yellow: "border-yellow-500 text-yellow-600",
        blue: "border-blue-500 text-blue-600",
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

export default CashierDashboard;
