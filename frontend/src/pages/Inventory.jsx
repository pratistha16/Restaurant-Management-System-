import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { Plus, Edit, Trash2, ArrowUp, ArrowDown, AlertTriangle, Package } from 'lucide-react';

const Inventory = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [showItemModal, setShowItemModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedItemForStock, setSelectedItemForStock] = useState(null);

  // Form States
  const [itemForm, setItemForm] = useState({ name: '', unit: 'kg', min_stock: 0, cost_per_unit: 0, current_stock: 0 });
  const [stockForm, setStockForm] = useState({ movement_type: 'in', quantity: 0, reason: 'purchase', note: '' });

  useEffect(() => {
    fetchInventory();
  }, [slug]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/tenant/${slug}/inventory/ingredients/`);
      setIngredients(response.data);
    } catch (error) {
      console.error("Failed to fetch inventory", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        // Update (exclude current_stock from direct update to avoid conflicts, though backend allows it)
        const { current_stock, ...updateData } = itemForm;
        await api.patch(`/tenant/${slug}/inventory/ingredients/${editingItem.id}/`, updateData);
      } else {
        // Create
        await api.post(`/tenant/${slug}/inventory/ingredients/`, itemForm);
      }
      setShowItemModal(false);
      fetchInventory();
    } catch (error) {
      console.error("Failed to save item", error);
      alert("Failed to save item.");
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this ingredient?")) return;
    try {
      await api.delete(`/tenant/${slug}/inventory/ingredients/${id}/`);
      fetchInventory();
    } catch (error) {
      console.error("Failed to delete item", error);
      alert("Failed to delete item. It might be used in recipes.");
    }
  };

  const handleStockAdjustment = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ingredient: selectedItemForStock.id,
        ...stockForm
      };
      await api.post(`/tenant/${slug}/inventory/stock_movements/`, payload);
      setShowStockModal(false);
      fetchInventory(); // Refresh to see new stock levels
      alert("Stock updated successfully");
    } catch (error) {
      console.error("Failed to adjust stock", error);
      alert(error.response?.data?.quantity || "Failed to adjust stock.");
    }
  };

  const openItemModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setItemForm({
        name: item.name,
        unit: item.unit,
        min_stock: item.min_stock,
        cost_per_unit: item.cost_per_unit,
        current_stock: item.current_stock // Read-only in edit usually, but let's keep it in state
      });
    } else {
      setEditingItem(null);
      setItemForm({ name: '', unit: 'kg', min_stock: 0, cost_per_unit: 0, current_stock: 0 });
    }
    setShowItemModal(true);
  };

  const openStockModal = (item) => {
    setSelectedItemForStock(item);
    setStockForm({ movement_type: 'in', quantity: 0, reason: 'purchase', note: '' });
    setShowStockModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="text-blue-600" /> Inventory Management
            </h1>
            <p className="text-gray-500 mt-1">Track ingredients, stock levels, and costs.</p>
          </div>
          <div className="space-x-3">
             <button onClick={() => navigate(`/${slug}/dashboard`)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                 Back to Dashboard
             </button>
             <button onClick={() => openItemModal()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-sm">
                 <Plus size={18} /> Add Ingredient
             </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading inventory...</p>
          </div>
        ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingredient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ingredients.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-500">Min: {item.min_stock} {item.unit}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-semibold">{parseFloat(item.current_stock).toFixed(2)} {item.unit}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${parseFloat(item.cost_per_unit).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {parseFloat(item.current_stock) <= parseFloat(item.min_stock) ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 gap-1 items-center">
                              <AlertTriangle size={12} /> Low Stock
                          </span>
                      ) : (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              In Stock
                          </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button onClick={() => openStockModal(item)} className="text-indigo-600 hover:text-indigo-900" title="Adjust Stock">
                          <ArrowUp size={18} className="inline" />
                      </button>
                      <button onClick={() => openItemModal(item)} className="text-blue-600 hover:text-blue-900" title="Edit">
                          <Edit size={18} className="inline" />
                      </button>
                      <button onClick={() => handleDeleteItem(item.id)} className="text-red-600 hover:text-red-900" title="Delete">
                          <Trash2 size={18} className="inline" />
                      </button>
                    </td>
                  </tr>
                ))}
                {ingredients.length === 0 && (
                    <tr>
                        <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                            No ingredients found. Add some to get started.
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Item Modal */}
        {showItemModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">{editingItem ? 'Edit Ingredient' : 'Add New Ingredient'}</h2>
              <form onSubmit={handleSaveItem}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input type="text" required value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Unit</label>
                        <select value={itemForm.unit} onChange={e => setItemForm({...itemForm, unit: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2">
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="l">l</option>
                            <option value="ml">ml</option>
                            <option value="pcs">pcs</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Cost per Unit ($)</label>
                        <input type="number" step="0.01" min="0" required value={itemForm.cost_per_unit} onChange={e => setItemForm({...itemForm, cost_per_unit: parseFloat(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Min Stock (Alert)</label>
                        <input type="number" step="0.01" min="0" required value={itemForm.min_stock} onChange={e => setItemForm({...itemForm, min_stock: parseFloat(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2" />
                    </div>
                    {!editingItem && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Initial Stock</label>
                            <input type="number" step="0.01" min="0" required value={itemForm.current_stock} onChange={e => setItemForm({...itemForm, current_stock: parseFloat(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2" />
                        </div>
                    )}
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button type="button" onClick={() => setShowItemModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Stock Modal */}
        {showStockModal && selectedItemForStock && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Adjust Stock: {selectedItemForStock.name}</h2>
              <form onSubmit={handleStockAdjustment}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Action</label>
                    <div className="flex space-x-4 mt-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" checked={stockForm.movement_type === 'in'} onChange={() => setStockForm({...stockForm, movement_type: 'in'})} className="text-green-600 focus:ring-green-500" />
                            <span className="text-green-700 font-medium">Add Stock (In)</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" checked={stockForm.movement_type === 'out'} onChange={() => setStockForm({...stockForm, movement_type: 'out'})} className="text-red-600 focus:ring-red-500" />
                            <span className="text-red-700 font-medium">Remove Stock (Out)</span>
                        </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Quantity ({selectedItemForStock.unit})</label>
                    <input type="number" step="0.01" min="0.01" required value={stockForm.quantity} onChange={e => setStockForm({...stockForm, quantity: parseFloat(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reason</label>
                    <select value={stockForm.reason} onChange={e => setStockForm({...stockForm, reason: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2">
                        <option value="purchase">Purchase</option>
                        <option value="sale">Sale</option>
                        <option value="waste">Waste</option>
                        <option value="adjustment">Adjustment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Note (Optional)</label>
                    <input type="text" value={stockForm.note} onChange={e => setStockForm({...stockForm, note: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2" placeholder="e.g. Weekly restock" />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button type="button" onClick={() => setShowStockModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Confirm Adjustment</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
