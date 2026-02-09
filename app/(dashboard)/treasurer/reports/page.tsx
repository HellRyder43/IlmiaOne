'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import {
  Download, Filter, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, Wallet,
  CheckCircle2, CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock Data
const cashFlowData = [
  { name: 'Jan', income: 45000, expense: 32000 },
  { name: 'Feb', income: 42000, expense: 28000 },
  { name: 'Mar', income: 48000, expense: 45000 },
  { name: 'Apr', income: 46000, expense: 30000 },
  { name: 'May', income: 50000, expense: 35000 },
  { name: 'Jun', income: 47000, expense: 31000 },
];

const incomeComposition = [
  { name: 'Maintenance Fees', value: 85, color: '#10b981' },
  { name: 'Sinking Fund', value: 10, color: '#3b82f6' },
  { name: 'Facility Booking', value: 3, color: '#f59e0b' },
  { name: 'Late Interest', value: 2, color: '#ef4444' },
];

const expenseComposition = [
  { name: 'Security Services', value: 35, color: '#6366f1' },
  { name: 'Cleaning & Landscape', value: 25, color: '#ec4899' },
  { name: 'Street Lights & Guardhouse', value: 20, color: '#eab308' },
  { name: 'Playground/Park Maint.', value: 15, color: '#3b82f6' },
  { name: 'Admin/Office', value: 5, color: '#94a3b8' },
];

const budgetData = [
  { category: 'Security', budget: 15000, actual: 14500 },
  { category: 'Landscape', budget: 10000, actual: 9800 },
  { category: 'Utilities', budget: 8000, actual: 8500 },
  { category: 'Repairs', budget: 5000, actual: 2000 },
  { category: 'Admin', budget: 2000, actual: 1800 },
];

const recentCollections = [
  { id: 'RCP-001', unit: 'No. 12', amount: 143.00, date: 'Today, 10:42 AM', method: 'FPX', status: 'CLEARED' },
  { id: 'RCP-002', unit: 'No. 5', amount: 286.00, date: 'Today, 09:15 AM', method: 'Card', status: 'CLEARED' },
  { id: 'RCP-003', unit: 'No. 88', amount: 143.00, date: 'Yesterday', method: 'FPX', status: 'CLEARED' },
  { id: 'RCP-004', unit: 'No. 2', amount: 143.00, date: 'Yesterday', method: 'Cash', status: 'PENDING' },
];

const recentExpenses = [
  { id: 'EXP-8821', vendor: 'SecureGuard Sdn Bhd', category: 'Security', amount: 14500.00, date: 'Dec 01', status: 'PAID' },
  { id: 'EXP-8822', vendor: 'TNB', category: 'Utilities', amount: 4230.50, date: 'Dec 03', status: 'PENDING' },
  { id: 'EXP-8823', vendor: 'GreenScapes Landscape', category: 'Landscape', amount: 2100.00, date: 'Dec 05', status: 'APPROVED' },
  { id: 'EXP-8824', vendor: 'Hardware Shop', category: 'Repairs', amount: 85.00, date: 'Dec 06', status: 'PAID' },
];

