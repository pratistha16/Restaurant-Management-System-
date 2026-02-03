import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Reports = () => {
  const navigate = useNavigate();
  const slug = localStorage.getItem('restaurant_slug');

  const data = [
    { name: 'Mon', sales: 4000, orders: 240 },
    { name: 'Tue', sales: 3000, orders: 139 },
    { name: 'Wed', sales: 2000, orders: 980 },
    { name: 'Thu', sales: 2780, orders: 390 },
    { name: 'Fri', sales: 1890, orders: 480 },
    { name: 'Sat', sales: 2390, orders: 380 },
    { name: 'Sun', sales: 3490, orders: 430 },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Reports & Analytics</h1>
          <button onClick={() => navigate(slug ? `/${slug}/dashboard` : '/dashboard')} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Back to Dashboard</button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Weekly Sales Overview</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#8884d8" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="orders" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-bold mb-4">Top Selling Items</h3>
                <ul>
                    <li className="flex justify-between border-b py-2"><span>Burger</span> <span className="font-bold">120 sold</span></li>
                    <li className="flex justify-between border-b py-2"><span>Pizza</span> <span className="font-bold">95 sold</span></li>
                    <li className="flex justify-between border-b py-2"><span>Pasta</span> <span className="font-bold">88 sold</span></li>
                </ul>
            </div>
             <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-bold mb-4">Staff Performance</h3>
                <ul>
                    <li className="flex justify-between border-b py-2"><span>John Doe</span> <span className="font-bold">$1200 sales</span></li>
                    <li className="flex justify-between border-b py-2"><span>Jane Smith</span> <span className="font-bold">$950 sales</span></li>
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
