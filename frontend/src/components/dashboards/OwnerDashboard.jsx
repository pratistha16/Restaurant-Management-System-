import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { 
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
    DollarSign, ShoppingBag, TrendingUp, Users, AlertTriangle, 
    Clock, Activity, Utensils, AlertCircle 
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const MetricCard = ({ title, value, icon, color, subtext }) => (
    <div className={`bg-white p-6 rounded-xl shadow-sm border-l-4 border-${color}-500 hover:shadow-md transition-shadow`}>
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
                {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
            </div>
            <div className={`p-3 rounded-full bg-${color}-50 text-${color}-600`}>
                {icon && React.createElement(icon, { size: 24 })}
            </div>
        </div>
    </div>
);

const AlertBanner = ({ alerts }) => {
    if (!alerts) return null;
    const hasAlerts = Object.values(alerts).some(val => val > 0);
    if (!hasAlerts) return null;

    return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
            <h3 className="text-red-800 font-bold flex items-center mb-2">
                <AlertTriangle size={20} className="mr-2" /> Attention Needed
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {alerts.low_stock > 0 && (
                    <div className="flex items-center text-red-700 bg-white px-3 py-2 rounded border border-red-100">
                        <span className="font-bold mr-2">{alerts.low_stock}</span> Low Stock Items
                    </div>
                )}
                {alerts.open_sessions > 0 && (
                    <div className="flex items-center text-orange-700 bg-white px-3 py-2 rounded border border-orange-100">
                        <span className="font-bold mr-2">{alerts.open_sessions}</span> Open Sessions
                    </div>
                )}
                {alerts.cancelled_orders > 0 && (
                    <div className="flex items-center text-gray-700 bg-white px-3 py-2 rounded border border-gray-100">
                        <span className="font-bold mr-2">{alerts.cancelled_orders}</span> Cancelled Orders
                    </div>
                )}
                {alerts.accounting_imbalance > 0 && (
                    <div className="flex items-center text-purple-700 bg-white px-3 py-2 rounded border border-purple-100">
                        <span className="font-bold mr-2">{alerts.accounting_imbalance}</span> Accounting Issues
                    </div>
                )}
            </div>
        </div>
    );
};

const OwnerDashboard = () => {
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
        // Fallback or Error state handled by UI
      } finally {
        setLoading(false);
      }
    };
    if (slug) {
        fetchData();
        const interval = setInterval(fetchData, 60000); // Refresh every minute
        return () => clearInterval(interval);
    } else {
        setLoading(false);
    }
  }, [slug]);

  if (loading) return <div className="flex h-screen items-center justify-center text-gray-500">Loading Dashboard...</div>;
  if (!data) return <div className="flex h-screen items-center justify-center text-red-500">Unable to load dashboard data.</div>;

  // Prepare Chart Data
  const revenueData = [
      { name: 'Sales', value: data.charts?.revenue_breakdown?.sales || 0 },
      { name: 'Tax', value: data.charts?.revenue_breakdown?.tax || 0 },
      { name: 'Service', value: data.charts?.revenue_breakdown?.service || 0 },
  ].filter(d => d.value > 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
       <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
                <p className="text-gray-500">Real-time overview of your restaurant</p>
            </div>
            <div className="space-x-3">
                <button onClick={() => navigate(`/pos/${slug}`)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow transition">
                    Open POS
                </button>
                <button onClick={() => navigate(`/${slug}/reports`)} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
                    Reports
                </button>
            </div>
        </header>

        {/* Alerts Section */}
        <AlertBanner alerts={data.alerts} />

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard 
                title="Today's Sales" 
                value={`$${data.kpis?.today_sales?.toFixed(2) || '0.00'}`} 
                icon={DollarSign} 
                color="green" 
                subtext={`${data.kpis?.total_orders_today || 0} orders today`}
            />
            <MetricCard 
                title="Monthly Sales" 
                value={`$${data.kpis?.monthly_sales?.toFixed(2) || '0.00'}`} 
                icon={TrendingUp} 
                color="blue" 
            />
            <MetricCard 
                title="Avg Order Value" 
                value={`$${data.kpis?.avg_order_value?.toFixed(2) || '0.00'}`} 
                icon={ShoppingBag} 
                color="indigo" 
            />
            <MetricCard 
                title="Active Tables" 
                value={data.operational?.active_tables || 0} 
                icon={Users} 
                color="orange" 
                subtext={`${data.operational?.orders_in_progress || 0} active orders`}
            />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center">
                    <Clock size={18} className="mr-2" /> Hourly Sales (Today)
                </h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.charts?.hourly_sales || []}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} />
                            <YAxis />
                            <Tooltip formatter={(value) => [`$${value}`, 'Sales']} />
                            <Bar dataKey="total" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center">
                    <Activity size={18} className="mr-2" /> Sales Trend (30 Days)
                </h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.charts?.daily_sales || []}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" tickFormatter={(d) => d.split('-')[2]} />
                            <YAxis />
                            <Tooltip formatter={(value) => [`$${value}`, 'Sales']} />
                            <Line type="monotone" dataKey="total" stroke="#10B981" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* Charts Row 2 & Operational */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Revenue Split */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-gray-700 mb-4">Revenue Breakdown</h3>
                <div className="h-64 flex justify-center">
                    {revenueData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={revenueData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {revenueData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center text-gray-400">No data available</div>
                    )}
                </div>
            </div>

            {/* Kitchen Status */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center">
                    <Utensils size={18} className="mr-2" /> Kitchen Status
                </h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                        <span className="text-yellow-800 font-medium">Preparing</span>
                        <span className="text-2xl font-bold text-yellow-600">{data.operational?.kitchen_load || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="text-green-800 font-medium">Ready to Serve</span>
                        <span className="text-2xl font-bold text-green-600">
                            {/* Assuming ready count is part of orders_in_progress but not explicitly split in operational dict yet, defaulting to subset or 0 */}
                            0 
                        </span>
                    </div>
                    <div className="mt-4">
                         <div className="text-sm text-gray-500 mb-1">Kitchen Staff On Duty</div>
                         <div className="text-xl font-bold text-gray-800">{data.operational?.staff_on_duty || 0}</div>
                    </div>
                </div>
            </div>

            {/* Inventory Quick View */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center">
                     <AlertCircle size={18} className="mr-2" /> Inventory Health
                </h3>
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Total Value</span>
                            <span className="font-bold">${data.inventory?.total_value?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                    </div>
                    
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Low Stock Alerts</span>
                            <span className="font-bold text-red-600">{data.inventory?.low_stock_items || 0}</span>
                        </div>
                        {data.inventory?.low_stock_items > 0 && (
                            <button onClick={() => navigate(`/${slug}/inventory`)} className="mt-2 text-xs text-blue-600 hover:underline">
                                Review Low Stock &rarr;
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
