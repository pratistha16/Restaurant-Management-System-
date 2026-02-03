import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pos from './pages/Pos';
import CreateRestaurant from './pages/CreateRestaurant';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import StaffManagement from './pages/StaffManagement';
import MenuManagement from './pages/MenuManagement';
import Accounting from './pages/Accounting';
import KitchenDisplay from './pages/KitchenDisplay';
import InstallRestaurant from './pages/InstallRestaurant';
import PlaceholderPage from './pages/PlaceholderPage';
import Layout from './components/Layout';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/:slug/login" element={<Login />} />
        <Route path="/login" element={<Login />} />
        
        {/* Super Admin Dashboard (No Slug) */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Functional Routes - POS is standalone */}
        <Route path="/pos/:slug/*" element={<Pos />} />
        <Route path="/create-restaurant" element={<CreateRestaurant />} />
        <Route path="/install-restaurant" element={<InstallRestaurant />} />
        
        {/* Tenant Routes wrapped in Layout */}
        <Route path="/:slug" element={<Layout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="reports" element={<Reports />} />
            <Route path="staff" element={<StaffManagement />} />
            <Route path="menu" element={<MenuManagement />} />
            <Route path="accounting" element={<Accounting />} />
            <Route path="kitchen" element={<KitchenDisplay />} />
            <Route path="settings" element={<PlaceholderPage title="Settings" />} />
        </Route>

        {/* Fallback */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
