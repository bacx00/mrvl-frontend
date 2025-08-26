import React, { useEffect, useRef } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Response Time Chart Component
export const ResponseTimeChart = ({ data, timeRange = '24h' }) => {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => `Response Time: ${context.parsed.y}ms`
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          maxTicksLimit: timeRange === '24h' ? 12 : 7,
          callback: function(value, index) {
            if (timeRange === '24h') {
              return index % 2 === 0 ? this.getLabelForValue(value) : '';
            }
            return this.getLabelForValue(value);
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          callback: (value) => `${value}ms`
        }
      }
    }
  };

  const chartData = {
    labels: data.map(d => {
      const date = new Date(d.timestamp);
      if (timeRange === '24h') {
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }),
    datasets: [
      {
        label: 'Response Time',
        data: data.map(d => d.value),
        borderColor: 'rgba(102, 126, 234, 1)',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointBackgroundColor: 'rgba(102, 126, 234, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }
    ]
  };

  return (
    <div style={{ height: '200px' }}>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

// Uptime Chart Component
export const UptimeChart = ({ data, timeRange = '7d' }) => {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context) => `Uptime: ${context.parsed.y.toFixed(2)}%`
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          maxTicksLimit: 7
        }
      },
      y: {
        min: 98,
        max: 100,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          callback: (value) => `${value}%`
        }
      }
    }
  };

  const chartData = {
    labels: data.map(d => {
      const date = new Date(d.timestamp);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }),
    datasets: [
      {
        label: 'Uptime',
        data: data.map(d => d.uptime),
        backgroundColor: (context) => {
          const value = context.parsed?.y || 100;
          if (value >= 99.9) return 'rgba(46, 204, 113, 0.8)';
          if (value >= 99.5) return 'rgba(241, 196, 15, 0.8)';
          return 'rgba(231, 76, 60, 0.8)';
        },
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1
      }
    ]
  };

  return (
    <div style={{ height: '200px' }}>
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
};

// Request Volume Chart
export const RequestVolumeChart = ({ data }) => {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        padding: 12
      }
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)'
        }
      },
      y: {
        stacked: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          callback: (value) => {
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
            return value;
          }
        }
      }
    }
  };

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Successful Requests',
        data: data.successful,
        backgroundColor: 'rgba(46, 204, 113, 0.7)',
        borderColor: 'rgba(46, 204, 113, 1)',
        borderWidth: 1
      },
      {
        label: 'Failed Requests',
        data: data.failed,
        backgroundColor: 'rgba(231, 76, 60, 0.7)',
        borderColor: 'rgba(231, 76, 60, 1)',
        borderWidth: 1
      }
    ]
  };

  return (
    <div style={{ height: '250px' }}>
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
};

// Live Activity Sparkline
export const ActivitySparkline = ({ data, color = '#667eea' }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate points
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const stepX = width / (data.length - 1);

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    data.forEach((value, index) => {
      const x = index * stepX;
      const y = height - ((value - min) / range) * height * 0.8 - height * 0.1;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(1, color + '00');

    ctx.beginPath();
    data.forEach((value, index) => {
      const x = index * stepX;
      const y = height - ((value - min) / range) * height * 0.8 - height * 0.1;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

  }, [data, color]);

  return (
    <canvas 
      ref={canvasRef} 
      width={150} 
      height={40}
      style={{ width: '100%', height: '40px' }}
    />
  );
};

// Error Rate Gauge
export const ErrorRateGauge = ({ value, threshold = 1 }) => {
  const angle = Math.min(value / 5 * 180, 180); // Max 5% error rate
  const color = value < threshold ? '#2ecc71' : 
                value < threshold * 2 ? '#f39c12' : '#e74c3c';

  return (
    <div className="gauge-container">
      <svg width="120" height="80" viewBox="0 0 120 80">
        {/* Background arc */}
        <path
          d="M 10 70 A 50 50 0 0 1 110 70"
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        
        {/* Value arc */}
        <path
          d={`M 10 70 A 50 50 0 0 1 ${60 + 50 * Math.cos((180 - angle) * Math.PI / 180)} ${70 - 50 * Math.sin((180 - angle) * Math.PI / 180)}`}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
        />
        
        {/* Center text */}
        <text
          x="60"
          y="65"
          textAnchor="middle"
          fill="white"
          fontSize="20"
          fontWeight="bold"
        >
          {value.toFixed(2)}%
        </text>
        
        <text
          x="60"
          y="78"
          textAnchor="middle"
          fill="rgba(255, 255, 255, 0.6)"
          fontSize="10"
        >
          Error Rate
        </text>
      </svg>
    </div>
  );
};

export default {
  ResponseTimeChart,
  UptimeChart,
  RequestVolumeChart,
  ActivitySparkline,
  ErrorRateGauge
};