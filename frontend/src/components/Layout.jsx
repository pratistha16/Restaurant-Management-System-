import React, { useState } from 'react';
import { Outlet, NavLink, useParams, useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, ShoppingCart, Utensils, Package, 
    FileText, Users, Settings, ChefHat, DollarSign, Menu as MenuIcon, X
} from 'lucide-react';

const SidebarItem = ({ to, icon, label, onClick }) => (
    <NavLink 
        to={to} 
        onClick={onClick}
        className={({ isActive }) => 
            `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                ? 'bg-blue-50 text-blue-600 font-medium' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`
        }
    >
        {icon && React.createElement(icon, { size: 20 })}
        <span>{label}</span>
    </NavLink>
);

const Layout = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // If no slug in URL, try localStorage or redirect to login
    // In a real app, we'd have a context or higher-level check
    if (!slug) {
        const storedSlug = localStorage.getItem('restaurant_slug');
        if (storedSlug) {
             // Redirecting to dashboard if at root layout without slug
             // But Layout wraps :slug routes, so slug should be there.
        }
    }

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
                    onClick={closeMobileMenu}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="h-full flex flex-col">
                    {/* Logo Area */}
                    <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
                        <span className="text-xl font-bold text-gray-800 tracking-tight">RMS Pro</span>
                        <button onClick={closeMobileMenu} className="lg:hidden text-gray-500">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                        <SidebarItem to={`/${slug}/dashboard`} icon={LayoutDashboard} label="Dashboard" onClick={closeMobileMenu} />
                        <SidebarItem to={`/pos/${slug}`} icon={ShoppingCart} label="POS Point" onClick={closeMobileMenu} />
                        <SidebarItem to={`/${slug}/menu`} icon={Utensils} label="Menu" onClick={closeMobileMenu} />
                        <SidebarItem to={`/${slug}/inventory`} icon={Package} label="Inventory" onClick={closeMobileMenu} />
                        <SidebarItem to={`/${slug}/accounting`} icon={DollarSign} label="Accounting" onClick={closeMobileMenu} />
                        <SidebarItem to={`/${slug}/staff`} icon={Users} label="Staff" onClick={closeMobileMenu} />
                        <SidebarItem to={`/${slug}/kitchen`} icon={ChefHat} label="Kitchen Display" onClick={closeMobileMenu} />
                        <SidebarItem to={`/${slug}/reports`} icon={FileText} label="Reports" onClick={closeMobileMenu} />
                        <div className="pt-4 mt-4 border-t border-gray-100">
                             <SidebarItem to={`/${slug}/settings`} icon={Settings} label="Settings" onClick={closeMobileMenu} />
                        </div>
                    </nav>

                    {/* User Profile / Logout */}
                    <div className="p-4 border-t border-gray-100">
                        <button 
                            onClick={() => {
                                localStorage.removeItem('access_token');
                                navigate('/login');
                            }}
                            className="flex items-center space-x-3 px-4 py-2 w-full text-left text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <span>Log Out</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile Header */}
                <header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center px-4">
                    <button onClick={toggleMobileMenu} className="text-gray-600">
                        <MenuIcon size={24} />
                    </button>
                    <span className="ml-4 font-semibold text-gray-800">Menu</span>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-auto p-4 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
