import React from 'react';
import { useNavigate } from 'react-router-dom';

const MenuManagement = () => {
  const navigate = useNavigate();
  // Mock data (unused for now)
  // // const categories = ['Appetizers', 'Main Course', 'Desserts', 'Beverages'];
  const items = [
    { id: 1, name: 'Spring Rolls', category: 'Appetizers', price: 5.99 },
    { id: 2, name: 'Grilled Chicken', category: 'Main Course', price: 12.99 },
    { id: 3, name: 'Chocolate Cake', category: 'Desserts', price: 6.50 },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Menu Management</h1>
          <div className="space-x-4">
             <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Back to Dashboard</button>
             <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">+ Add Item</button>
             <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Manage Categories</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-200">
               {/* Placeholder Image */}
               <div className="h-48 bg-gray-300 flex items-center justify-center text-gray-500">
                 Food Image
               </div>
               <div className="p-4">
                 <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800">{item.name}</h3>
                        <p className="text-sm text-gray-500">{item.category}</p>
                    </div>
                    <span className="text-lg font-bold text-green-600">${item.price}</span>
                 </div>
                 <div className="mt-4 flex justify-end space-x-2">
                    <button className="text-blue-500 hover:text-blue-700">Edit</button>
                    <button className="text-red-500 hover:text-red-700">Delete</button>
                 </div>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MenuManagement;
