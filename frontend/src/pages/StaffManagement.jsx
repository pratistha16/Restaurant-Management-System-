import React from 'react';
import { useNavigate } from 'react-router-dom';

const StaffManagement = () => {
  const navigate = useNavigate();
  // const slug = useParams().slug; // reserved for future tenant-scoped calls
  const slug = localStorage.getItem('restaurant_slug');

  // Mock data
  const staff = [
    { id: 1, name: 'John Doe', role: 'Manager', status: 'Active' },
    { id: 2, name: 'Jane Smith', role: 'Chef', status: 'Active' },
    { id: 3, name: 'Mike Johnson', role: 'Waiter', status: 'On Leave' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Staff Management</h1>
          <div className="space-x-4">
            <button onClick={() => navigate(slug ? `/${slug}/dashboard` : '/dashboard')} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Back to Dashboard</button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">+ Add Staff</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.map((member) => (
            <div key={member.id} className="bg-white rounded-lg shadow p-6 flex items-center space-x-4">
              <div className="h-12 w-12 bg-gray-300 rounded-full flex items-center justify-center text-xl font-bold text-gray-600">
                {member.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{member.name}</h3>
                <p className="text-sm text-gray-500">{member.role}</p>
                <span className={`text-xs px-2 py-1 rounded-full ${member.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {member.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StaffManagement;