// Stat Card Component
const StatCard = ({ title, value, subtext, icon: Icon, trend, trendValue, colorClass }: any) => (
  <Card className="border-slate-200 shadow-sm">
    <CardContent className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-2">{value}</h3>
          {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
        <div className={cn("p-2.5 rounded-lg", colorClass)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {(trend || trendValue) && (
        <div className="mt-4 flex items-center text-xs font-medium">
          {trend === 'up' ? (
            <span className="text-emerald-600 flex items-center bg-emerald-50 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3 mr-1" /> {trendValue}
            </span>
          ) : (
            <span className="text-red-600 flex items-center bg-red-50 px-2 py-0.5 rounded-full">
              <TrendingDown className="w-3 h-3 mr-1" /> {trendValue}
            </span>
          )}
          <span className="text-slate-400 ml-2">vs last month</span>
        </div>
      )}
    </CardContent>
  </Card>
);

export default function FinancialReports() {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'INCOME' | 'EXPENSE'>('OVERVIEW');

  return (
    <div className="space-y-8 pb-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Financial Reports</h2>
          <p className="text-slate-500 mt-1">
            {activeTab === 'OVERVIEW' && "Detailed breakdown of community finances."}
            {activeTab === 'INCOME' && "Tracking collections, arrears, and revenue sources."}
            {activeTab === 'EXPENSE' && "Monitoring operational costs and vendor payments."}
          </p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="gap-2 bg-white">
             <Filter className="w-4 h-4" /> Filter
           </Button>
           <Button variant="outline" className="gap-2 bg-white">
             <Download className="w-4 h-4" /> Export Report
           </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200">
         <nav className="-mb-px flex space-x-8">
           {['OVERVIEW', 'INCOME', 'EXPENSE'].map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab as any)}
               className={cn(
                 "whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors",
                 activeTab === tab
                   ? "border-primary-500 text-primary-600"
                   : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
               )}
             >
               {tab.charAt(0) + tab.slice(1).toLowerCase()}
             </button>
           ))}
         </nav>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid md:grid-cols-3 gap-6">
             <StatCard
               title="Net Cash Flow"
               value="RM 12,500"
               subtext="Income - Expenses"
               icon={Wallet}
               trend="up"
               trendValue="+8.2%"
               colorClass="bg-indigo-50 text-indigo-600"
             />
             <StatCard
               title="Total Income"
               value="RM 47,000"
               subtext="December 2023"
               icon={ArrowUpRight}
               trend="up"
               trendValue="+2.1%"
               colorClass="bg-emerald-50 text-emerald-600"
             />
             <StatCard
               title="Total Expenses"
               value="RM 34,500"
               subtext="December 2023"
               icon={ArrowDownRight}
               trend="down"
               trendValue="-1.5%"
               colorClass="bg-red-50 text-red-600"
             />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-slate-200 shadow-sm">
               <CardHeader>
                 <CardTitle>Cash Flow Trends</CardTitle>
               </CardHeader>
               <CardContent className="h-[350px]">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={cashFlowData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                     <Tooltip
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        cursor={{fill: '#f8fafc'}}
                     />
                     <Legend iconType="circle" />
                     <Bar dataKey="income" name="Income" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                     <Bar dataKey="expense" name="Expenses" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                   </BarChart>
                 </ResponsiveContainer>
               </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
               <CardHeader>
                 <CardTitle>Budget Health</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                       <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-emerald-900">Healthy</span>
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                       </div>
                       <p className="text-sm text-emerald-700">Spending is within 95% of the allocated budget for this quarter.</p>
                    </div>

                    <div className="space-y-4">
                       <div>
                          <div className="flex justify-between text-sm mb-1">
                             <span className="text-slate-600">Maintenance Fund</span>
                             <span className="font-medium text-slate-900">75% Used</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                             <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                          </div>
                       </div>
                       <div>
                          <div className="flex justify-between text-sm mb-1">
                             <span className="text-slate-600">Sinking Fund</span>
                             <span className="font-medium text-slate-900">10% Used</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                             <div className="bg-purple-600 h-2 rounded-full" style={{ width: '10%' }}></div>
                          </div>
                       </div>
                       <div>
                          <div className="flex justify-between text-sm mb-1">
                             <span className="text-slate-600">Petty Cash</span>
                             <span className="font-medium text-slate-900">45% Used</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                             <div className="bg-orange-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                          </div>
                       </div>
                    </div>
                 </div>
               </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* INCOME TAB */}
      {activeTab === 'INCOME' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Key Stats Row */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="border-slate-200 shadow-sm bg-emerald-50/50">
              <CardContent className="p-4">
                 <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Total Collected</p>
                 <p className="text-2xl font-bold text-slate-900 mt-1">RM 42,890</p>
                 <p className="text-xs text-slate-500 mt-1">Dec 1 - Dec 28</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4">
                 <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Collection Rate</p>
                 <div className="flex items-end gap-2 mt-1">
                    <p className="text-2xl font-bold text-slate-900">88%</p>
                    <span className="text-xs text-emerald-600 font-medium mb-1 flex items-center"><TrendingUp className="w-3 h-3 mr-0.5"/> +2%</span>
                 </div>
                 <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '88%' }}></div>
                 </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4">
                 <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Outstanding Arrears</p>
                 <p className="text-2xl font-bold text-red-600 mt-1">RM 14,200</p>
                 <p className="text-xs text-slate-500 mt-1">From 24 Houses</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4">
                 <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Advance Payments</p>
                 <p className="text-2xl font-bold text-indigo-600 mt-1">RM 5,600</p>
                 <p className="text-xs text-slate-500 mt-1">Prepaid for 2024</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Revenue Trend Area Chart */}
            <Card className="lg:col-span-2 border-slate-200 shadow-sm">
               <CardHeader className="flex flex-row items-center justify-between">
                 <CardTitle>Revenue Trend (6 Months)</CardTitle>
                 <Badge variant="outline" className="font-normal text-slate-500">Includes Sinking Fund</Badge>
               </CardHeader>
               <CardContent className="h-[350px]">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                     <defs>
                       <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                         <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                     <Tooltip />
                     <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                   </AreaChart>
                 </ResponsiveContainer>
               </CardContent>
            </Card>

            {/* Income Composition Pie */}
            <Card className="border-slate-200 shadow-sm">
               <CardHeader>
                 <CardTitle>Income Sources</CardTitle>
               </CardHeader>
               <CardContent className="h-[350px]">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={incomeComposition}
                       cx="50%"
                       cy="50%"
                       innerRadius={60}
                       outerRadius={80}
                       paddingAngle={5}
                       dataKey="value"
                     >
                       {incomeComposition.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.color} />
                       ))}
                     </Pie>
                     <Tooltip />
                     <Legend verticalAlign="bottom" height={80} iconType="circle" />
                   </PieChart>
                 </ResponsiveContainer>
               </CardContent>
            </Card>
          </div>

          {/* Recent Collections Table */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Wallet className="w-4 h-4" /></div>
                  <h3 className="font-bold text-slate-900">Recent Collections</h3>
               </div>
               <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">View All Invoices</Button>
             </div>
             <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                  <tr>
                    <th className="px-6 py-4">Receipt ID</th>
                    <th className="px-6 py-4">House No.</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Method</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {recentCollections.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                       <td className="px-6 py-4 font-mono text-slate-500 text-xs">{item.id}</td>
                       <td className="px-6 py-4 font-medium text-slate-900">{item.unit}</td>
                       <td className="px-6 py-4 text-slate-600">{item.date}</td>
                       <td className="px-6 py-4 text-slate-600">{item.method}</td>
                       <td className="px-6 py-4 text-right font-bold text-emerald-600">+ RM {item.amount.toFixed(2)}</td>
                       <td className="px-6 py-4 text-center">
                          <Badge variant={item.status === 'CLEARED' ? 'default' : 'secondary'} className="text-[10px]">
                            {item.status}
                          </Badge>
                       </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </Card>
        </div>
      )}

      {/* EXPENSE TAB */}
      {activeTab === 'EXPENSE' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Expense KPIs */}
           <div className="grid md:grid-cols-4 gap-4">
            <Card className="border-slate-200 shadow-sm bg-slate-50">
              <CardContent className="p-4">
                 <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Spent (Dec)</p>
                 <p className="text-2xl font-bold text-slate-900 mt-1">RM 24,500</p>
                 <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div> 85% of Monthly Budget
                 </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4">
                 <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Fixed Costs</p>
                 <p className="text-2xl font-bold text-slate-900 mt-1">RM 18,200</p>
                 <p className="text-xs text-slate-400 mt-1">Security, Cleaning, Staff</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4">
                 <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Variable Costs</p>
                 <p className="text-2xl font-bold text-slate-900 mt-1">RM 6,300</p>
                 <p className="text-xs text-slate-400 mt-1">Repairs, Supplies</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4">
                 <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pending Approval</p>
                 <p className="text-2xl font-bold text-amber-600 mt-1">3 Claims</p>
                 <p className="text-xs text-slate-500 mt-1">Total: RM 4,550</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
             {/* Budget vs Actual Chart */}
             <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Budget vs Actual (Dec)</CardTitle>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={budgetData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="category" type="category" width={80} tick={{fill: '#475569', fontSize: 12}} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: 'transparent'}} />
                      <Legend />
                      <Bar dataKey="budget" name="Budget" fill="#e2e8f0" barSize={20} radius={[0, 4, 4, 0]} />
                      <Bar dataKey="actual" name="Actual Spent" fill="#6366f1" barSize={20} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
             </Card>

             {/* Breakdown Donut */}
             <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Expense Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseComposition}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {expenseComposition.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend layout="vertical" verticalAlign="middle" align="right" />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
             </Card>
          </div>

          {/* Recent Expenses List */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <div className="p-2 bg-red-100 text-red-600 rounded-lg"><CreditCard className="w-4 h-4" /></div>
                  <h3 className="font-bold text-slate-900">Vendor Payments & Claims</h3>
               </div>
               <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">View All</Button>
             </div>
             <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                  <tr>
                    <th className="px-6 py-4">Ref ID</th>
                    <th className="px-6 py-4">Vendor / Payee</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {recentExpenses.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                       <td className="px-6 py-4 font-mono text-slate-500 text-xs">{item.id}</td>
                       <td className="px-6 py-4 font-medium text-slate-900">{item.vendor}</td>
                       <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                             {item.category}
                          </span>
                       </td>
                       <td className="px-6 py-4 text-slate-600">{item.date}</td>
                       <td className="px-6 py-4 text-right font-medium text-slate-900">RM {item.amount.toFixed(2)}</td>
                       <td className="px-6 py-4 text-center">
                          <Badge variant={item.status === 'PAID' ? 'default' : 'secondary'} className="text-[10px]">
                            {item.status}
                          </Badge>
                       </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </Card>
        </div>
      )}
    </div>
  );
}
