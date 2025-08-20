import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  ReferenceLine
} from 'recharts';
import './Silos.css';

/**
 * Helper function to format a date to a readable format in the Mexico City timezone.
 * This function handles both Date objects and date strings.
 * @param {Date|string} dateInput The date object or string from the API.
 * @param {object} options Optional formatting options to override the defaults.
 * @returns {string} The formatted date string in 'es-MX' locale and 'America/Mexico_City' timezone.
 */
const formatDateForMexico = (dateInput, options = {}) => {
  let date;

  // Check if the input is a Date object
  if (dateInput instanceof Date) {
    date = dateInput;
  } else if (typeof dateInput === 'string') {
    // If it's a string, ensure it's treated as UTC for correct conversion
    // by appending 'Z' if it's not already a valid ISO string with a timezone.
    const utcDateString = dateInput.endsWith('Z') || dateInput.includes('+') ? dateInput : `${dateInput}Z`;
    date = new Date(utcDateString);
  } else {
    // Handle invalid input types gracefully
    return 'Fecha inválida';
  }

  // Check for an invalid date
  if (isNaN(date.getTime())) {
    return 'Fecha inválida';
  }
  
  const defaultOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true, // Use 12-hour format with AM/PM
    timeZone: 'America/Mexico_City',
  };
  
  // Apply default and custom options
  return date.toLocaleString('es-MX', { ...defaultOptions, ...options });
};

// Custom tooltip for the history chart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    // 'label' from recharts is a Date object, pass it directly to our formatter
    const formattedDate = formatDateForMexico(label);
    
    return (
      <div className="custom-tooltip">
        <p className="label">{`Fecha: ${formattedDate}`}</p>
        {payload.map((item, index) => (
          <p key={index} className="intro" style={{ color: item.stroke || item.fill }}>
            {`${item.name}: ${item.value ? item.value.toFixed(1) : '—'}%`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Generates a random color for each line of the chart, with a consistent palette
const getRandomColor = (index) => {
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#d0ed57', '#a4de6c', '#6a5acd', '#ff7300', '#387908'];
  return colors[index % colors.length];
};

const SiloHistoryChart = ({ data, title, multiSilo = false, isGeneralView = false, silos = [], selectedSilosForGraph = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="history-chart-container">
        <h3 className="chart-title">{title}</h3>
        <div className="no-data">No hay datos históricos disponibles</div>
      </div>
    );
  }

  const siloNames = selectedSilosForGraph.map(id => {
    const silo = silos.find(s => s.id === id);
    return silo ? silo.nombre : `Silo ${id}`;
  });

  const renderChart = () => {
    // Check if the data array is empty or contains invalid data points
    const hasValidData = data.some(d => d.porcentaje !== undefined || siloNames.some(name => d[name] !== undefined));
    if (!hasValidData) {
      return (
        <div className="no-data">No hay datos válidos para mostrar.</div>
      );
    }
    
    // If multiSilo is true, we render a LineChart for comparison
    if (multiSilo) {
      return (
        <LineChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(201, 161, 74, 0.3)" />
          <XAxis
            dataKey="timestamp"
            stroke="#c9a14a"
            tick={{ fill: '#c9a14a' }}
            // Pass the Date object directly to the formatter
            tickFormatter={(tick) => formatDateForMexico(tick)}
          />
          <YAxis
            stroke="#c9a14a"
            domain={[0, 100]}
            tick={{ fill: '#c9a14a' }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {siloNames.map((siloName, index) => (
            <Line
              key={siloName}
              type="monotone"
              dataKey={siloName}
              stroke={getRandomColor(index)}
              strokeWidth={2}
              dot={{ stroke: getRandomColor(index), strokeWidth: 2, fill: '#fff', r: 4 }}
              name={siloName}
              activeDot={{ r: 8 }}
            />
          ))}
        </LineChart>
      );
    } else if (isGeneralView) {
      // For the general view, we use an AreaChart
      return (
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(201, 161, 74, 0.3)" />
          <XAxis
            dataKey="timestamp"
            stroke="#c9a14a"
            tick={{ fill: '#c9a14a' }}
            // Pass the Date object directly to the formatter
            tickFormatter={(tick) => formatDateForMexico(tick)}
          />
          <YAxis
            stroke="#c9a14a"
            domain={[0, 100]}
            tick={{ fill: '#c9a14a' }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={100} stroke="#c53030" strokeDasharray="3 3" label={{ position: 'right', value: '100%', fill: '#c53030' }} />
          <Area
            type="monotone"
            dataKey="porcentaje"
            stroke="#c9a14a"
            fill="url(#colorGeneral)"
            strokeWidth={2}
            activeDot={{ r: 8 }}
          />
          <defs>
            <linearGradient id="colorGeneral" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#c9a14a" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#c9a14a" stopOpacity={0.1} />
            </linearGradient>
          </defs>
        </AreaChart>
      );
    } else {
      // This branch is used for the modal chart, showing a single silo
      return (
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(201, 161, 74, 0.3)" />
          <XAxis
            dataKey="timestamp"
            stroke="#c9a14a"
            tick={{ fill: '#c9a14a' }}
            // Pass the Date object directly to the formatter
            tickFormatter={(tick) => formatDateForMexico(tick)}
          />
          <YAxis
            stroke="#c9a14a"
            domain={[0, 100]}
            tick={{ fill: '#c9a14a' }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={100} stroke="#c53030" strokeDasharray="3 3" label={{ position: 'right', value: '100%', fill: '#c53030' }} />
          <Area
            type="monotone"
            dataKey="porcentaje"
            stroke="#c9a14a"
            fill="url(#colorUv)"
            strokeWidth={2}
            activeDot={{ r: 8 }}
          />
          <defs>
            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#c9a14a" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#c9a14a" stopOpacity={0.1} />
            </linearGradient>
          </defs>
        </AreaChart>
      );
    }
  };

  return (
    <div className="history-chart-container">
      <h3 className="chart-title">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

export default SiloHistoryChart;