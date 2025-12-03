import React, { useMemo, useState } from 'react';
import { QuotationData, InvoiceData, Expense, Settings } from '../types';
import MetricCard from './MetricCard';
import { DollarSignIcon, FileTextIcon, ExpenseIcon, CheckCircleIcon, ExportIcon } from './icons';
import { exportAnalyticsToCsv } from '../services/exportService';
import { calculateTotals } from '../services/calculationService';

// --- Reusable Chart Components ---

const SimplePieChart: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
    const total = data.reduce((acc, item) => acc + item.value, 0);
    if (total === 0) return <div className="text-center text-gray-400 h-full flex items-center justify-center text-sm italic">No data available</div>;
    let cumulative = 0;
    const gradients = data.map(item => {
        const percentage = (item.value / total) * 100;
        const segment = `${item.color} ${cumulative}% ${cumulative + percentage}%`;
        cumulative += percentage;
        return segment;
    });
    return (
        <div className="flex flex-col items-center justify-center gap-6 py-4">
            <div className="relative w-40 h-40 rounded-full flex-shrink-0 border-4 border-white/50 dark:border-white/5 shadow-lg" style={{ background: `conic-gradient(${gradients.join(', ')})` }}>
                <div className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-gray-900/90 rounded-full m-6 backdrop-blur-sm">
                    <div className="text-center">
                        <span className="block text-xs text-gray-500 uppercase">Total</span>
                        <span className="block font-bold text-lg text-brand-dark dark:text-white">{formatCurrency(total)}</span>
                    </div>
                </div>
            </div>
            <div className="w-full grid grid-cols-2 gap-3">
                {data.map(item => (
                    <div key={item.label} className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 p-2 rounded-lg">
                         <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></span>
                         <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{item.label}</span>
                            <span className="font-bold text-xs text-brand-dark dark:text-white">{formatCurrency(item.value)}</span>
                         </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const GroupedBarChart: React.FC<{ data: { label: string; values: { value: number; color: string; label: string }[] }[] }> = ({ data }) => {
    const maxValue = Math.max(...data.flatMap(d => d.values.map(v => v.value)), 1);
    if (maxValue === 1) return <div className="text-center text-gray-400 h-full flex items-center justify-center text-sm italic">No data available</div>;

    return (
        <div className="w-full h-64 flex items-end gap-4 pt-10 pb-2">
            {data.map(item => (
                <div key={item.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1.5 h-full px-2">
                        {item.values.map(val => (
                            <div key={val.label} className="w-full rounded-t-lg relative hover:opacity-90 transition-all shadow-sm"
                                 style={{ height: `${Math.max((val.value / maxValue) * 100, 2)}%`, backgroundColor: val.color }}>
                                 <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-brand-dark text-white text-[10px] px-2 py-1.5 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none border border-white/10">
                                     <span className="font-bold">{val.label}</span>: {formatCurrency(val.value)}
                                     <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-brand-dark rotate-45"></div>
                                 </div>
                            </div>
                        ))}
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
                </div>
            ))}
        </div>
    );
};


// --- Helper Functions ---

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);
};


// --- Main Dashboard Component ---

interface DashboardProps {
    quotations: QuotationData[];
    invoices: InvoiceData[];
    expenses: Expense[];
    settings: Settings;
}

const Dashboard: React.FC<DashboardProps> = ({ quotations, invoices, expenses, settings }) => {
    const [dateRange, setDateRange] = useState('all');

    const { filteredQuotations, filteredInvoices, filteredExpenses } = useMemo(() => {
        if (dateRange === 'all') return { filteredQuotations: quotations, filteredInvoices: invoices, filteredExpenses: expenses };
        const now = new Date();
        const rangeStart = new Date();
        if (dateRange === 'this_month') {
          rangeStart.setDate(1);
          rangeStart.setHours(0, 0, 0, 0);
        } else {
          rangeStart.setDate(now.getDate() - parseInt(dateRange, 10));
        }

        const fq = quotations.filter(q => new Date(q.date) >= rangeStart);
        const fi = invoices.filter(i => new Date(i.invoiceDate) >= rangeStart);
        const fe = expenses.filter(e => new Date(e.date) >= rangeStart);
        return { filteredQuotations: fq, filteredInvoices: fi, filteredExpenses: fe };
    }, [quotations, invoices, expenses, dateRange]);

    const metrics = useMemo(() => {
        // ... (Calculation logic remains same as previous)
        const totalQuotations = filteredQuotations.length;
        const totalQuoted = filteredQuotations.reduce((sum: number, q) => sum + calculateTotals(q, settings).grandTotal, 0);
        const acceptedCount = filteredQuotations.filter(q => q.status === 'Accepted' || q.status === 'Invoiced').length;
        const acceptanceRate = totalQuotations > 0 ? (acceptedCount / totalQuotations) * 100 : 0;
        
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const paidInvoices = filteredInvoices.filter(i => i.status === 'Paid');
        const totalRevenue = paidInvoices.reduce((sum: number, i) => sum + calculateTotals(i, settings).grandTotal, 0);
        const paidThisMonth = paidInvoices
            .filter(i => i.paymentDate && new Date(i.paymentDate) >= startOfMonth)
            .reduce((sum: number, i) => sum + calculateTotals(i, settings).grandTotal, 0);
        
        const totalExpenses = filteredExpenses.reduce((sum: number, e) => sum + (Number(e.amount) || 0), 0);
        
        const netProfit = totalRevenue - totalExpenses;
        
        const expenseBreakdown = filteredExpenses.reduce((acc: Record<string, number>, e) => {
            acc[e.category] = (acc[e.category] || 0) + (Number(e.amount) || 0);
            return acc;
        }, {});

        // Monthly performance data for bar chart
        const monthlyData: { [key: string]: { revenue: number, expenses: number } } = {};
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);

        paidInvoices.forEach(i => {
            const date = new Date(i.paymentDate || i.invoiceDate);
            if (date < sixMonthsAgo) return;
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!monthlyData[monthKey]) monthlyData[monthKey] = { revenue: 0, expenses: 0 };
            monthlyData[monthKey].revenue += calculateTotals(i, settings).grandTotal;
        });

        filteredExpenses.forEach(e => {
            const date = new Date(e.date);
            if (date < sixMonthsAgo) return;
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!monthlyData[monthKey]) monthlyData[monthKey] = { revenue: 0, expenses: 0 };
            monthlyData[monthKey].expenses += Number(e.amount) || 0;
        });
        
        const sortedMonthlyKeys = Object.keys(monthlyData).sort();
        const monthlyPerformance = sortedMonthlyKeys.map(key => ({
            label: new Date(key + '-02').toLocaleString('default', { month: 'short' }),
            values: [
                { label: 'Revenue', value: monthlyData[key].revenue, color: '#EAB308' }, // Gold
                { label: 'Expenses', value: monthlyData[key].expenses, color: '#94A3B8' }, // Slate 400
            ]
        }));


        return { totalQuoted, totalQuotations, acceptanceRate, invoicesGenerated: filteredInvoices.length, paidThisMonth, totalExpenses, netProfit, expenseBreakdown, monthlyPerformance };
    }, [filteredQuotations, filteredInvoices, filteredExpenses, settings]);
    
    const expenseColors = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1', '#14B8A6'];
    const expenseChartData = Object.entries(metrics.expenseBreakdown)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .map(([label, value], index) => ({
            label, value, color: expenseColors[index % expenseColors.length]
        }));


    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-gradient-to-r from-gray-50 to-white dark:from-white/5 dark:to-transparent p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div>
                    <h1 className="text-3xl font-bold text-brand-dark dark:text-white tracking-tight">Overview</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Here is what's happening with your business.</p>
                </div>
                <div className="flex items-center gap-3">
                     <select 
                        value={dateRange} 
                        onChange={e => setDateRange(e.target.value)}
                        className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gold/50 shadow-sm hover:border-gold transition-colors cursor-pointer"
                    >
                        <option value="all">All Time</option>
                        <option value="7">Last 7 Days</option>
                        <option value="30">Last 30 Days</option>
                        <option value="this_month">This Month</option>
                        <option value="90">Last 90 Days</option>
                    </select>
                    <button 
                      onClick={() => exportAnalyticsToCsv(metrics)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-brand-dark text-white font-medium rounded-xl shadow-md hover:bg-black transition-all transform hover:scale-105 active:scale-100 text-sm"
                    >
                      <ExportIcon className="w-4 h-4"/>
                      Export Data
                    </button>
                </div>
            </div>
            
            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <MetricCard title="Net Profit" value={formatCurrency(metrics.netProfit)} icon={<DollarSignIcon className="w-6 h-6 text-emerald-500"/>} gradient="from-emerald-500/10 to-emerald-500/5"/>
                <MetricCard title="Paid This Month" value={formatCurrency(metrics.paidThisMonth)} icon={<CheckCircleIcon className="w-6 h-6 text-blue-500"/>} gradient="from-blue-500/10 to-blue-500/5"/>
                <MetricCard title="Total Expenses" value={formatCurrency(metrics.totalExpenses)} icon={<ExpenseIcon className="w-6 h-6 text-rose-500"/>} gradient="from-rose-500/10 to-rose-500/5"/>
                <MetricCard title="Quotations Sent" value={String(metrics.totalQuotations)} icon={<FileTextIcon className="w-6 h-6 text-amber-500"/>} gradient="from-amber-500/10 to-amber-500/5"/>
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-surface-dark p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                             <h3 className="text-lg font-bold text-brand-dark dark:text-white">Financial Performance</h3>
                             <p className="text-xs text-gray-400">Revenue vs Expenses over time</p>
                        </div>
                        <div className="flex gap-4 text-xs font-bold uppercase tracking-wider">
                            <span className="flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-md text-yellow-700 dark:text-yellow-400"><span className="w-2 h-2 rounded-full bg-gold"></span> Revenue</span>
                            <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-600 dark:text-slate-400"><span className="w-2 h-2 rounded-full bg-slate-400"></span> Expenses</span>
                        </div>
                    </div>
                    <GroupedBarChart data={metrics.monthlyPerformance} />
                </div>
                <div className="lg:col-span-1 bg-white dark:bg-surface-dark p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
                     <div>
                        <h3 className="text-lg font-bold text-brand-dark dark:text-white">Expense Breakdown</h3>
                        <p className="text-xs text-gray-400">Where your money is going</p>
                     </div>
                     <div className="flex-grow flex items-center justify-center">
                        <SimplePieChart data={expenseChartData} />
                     </div>
                </div>
            </div>
        </div>
    )
};

export default Dashboard;