import React from 'react';
// Dashboard is rendered inside Layout for tenant routes; Super Admin uses its own page header
import SuperAdminDashboard from '../components/dashboards/SuperAdminDashboard';
import OwnerDashboard from '../components/dashboards/OwnerDashboard';
import ManagerDashboard from '../components/dashboards/ManagerDashboard';
import CashierDashboard from '../components/dashboards/CashierDashboard';
import WaiterDashboard from '../components/dashboards/WaiterDashboard';
import KitchenDashboard from '../components/dashboards/KitchenDashboard';
import AccountantDashboard from '../components/dashboards/AccountantDashboard';
import TableDashboard from '../components/dashboards/TableDashboard';

const Dashboard = () => {
  const role = localStorage.getItem('role');
  const slug = localStorage.getItem('restaurant_slug');

  const renderDashboard = () => {
    switch (role) {
      case 'super_admin':
        return <SuperAdminDashboard />;
      case 'owner':
        return <OwnerDashboard />;
      case 'manager':
        return <ManagerDashboard />;
      case 'waiter':
        return <WaiterDashboard />;
      case 'kitchen':
        return <KitchenDashboard />;
      case 'accountant':
        return <AccountantDashboard />;
      case 'table_user':
        return <TableDashboard />;
      case 'reception':
      case 'cashier':
        return <CashierDashboard />;
      default:
        if (!slug && role !== 'super_admin') {
          return (
            <div className="p-8 text-center">
              <h2 className="text-xl mb-4">Please select a restaurant context</h2>
            </div>
          );
        }
        return <div className="p-4">Unknown Role: {role || 'none'}</div>;
    }
  };

  return renderDashboard();
};

export default Dashboard;
