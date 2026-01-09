import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Transaction, SalesSummary } from '../types';
import { calculateSummary, getInventorySummary } from '../services/storageService';
import { TrendingUp, AlertCircle, DollarSign, Package, ShoppingBag, Filter, X } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (filterStart && t.date < filterStart) return false;
      if (filterEnd && t.date > filterEnd) return false;
      return true;
    });
  }, [transactions, filterStart, filterEnd]);

  const summary: SalesSummary = useMemo(() => calculateSummary(filteredTransactions), [filteredTransactions]);
  const inventoryData = useMemo(() => getInventorySummary(filteredTransactions), [filteredTransactions]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Business Dashboard</h2>
        
        {/* Date Filters */}
        <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-gray-600 px-2">
            <Filter size={16} />
            <span className="text-sm font-medium">Filter:</span>
          </div>
          <div className="flex gap-2 items-center flex-1 md:flex-initial">
             <input 
               type="date" 
               value={filterStart}
               onChange={(e) => setFilterStart(e.target.value)}
               className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-auto"
             />
             <span className="text-gray-400">-</span>
             <input 
               type="date" 
               value={filterEnd}
               onChange={(e) => setFilterEnd(e.target.value)}
               className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-auto"
             />
          </div>
          {(filterStart || filterEnd) && (
            <button 
              onClick={() => { setFilterStart(''); setFilterEnd(''); }}
              className="text-red-500 hover:bg-red-50 p-1 rounded transition"
              title="Clear Filter"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards - Updated for single column on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center gap-3 md:space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs md:text-sm text-gray-500">Revenue</p>
            <p className="text-lg md:text-xl font-bold text-gray-800">৳{summary.totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center gap-3 md:space-x-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-full">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs md:text-sm text-gray-500">Net Munafa</p>
            <p className="text-lg md:text-xl font-bold text-gray-800">৳{summary.netProfit.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center gap-3 md:space-x-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-xs md:text-sm text-gray-500">Units Sold</p>
            <p className="text-lg md:text-xl font-bold text-gray-800">{summary.totalSoldUnits} pcs</p>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center gap-3 md:space-x-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-full">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-xs md:text-sm text-gray-500">Replace Cost</p>
            <p className="text-lg md:text-xl font-bold text-gray-800">৳{summary.replacementCost.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center gap-3 md:space-x-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
            <Package size={24} />
          </div>
          <div>
            <p className="text-xs md:text-sm text-gray-500">Replaced</p>
            <p className="text-lg md:text-xl font-bold text-gray-800">{summary.totalReplacements} pcs</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Inventory Performance */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 h-64 md:h-80">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Sales vs Replacements</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={inventoryData}
              margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend wrapperStyle={{fontSize: '12px'}} />
              <Bar dataKey="sold" name="Sold" fill="#4F46E5" />
              <Bar dataKey="replaced" name="Replaced" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Profit Distribution */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 h-64 md:h-80">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Financial Breakdown</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: 'Net Profit', value: summary.netProfit > 0 ? summary.netProfit : 0 },
                  { name: 'Replacement Cost', value: summary.replacementCost },
                  { name: 'Cost of Goods', value: summary.totalRevenue - summary.totalProfit }
                ]}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {inventoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `৳${value.toLocaleString()}`} />
              <Legend wrapperStyle={{fontSize: '12px'}} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};