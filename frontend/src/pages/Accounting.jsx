import React from 'react';
import { useNavigate } from 'react-router-dom';

const Accounting = () => {
  const navigate = useNavigate();
  const slug = localStorage.getItem('restaurant_slug');

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Accounting & Finance</h1>
          <button onClick={() => navigate(slug ? `/${slug}/dashboard` : '/dashboard')} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Back to Dashboard</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
             <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                <h3 className="text-gray-500 uppercase text-sm font-semibold">Total Revenue</h3>
                <p className="text-3xl font-bold text-gray-800">$12,450.00</p>
             </div>
             <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
                <h3 className="text-gray-500 uppercase text-sm font-semibold">Total Expenses</h3>
                <p className="text-3xl font-bold text-gray-800">$8,230.00</p>
             </div>
             <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                <h3 className="text-gray-500 uppercase text-sm font-semibold">Net Profit</h3>
                <p className="text-3xl font-bold text-gray-800">$4,220.00</p>
             </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">Recent Transactions</h2>
            </div>
            <table className="min-w-full text-left">
                <thead>
                    <tr className="bg-gray-50 text-gray-600 text-sm uppercase">
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Description</th>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3">Amount</th>
                        <th className="px-6 py-3">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    <tr>
                        <td className="px-6 py-4">Oct 24, 2025</td>
                        <td className="px-6 py-4">Vegetable Supply</td>
                        <td className="px-6 py-4 text-red-500">Expense</td>
                        <td className="px-6 py-4 font-bold">-$450.00</td>
                        <td className="px-6 py-4"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Paid</span></td>
                    </tr>
                    <tr>
                        <td className="px-6 py-4">Oct 24, 2025</td>
                        <td className="px-6 py-4">Daily Sales</td>
                        <td className="px-6 py-4 text-green-500">Income</td>
                        <td className="px-6 py-4 font-bold">+$1,200.00</td>
                        <td className="px-6 py-4"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Verified</span></td>
                    </tr>
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Accounting;
