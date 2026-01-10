import React, { useState } from 'react';
import { Transaction } from '../types';
import { saveTransaction, deleteTransaction } from '../services/storageService';
import { Plus, Trash2, Filter, X } from 'lucide-react';

interface TransactionsProps {
  transactions: Transaction[];
  onUpdate: () => void;
}

export const Transactions: React.FC<TransactionsProps> = ({ transactions, onUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: 'SALE',
    date: new Date().toISOString().split('T')[0],
    bulbType: '9W',
    quantity: 1,
    costPrice: 80,
    sellPrice: 120,
    shopName: '',
    notes: ''
  });

  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.shopName || !formData.quantity) return;

    setIsSubmitting(true);
    try {
      const newTransaction: Transaction = {
        id: crypto.randomUUID(), // Note: Firestore will generate its own ID, this is for local or optimism
        date: formData.date!,
        shopName: formData.shopName!,
        bulbType: formData.bulbType!,
        quantity: Number(formData.quantity),
        costPrice: Number(formData.costPrice),
        sellPrice: Number(formData.sellPrice),
        type: formData.type as 'SALE' | 'REPLACEMENT',
        notes: formData.notes || '' // Ensure no undefined values
      };

      await saveTransaction(newTransaction);
      onUpdate(); // Trigger refresh in parent
      setShowForm(false);
      setFormData({
        type: 'SALE',
        date: new Date().toISOString().split('T')[0],
        bulbType: '9W',
        quantity: 1,
        costPrice: 80,
        sellPrice: 120,
        shopName: '',
        notes: ''
      });
    } catch (error: any) {
      console.error("Failed to save", error);
      alert(`Failed to save transaction: ${error.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      try {
        await deleteTransaction(id);
        onUpdate();
      } catch (error) {
        console.error("Failed to delete", error);
        alert("Failed to delete transaction.");
      }
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (filterStart && t.date < filterStart) return false;
    if (filterEnd && t.date > filterEnd) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Transactions</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition"
        >
          <Plus size={18} /> Add New
        </button>
      </div>

      {/* Date Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row items-end sm:items-center gap-4 animate-fade-in">
        <div className="flex items-center gap-2 text-gray-700 font-medium min-w-fit">
            <Filter size={18} className="text-indigo-600" />
            <span>Filter Date:</span>
        </div>
        <div className="flex gap-3 w-full sm:w-auto items-center">
            <div className="flex-1 sm:w-auto">
                <input 
                    type="date" 
                    value={filterStart}
                    onChange={(e) => setFilterStart(e.target.value)}
                    className="w-full sm:w-40 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="Start Date"
                />
            </div>
            <span className="text-gray-400 self-center">-</span>
            <div className="flex-1 sm:w-auto">
                <input 
                    type="date" 
                    value={filterEnd}
                    onChange={(e) => setFilterEnd(e.target.value)}
                    className="w-full sm:w-40 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="End Date"
                />
            </div>
        </div>
        {(filterStart || filterEnd) && (
            <button 
                onClick={() => { setFilterStart(''); setFilterEnd(''); }}
                className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition ml-auto sm:ml-0"
            >
                <X size={16} /> Clear
            </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 animate-slide-in">
          <h3 className="text-lg font-semibold mb-4">New Entry</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value as any})}
              >
                <option value="SALE">Sale (Sell)</option>
                <option value="REPLACEMENT">Replacement (Return)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input 
                type="date" 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Shop Name</label>
              <input 
                type="text" 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                placeholder="e.g. Rahim Store"
                value={formData.shopName}
                onChange={e => setFormData({...formData, shopName: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Bulb Type</label>
              <select 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                value={formData.bulbType}
                onChange={e => setFormData({...formData, bulbType: e.target.value})}
              >
                <option value="5W">5W LED</option>
                <option value="9W">9W LED</option>
                <option value="12W">12W LED</option>
                <option value="15W">15W LED</option>
                <option value="18W">18W LED</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity</label>
              <input 
                type="number" 
                min="1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Cost Price (Buy)</label>
              <input 
                type="number" 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                value={formData.costPrice}
                onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Sell Price</label>
              <input 
                type="number" 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                value={formData.sellPrice}
                onChange={e => setFormData({...formData, sellPrice: Number(e.target.value)})}
                required
              />
            </div>

            <div className="md:col-span-2">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isSubmitting ? 'Saving...' : 'Save Transaction'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit/Loss</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No transactions found within this date range.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => {
                  const isSale = t.type === 'SALE';
                  const profit = isSale 
                    ? (t.sellPrice - t.costPrice) * t.quantity 
                    : -(t.costPrice * t.quantity);
                  
                  return (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.shopName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isSale ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {isSale ? 'Sale' : 'Replace'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.bulbType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.quantity}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {profit >= 0 ? '+' : ''}৳{profit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:text-red-900">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};