// src/components/StatsCard.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { formatNumber, formatPercentage, getChangeIcon, exportToCSV } from '@/lib/utils';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export interface StatData {
  label: string;
  value: number;
  previousValue?: number;
  percentage?: number;
  color?: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  showChange?: boolean;
  changeValue?: number;
  changeLabel?: string;
  loading?: boolean;
  error?: string;
  
  // Chart props
  chartType?: 'line' | 'bar' | 'doughnut' | 'none';
  chartData?: ChartDataPoint[];
  chartLabels?: string[];
  showMiniChart?: boolean;
  
  // Interactive props
  onClick?: () => void;
  className?: string;
  exportable?: boolean;
  timeRange?: string;
  lastUpdated?: Date;
  
  // Comparison props
  compareData?: StatData[];
  showComparison?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'neutral',
  size = 'md',
  showChange = false,
  changeValue,
  changeLabel,
  loading = false,
  error,
  chartType = 'none',
  chartData = [],
  chartLabels = [],
  showMiniChart = false,
  onClick,
  className = '',
  exportable = false,
  timeRange,
  lastUpdated,
  compareData = [],
  showComparison = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showFullChart, setShowFullChart] = useState(false);
  const chartRef = useRef<any>(null);

  // Color mappings based on VLR.gg theme
  const variantColors = {
    primary: {
      bg: '#fa4454',
      text: '#ffffff',
      border: '#fa4454',
      hover: '#e03e4e'
    },
    success: {
      bg: '#4ade80',
      text: '#ffffff',
      border: '#4ade80',
      hover: '#22c55e'
    },
    danger: {
      bg: '#ef4444',
      text: '#ffffff',
      border: '#ef4444',
      hover: '#dc2626'
    },
    warning: {
      bg: '#f59e0b',
      text: '#ffffff',
      border: '#f59e0b',
      hover: '#d97706'
    },
    info: {
      bg: '#3b82f6',
      text: '#ffffff',
      border: '#3b82f6',
      hover: '#2563eb'
    },
    neutral: {
      bg: '#1a2332',
      text: '#ffffff',
      border: '#2b3d4d',
      hover: '#20303d'
    }
  };

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const valueSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  const colors = variantColors[variant];

  // Handle export functionality
  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const exportData = [
      { metric: title, value: value.toString(), ...(subtitle && { subtitle }) },
      ...(compareData.map(item => ({
        metric: item.label,
        value: item.value.toString(),
        percentage: item.percentage?.toString() || ''
      })))
    ];

    exportToCSV(exportData, `${title.replace(/\s+/g, '_').toLowerCase()}_stats`);
  };

  // Chart configuration
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#0f1419',
        titleColor: '#ffffff',
        bodyColor: '#768894',
        borderColor: '#2b3d4d',
        borderWidth: 1
      }
    },
    scales: chartType !== 'doughnut' ? {
      x: {
        display: false,
        grid: {
          display: false
        }
      },
      y: {
        display: false,
        grid: {
          display: false
        }
      }
    } : undefined,
    elements: {
      point: {
        radius: 0,
        hoverRadius: 4
      },
      line: {
        borderWidth: 2,
        tension: 0.4
      }
    }
  };

  const generateChartData = () => {
    const baseColor = colors.bg;
    
    switch (chartType) {
      case 'line':
        return {
          labels: chartLabels,
          datasets: [{
            data: chartData.map(d => d.value),
            borderColor: baseColor,
            backgroundColor: `${baseColor}20`,
            fill: true
          }]
        };
      
      case 'bar':
        return {
          labels: chartLabels,
          datasets: [{
            data: chartData.map(d => d.value),
            backgroundColor: chartData.map(d => d.color || baseColor),
            borderWidth: 0
          }]
        };
      
      case 'doughnut':
        return {
          labels: chartData.map(d => d.label),
          datasets: [{
            data: chartData.map(d => d.value),
            backgroundColor: chartData.map((d, i) => d.color || `hsl(${i * 60}, 70%, 60%)`),
            borderWidth: 0
          }]
        };
      
      default:
        return null;
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className={`bg-[#1a2332] border border-[#2b3d4d] rounded-lg ${sizeClasses[size]} animate-pulse ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-[#2b3d4d] rounded w-2/3"></div>
          <div className="h-8 w-8 bg-[#2b3d4d] rounded"></div>
        </div>
        <div className="h-8 bg-[#2b3d4d] rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-[#2b3d4d] rounded w-3/4"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-[#1a2332] border border-[#ef4444] rounded-lg ${sizeClasses[size]} ${className}`}>
        <div className="flex items-center space-x-2 text-[#ef4444]">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">Error loading {title}</span>
        </div>
        <p className="text-xs text-[#768894] mt-2">{error}</p>
      </div>
    );
  }

  const cardContent = (
    <div 
      className={`
        bg-[#1a2332] border border-[#2b3d4d] rounded-lg transition-all duration-300 
        ${onClick ? 'cursor-pointer hover:border-[#fa4454] hover:shadow-lg hover:-translate-y-0.5' : ''}
        ${isHovered ? 'border-[#fa4454]' : ''}
        ${sizeClasses[size]} ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {icon && (
            <div className="text-[#768894] transition-colors duration-300 group-hover:text-[#fa4454]">
              {icon}
            </div>
          )}
          <h3 className="text-sm font-medium text-[#768894] group-hover:text-white transition-colors">
            {title}
          </h3>
        </div>
        
        <div className="flex items-center space-x-2">
          {exportable && (
            <button
              onClick={handleExport}
              className="p-1 text-[#768894] hover:text-[#fa4454] transition-colors"
              title="Export data"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          )}
          
          {timeRange && (
            <span className="text-xs text-[#768894] px-2 py-1 bg-[#0f1419] rounded">
              {timeRange}
            </span>
          )}
        </div>
      </div>
      
      {/* Main Value */}
      <div className="mb-3">
        <div className={`font-bold text-white ${valueSizeClasses[size]} transition-colors duration-300 group-hover:text-[#fa4454]`}>
          {typeof value === 'number' ? formatNumber(value) : value}
        </div>
        
        {subtitle && (
          <div className="text-sm text-[#768894] mt-1">
            {subtitle}
          </div>
        )}
      </div>
      
      {/* Change Indicator */}
      {showChange && changeValue !== undefined && (
        <div className="flex items-center space-x-2 mb-3">
          {getChangeIcon(changeValue)}
          <span className={`text-sm font-medium ${
            changeValue > 0 ? 'text-[#4ade80]' : changeValue < 0 ? 'text-[#ef4444]' : 'text-[#768894]'
          }`}>
            {changeValue > 0 ? '+' : ''}{formatNumber(changeValue)}
            {changeLabel && ` ${changeLabel}`}
          </span>
        </div>
      )}
      
      {/* Mini Chart */}
      {showMiniChart && chartType !== 'none' && chartData.length > 0 && (
        <div className="h-16 mb-3">
          {chartType === 'line' && (
            <Line ref={chartRef} data={generateChartData()!} options={chartOptions} />
          )}
          {chartType === 'bar' && (
            <Bar ref={chartRef} data={generateChartData()!} options={chartOptions} />
          )}
          {chartType === 'doughnut' && (
            <div className="h-16 w-16 mx-auto">
              <Doughnut ref={chartRef} data={generateChartData()!} options={chartOptions} />
            </div>
          )}
        </div>
      )}
      
      {/* Comparison Data */}
      {showComparison && compareData.length > 0 && (
        <div className="space-y-2 mb-3">
          <div className="text-xs text-[#768894] font-medium">Comparison</div>
          {compareData.slice(0, 3).map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-xs text-white">{item.label}</span>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-[#768894]">
                  {formatNumber(item.value)}
                </span>
                {item.percentage !== undefined && (
                  <span className={`text-xs font-medium ${
                    item.percentage > 0 ? 'text-[#4ade80]' : 
                    item.percentage < 0 ? 'text-[#ef4444]' : 'text-[#768894]'
                  }`}>
                    {item.percentage > 0 ? '+' : ''}{formatPercentage(item.percentage)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Footer */}
      {lastUpdated && (
        <div className="text-xs text-[#768894] border-t border-[#2b3d4d] pt-3">
          Last updated: {lastUpdated.toLocaleString()}
        </div>
      )}
      
      {/* Full Chart Modal Trigger */}
      {chartType !== 'none' && chartData.length > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowFullChart(true);
          }}
          className="text-xs text-[#fa4454] hover:text-[#e03e4e] transition-colors mt-2"
        >
          View detailed chart →
        </button>
      )}
    </div>
  );

  return (
    <>
      {cardContent}
      
      {/* Full Chart Modal */}
      {showFullChart && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#2b3d4d]">
              <h2 className="text-lg font-bold text-white">{title} - Detailed Chart</h2>
              <button
                onClick={() => setShowFullChart(false)}
                className="text-[#768894] hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <div className="h-96">
                {chartType === 'line' && (
                  <Line data={generateChartData()!} options={{...chartOptions, scales: undefined}} />
                )}
                {chartType === 'bar' && (
                  <Bar data={generateChartData()!} options={{...chartOptions, scales: undefined}} />
                )}
                {chartType === 'doughnut' && (
                  <Doughnut data={generateChartData()!} options={chartOptions} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StatsCard;
