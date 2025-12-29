'use client';

import { useState, useEffect } from 'react';
import { ReportsAPI } from '@/lib/api';
import Icon, { 
  faChartBar,
  faDollarSign,
  faChartLine,
  faBuilding,
  faDownload,
  faCalendar,
} from '@/app/components/Icon';
import { toast } from '@/app/components/Toaster';
import { Button } from '@/app/components';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import AreaChart from '@/app/components/charts/AreaChart';
import BarChart from '@/app/components/charts/BarChart';
import DonutChart from '@/app/components/charts/DonutChart';

type ReportType = 'ORDERS' | 'REVENUE' | 'PERFORMANCE' | 'OPERATOR';

const REPORT_TYPES = [
  { value: 'ORDERS', label: 'Orders Report', icon: faChartBar },
  { value: 'REVENUE', label: 'Revenue Report', icon: faDollarSign },
  { value: 'PERFORMANCE', label: 'Performance Report', icon: faChartLine },
  { value: 'OPERATOR', label: 'Operator Report', icon: faBuilding },
];

export default function ReportsPage() {
  const [selectedType, setSelectedType] = useState<ReportType>('ORDERS');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [operatorId, setOperatorId] = useState('');

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select start and end dates');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error('Start date must be before end date');
      return;
    }

    setLoading(true);
    try {
      const params: any = {
        type: selectedType,
        start_date: startDate,
        end_date: endDate,
      };

      if (operatorId) {
        params.operator_id = operatorId;
      }

      const data = await ReportsAPI.generate(params);
      setReportData(data);
      toast.success('Report generated successfully');
    } catch (error: any) {
      console.error('Failed to generate report:', error);
      toast.error(error?.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate report on mount
  useEffect(() => {
    handleGenerateReport();
  }, []);

  const renderReportContent = () => {
    if (!reportData) return null;

    switch (selectedType) {
      case 'ORDERS':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-sm p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Total Orders</h3>
                <p className="text-3xl font-bold text-gray-900">{reportData.summary?.total_orders || 0}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-sm p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Status Breakdown</h3>
                <div className="mt-4 space-y-2">
                  {reportData.summary?.status_breakdown?.slice(0, 3).map((item: any) => (
                    <div key={item.status} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.status.replace(/_/g, ' ')}</span>
                      <span className="font-semibold text-gray-900">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {reportData.summary?.status_breakdown && (
              <div className="bg-white border border-gray-200 rounded-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders by Status</h3>
                <DonutChart
                  data={reportData.summary.status_breakdown.map((item: any) => ({
                    label: item.status.replace(/_/g, ' '),
                    value: item.count,
                  }))}
                  height={300}
                />
              </div>
            )}

            {reportData.daily_trend && reportData.daily_trend.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Orders Trend</h3>
                <AreaChart
                  data={reportData.daily_trend.map((item: any) => ({
                    x: item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
                    y: item.count || 0,
                  })).filter((item: any) => item.x)} // Filter out items with empty x
                  height={300}
                />
              </div>
            )}
          </div>
        );

      case 'REVENUE':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-sm p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Total Revenue</h3>
                <p className="text-3xl font-bold text-gray-900">
                  RWF {Number(reportData.summary?.total_revenue || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-sm p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Total Payments</h3>
                <p className="text-3xl font-bold text-gray-900">{reportData.summary?.total_payments || 0}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-sm p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Completed Payments</h3>
                <p className="text-3xl font-bold text-gray-900">{reportData.summary?.completed_payments || 0}</p>
              </div>
            </div>

            {reportData.summary?.method_breakdown && (
              <div className="bg-white border border-gray-200 rounded-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Payment Method</h3>
                <BarChart
                  data={reportData.summary.method_breakdown.map((item: any) => ({
                    x: item.method ? item.method.replace(/_/g, ' ') : '',
                    y: Number(item.total || 0),
                  })).filter((item: any) => item.x)} // Filter out items with empty x
                  height={300}
                />
              </div>
            )}

            {reportData.monthly_trend && reportData.monthly_trend.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Trend</h3>
                <AreaChart
                  data={reportData.monthly_trend.map((item: any) => ({
                    x: item.month ? (typeof item.month === 'string' ? new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : item.month) : '',
                    y: Number(item.total || 0),
                  })).filter((item: any) => item.x)} // Filter out items with empty x
                  height={300}
                />
              </div>
            )}
          </div>
        );

      case 'PERFORMANCE':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white border border-gray-200 rounded-sm p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Assignment Rate</h3>
                <p className="text-3xl font-bold text-gray-900">{reportData.metrics?.assignment_rate || 0}%</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-sm p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Completion Rate</h3>
                <p className="text-3xl font-bold text-gray-900">{reportData.metrics?.completion_rate || 0}%</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-sm p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Avg Delivery Time</h3>
                <p className="text-3xl font-bold text-gray-900">
                  {reportData.metrics?.average_delivery_time_hours?.toFixed(1) || 0}h
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-sm p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Total Orders</h3>
                <p className="text-3xl font-bold text-gray-900">{reportData.metrics?.total_orders || 0}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-sm p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Assigned Orders</h3>
                <p className="text-2xl font-bold text-gray-900">{reportData.metrics?.assigned_orders || 0}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-sm p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Delivered Orders</h3>
                <p className="text-2xl font-bold text-gray-900">{reportData.metrics?.delivered_orders || 0}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-sm p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Cancelled Orders</h3>
                <p className="text-2xl font-bold text-gray-900">{reportData.metrics?.cancelled_orders || 0}</p>
              </div>
            </div>
          </div>
        );

      case 'OPERATOR':
        return (
          <div className="space-y-6">
            {reportData.statistics && reportData.statistics.length > 0 ? (
              <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operator</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Orders</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivered</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicles</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Drivers</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.statistics.map((stat: any, index: number) => (
                        <tr key={stat.id || index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{stat.name}</p>
                              <p className="text-xs text-gray-500">{stat.code}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stat.total_orders || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stat.delivered_orders || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            RWF {Number(stat.total_revenue || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stat.total_vehicles || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stat.total_drivers || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-sm p-12 text-center">
                <p className="text-gray-500">No operator data available for the selected period</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Generate and view detailed reports</p>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="bg-white border border-gray-200 rounded-sm p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {REPORT_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => {
                setSelectedType(type.value as ReportType);
                setReportData(null);
              }}
              className={`p-4 border-2 rounded-sm transition-all ${
                selectedType === type.value
                  ? 'border-[#0b66c2] bg-[#0b66c2]/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Icon icon={type.icon} className={`mb-2 ${selectedType === type.value ? 'text-[#0b66c2]' : 'text-gray-400'}`} />
              <p className={`text-sm font-medium ${selectedType === type.value ? 'text-[#0b66c2]' : 'text-gray-700'}`}>
                {type.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleGenerateReport}
              disabled={loading}
              icon={faChartBar}
              className="w-full"
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
          <div className="flex items-end">
            <Button
              variant="secondary"
              onClick={() => {
                // TODO: Implement export functionality
                toast.info('Export functionality coming soon');
              }}
              icon={faDownload}
              className="w-full"
            >
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner text="Generating report..." />
        </div>
      ) : reportData ? (
        <div>
          <div className="mb-4 p-4 bg-gray-50 rounded-sm">
            <p className="text-sm text-gray-600">
              Period: {new Date(reportData.period?.start).toLocaleDateString()} - {new Date(reportData.period?.end).toLocaleDateString()}
            </p>
          </div>
          {renderReportContent()}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-sm p-12 text-center">
          <Icon icon={faChartBar} className="text-gray-300 mx-auto mb-4" size="3x" />
          <p className="text-gray-500">Select a report type and generate a report</p>
        </div>
      )}
    </div>
  );
}

