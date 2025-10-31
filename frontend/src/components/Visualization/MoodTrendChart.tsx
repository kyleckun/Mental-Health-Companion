import React from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { MoodTrendData, getMoodColor } from '../../types/mood.types';

interface MoodTrendChartProps {
  data: MoodTrendData[];
  onTimeRangeChange: (range: 'today' | 'week' | 'month' | 'custom', startDate?: string, endDate?: string) => void;
  timeRange: 'today' | 'week' | 'month' | 'custom';
  customStartDate?: string;
  customEndDate?: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  const tooltipStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.9)',
    padding: '12px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    border: '1px solid #e5e7eb',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
    margin: '0 0 8px 0',
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '14px',
    margin: '0',
  };

  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={tooltipStyle}>
        <p style={labelStyle}>{data.date}</p>
        <p style={{ ...valueStyle, color: getMoodColor(data.moodScore) }}>
          Mood: <strong>{data.moodScore.toFixed(1)}/10</strong>
        </p>
      </div>
    );
  }
  return null;
};

const MoodTrendChart: React.FC<MoodTrendChartProps> = ({
  data,
  onTimeRangeChange,
  timeRange,
  customStartDate,
  customEndDate
}) => {
  const [showCustomDatePicker, setShowCustomDatePicker] = React.useState(false);
  const [tempStartDate, setTempStartDate] = React.useState(customStartDate || '');
  const [tempEndDate, setTempEndDate] = React.useState(customEndDate || '');

  const getAverageMood = (): number => {
    if (data.length === 0) return 0;
    const sum = data.filter(d => d.moodScore > 0).reduce((acc, d) => acc + d.moodScore, 0);
    const count = data.filter(d => d.moodScore > 0).length;
    return count > 0 ? sum / count : 0;
  };

  const getTotalEntries = (): number => {
    // Sum up all entry counts from the data
    return data.reduce((acc, d) => acc + (d.entryCount || 0), 0);
  };

  const avgMood = getAverageMood();
  const totalEntries = getTotalEntries();

  const chartStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  };

  const titleSectionStyle: React.CSSProperties = {};

  const h2Style: React.CSSProperties = {
    fontSize: '22px',
    fontWeight: 700,
    color: '#1f2937',
    margin: 0,
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '4px',
  };

  const timeRangeSelectorStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    background: '#f3f4f6',
    padding: '6px',
    borderRadius: '10px',
  };

  const rangeBtnStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    border: 'none',
    background: isActive ? 'white' : 'transparent',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    color: isActive ? '#3b82f6' : '#4b5563',
    boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
  });

  const statsOverviewStyle: React.CSSProperties = {
    display: 'flex',
    gap: '24px',
    marginBottom: '24px',
    paddingBottom: '20px',
    borderBottom: '1px solid #e5e7eb',
  };

  const statItemStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#6b7280',
    textTransform: 'uppercase',
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 700,
    color: '#1f2937',
  };

  const chartContainerStyle: React.CSSProperties = {
    width: '100%',
    height: '400px',
  };

  const emptyChartStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '80px 20px',
    color: '#6b7280',
  };

  const emptyChartPStyle: React.CSSProperties = {
    fontSize: '48px',
    marginBottom: '16px',
  };

  const emptySubtitleStyle: React.CSSProperties = {
    fontSize: '14px',
    margin: 0,
  };

  const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const modalContentStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '400px',
    width: '90%',
  };

  const modalHeaderStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '16px',
    color: '#1f2937',
  };

  const dateInputGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
  };

  const dateInputLabelStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 500,
    color: '#4b5563',
    marginBottom: '4px',
  };

  const dateInputStyle: React.CSSProperties = {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
  };

  const modalButtonGroupStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
  };

  const cancelBtnStyle: React.CSSProperties = {
    padding: '8px 16px',
    border: '1px solid #d1d5db',
    background: 'white',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
  };

  const applyBtnStyle: React.CSSProperties = {
    padding: '8px 16px',
    border: 'none',
    background: '#3b82f6',
    color: 'white',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
  };

  const handleApplyCustomRange = () => {
    if (tempStartDate && tempEndDate) {
      onTimeRangeChange('custom', tempStartDate, tempEndDate);
      setShowCustomDatePicker(false);
    }
  };

  return (
    <div style={chartStyle}>
      <div style={headerStyle}>
        <div style={titleSectionStyle}>
          <h2 style={h2Style}>Emotion Trends</h2>
          <p style={subtitleStyle}>Your mood patterns over the selected period</p>
        </div>
        <div style={timeRangeSelectorStyle}>
          <button
            style={rangeBtnStyle(timeRange === 'today')}
            onClick={() => onTimeRangeChange('today')}
          >
            Today
          </button>
          <button
            style={rangeBtnStyle(timeRange === 'week')}
            onClick={() => onTimeRangeChange('week')}
          >
            Last 7 Days
          </button>
          <button
            style={rangeBtnStyle(timeRange === 'month')}
            onClick={() => onTimeRangeChange('month')}
          >
            Last 30 Days
          </button>
          <button
            style={rangeBtnStyle(timeRange === 'custom')}
            onClick={() => setShowCustomDatePicker(true)}
          >
            Custom
          </button>
        </div>
      </div>

      <div style={statsOverviewStyle}>
        <div style={statItemStyle}>
          <span style={statLabelStyle}>Avg. Mood</span>
          <span style={statValueStyle}>{avgMood.toFixed(1)}/10</span>
        </div>
        <div style={statItemStyle}>
          <span style={statLabelStyle}>Total Entries</span>
          <span style={statValueStyle}>{totalEntries}</span>
        </div>
      </div>

      {data.length === 0 ? (
        <div style={emptyChartStyle}>
          <p style={emptyChartPStyle}>CHART</p>
          <h3 style={h2Style}>No data to display</h3>
          <p style={emptySubtitleStyle}>Log your mood to see your trends.</p>
        </div>
      ) : (
        <div style={chartContainerStyle}>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorMoodArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                stroke="#d1d5db"
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={[0, 10]} 
                tick={{ fontSize: 12, fill: '#6b7280' }} 
                stroke="#d1d5db"
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '3 3' }} />
              <Legend wrapperStyle={{ paddingTop: '24px' }} />
              <Area
                type="monotone"
                dataKey="moodScore"
                fill="url(#colorMoodArea)"
                stroke="none"
                name="Mood"
              />
              <Line
                type="monotone"
                dataKey="moodScore"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4, fill: '#3b82f6' }}
                activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }}
                name="Mood Score"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Custom Date Range Modal */}
      {showCustomDatePicker && (
        <div style={modalOverlayStyle} onClick={() => setShowCustomDatePicker(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={modalHeaderStyle}>Select Custom Date Range</h3>
            <div style={dateInputGroupStyle}>
              <div>
                <label style={dateInputLabelStyle}>Start Date</label>
                <input
                  type="date"
                  style={dateInputStyle}
                  value={tempStartDate}
                  onChange={(e) => setTempStartDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label style={dateInputLabelStyle}>End Date</label>
                <input
                  type="date"
                  style={dateInputStyle}
                  value={tempEndDate}
                  onChange={(e) => setTempEndDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  min={tempStartDate}
                />
              </div>
            </div>
            <div style={modalButtonGroupStyle}>
              <button style={cancelBtnStyle} onClick={() => setShowCustomDatePicker(false)}>
                Cancel
              </button>
              <button
                style={applyBtnStyle}
                onClick={handleApplyCustomRange}
                disabled={!tempStartDate || !tempEndDate}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoodTrendChart;