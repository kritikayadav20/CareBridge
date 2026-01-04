'use client'

import { useState } from 'react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Brush
} from 'recharts'
import { HealthRecord } from '@/types'
import HealthStatusIndicator from './HealthStatusIndicator'

interface HealthChartProps {
  records: HealthRecord[]
}

export default function HealthChart({ records }: HealthChartProps) {
  const [activeVitals, setActiveVitals] = useState({
    bloodPressure: true,
    heartRate: true,
    sugarLevel: true,
  })

  // Get latest values for status indicators
  const latestRecord = records[records.length - 1]

  const chartData = records.map(record => ({
    date: new Date(record.recorded_at).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
    fullDate: new Date(record.recorded_at).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    timestamp: record.recorded_at,
    systolic: record.blood_pressure_systolic,
    diastolic: record.blood_pressure_diastolic,
    heartRate: record.heart_rate,
    sugarLevel: record.sugar_level,
  }))

  const toggleVital = (vital: keyof typeof activeVitals) => {
    setActiveVitals(prev => ({
      ...prev,
      [vital]: !prev[vital]
    }))
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-4">
          <p className="font-semibold text-slate-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-medium">{entry.value || 'N/A'}</span>
              {entry.dataKey === 'systolic' || entry.dataKey === 'diastolic' ? ' mmHg' : ''}
              {entry.dataKey === 'heartRate' ? ' bpm' : ''}
              {entry.dataKey === 'sugarLevel' ? ' mg/dL' : ''}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-xl font-semibold text-slate-900">Health Trends Over Time</h3>
        
        {/* Health Status Indicators */}
        {latestRecord && (
          <div className="flex flex-wrap gap-4">
            {latestRecord.blood_pressure_systolic && latestRecord.blood_pressure_diastolic && (
              <HealthStatusIndicator
                type="blood_pressure"
                value={null}
                systolic={latestRecord.blood_pressure_systolic}
                diastolic={latestRecord.blood_pressure_diastolic}
              />
            )}
            {latestRecord.heart_rate && (
              <HealthStatusIndicator
                type="heart_rate"
                value={latestRecord.heart_rate}
              />
            )}
            {latestRecord.sugar_level && (
              <HealthStatusIndicator
                type="sugar_level"
                value={latestRecord.sugar_level}
              />
            )}
          </div>
        )}
      </div>

      {/* Toggle Controls */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => toggleVital('bloodPressure')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeVitals.bloodPressure
              ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
              : 'bg-slate-100 text-slate-600 border-2 border-slate-200'
          }`}
        >
          {activeVitals.bloodPressure ? '✓' : '○'} Blood Pressure
        </button>
        <button
          onClick={() => toggleVital('heartRate')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeVitals.heartRate
              ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
              : 'bg-slate-100 text-slate-600 border-2 border-slate-200'
          }`}
        >
          {activeVitals.heartRate ? '✓' : '○'} Heart Rate
        </button>
        <button
          onClick={() => toggleVital('sugarLevel')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeVitals.sugarLevel
              ? 'bg-red-100 text-red-700 border-2 border-red-300'
              : 'bg-slate-100 text-slate-600 border-2 border-slate-200'
          }`}
        >
          {activeVitals.sugarLevel ? '✓' : '○'} Sugar Level
        </button>
      </div>

      {/* Combined Chart */}
      <div className="w-full">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              stroke="#64748b"
              style={{ fontSize: '12px' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              yAxisId="left"
              stroke="#64748b"
              style={{ fontSize: '12px' }}
              label={{ value: 'Blood Pressure (mmHg) / Heart Rate (bpm)', angle: -90, position: 'insideLeft' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#64748b"
              style={{ fontSize: '12px' }}
              label={{ value: 'Sugar Level (mg/dL)', angle: 90, position: 'insideRight' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            {activeVitals.bloodPressure && (
              <>
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="systolic" 
                  name="BP Systolic"
                  stroke="#0ea5e9" 
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#0ea5e9' }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="diastolic" 
                  name="BP Diastolic"
                  stroke="#14b8a6" 
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#14b8a6' }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              </>
            )}
            {activeVitals.heartRate && (
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="heartRate" 
                name="Heart Rate"
                stroke="#f59e0b" 
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#f59e0b' }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            )}
            {activeVitals.sugarLevel && (
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="sugarLevel" 
                name="Sugar Level"
                stroke="#ef4444" 
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#ef4444' }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            )}
            <Brush 
              dataKey="date" 
              height={30}
              stroke="#94a3b8"
              fill="#f1f5f9"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Separate Charts for Better Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Blood Pressure Chart */}
        {activeVitals.bloodPressure && (
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-slate-900 mb-4">Blood Pressure Trend</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b"
                  style={{ fontSize: '10px' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="#64748b"
                  style={{ fontSize: '10px' }}
                  label={{ value: 'mmHg', angle: -90, position: 'insideLeft', style: { fontSize: '10px' } }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="systolic" 
                  name="Systolic"
                  stroke="#0ea5e9" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
                <Line 
                  type="monotone" 
                  dataKey="diastolic" 
                  name="Diastolic"
                  stroke="#14b8a6" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Heart Rate Chart */}
        {activeVitals.heartRate && (
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-slate-900 mb-4">Heart Rate Trend</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b"
                  style={{ fontSize: '10px' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="#64748b"
                  style={{ fontSize: '10px' }}
                  label={{ value: 'bpm', angle: -90, position: 'insideLeft', style: { fontSize: '10px' } }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="heartRate" 
                  name="Heart Rate"
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Sugar Level Chart */}
        {activeVitals.sugarLevel && (
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-slate-900 mb-4">Sugar Level Trend</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b"
                  style={{ fontSize: '10px' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="#64748b"
                  style={{ fontSize: '10px' }}
                  label={{ value: 'mg/dL', angle: -90, position: 'insideLeft', style: { fontSize: '10px' } }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="sugarLevel" 
                  name="Sugar Level"
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
