import React, { useState, useEffect, useCallback } from 'react';
import SiloCard from './SiloCard';
import DataTable from '../../common/DataTable';
import Modal from '../../common/Modal';
import SiloHistoryChart from './SiloHistoryChart';
import './Silos.css';
import GLOBAL_CONFIG from '../../../config';
import {
  MdDashboard,
  MdList,
  MdBarChart,
  MdSync
} from 'react-icons/md';

const formatDateForMexico = (dateInput, options = {}) => {
  let date;
  if (dateInput instanceof Date) {
    date = dateInput;
  } else if (typeof dateInput === 'string') {
    const utcDateString = dateInput.endsWith('Z') || dateInput.includes('+') ? dateInput : `${dateInput}Z`;
    date = new Date(utcDateString);
  } else {
    return 'Fecha inválida';
  }
  if (isNaN(date.getTime())) {
    return 'Fecha inválida';
  }
  const defaultOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Mexico_City',
  };
  return date.toLocaleString('es-MX', { ...defaultOptions, ...options });
};

const Silos = () => {
  const [silos, setSilos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('cards');
  const [showModal, setShowModal] = useState(false);
  const [selectedSilo, setSelectedSilo] = useState(null);
  const [historicalData, setHistoricalData] = useState({});
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedSilosForGraph, setSelectedSilosForGraph] = useState([]);
  const [isGeneralView, setIsGeneralView] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSilos = useCallback(async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${GLOBAL_CONFIG.API_BASE_URL}/inventory/silos/`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSilos(data || []);
        setError('');
      } else {
        setError("Error al cargar los silos");
      }
    } catch (error) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }, []);

  const requestReading = useCallback(async () => {
    setRefreshing(true);
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${GLOBAL_CONFIG.API_BASE_URL}/inventory/silos/read`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSilos(data || []);
        setError('');
      } else {
        const errorData = await response.json();
        setError(`Error al solicitar lectura: ${errorData.detail || 'Desconocido'}`);
      }
    } catch (error) {
      setError("Error de conexión al solicitar lectura");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSilos();
    const interval = setInterval(fetchSilos, 30000);
    return () => clearInterval(interval);
  }, [fetchSilos]);

  const fetchAllSilosHistoricalData = useCallback(async () => {
    setLoadingHistory(true);
    const token = localStorage.getItem("token");
    const allData = {};
    const siloIds = silos.map(silo => silo.id);

    try {
      await Promise.all(
        siloIds.map(async (siloId) => {
          const response = await fetch(`${GLOBAL_CONFIG.API_BASE_URL}/inventory/silos/${siloId}/lecturas`, {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            allData[siloId] = (data || []).map(item => {
              const utcDateString = item.timestamp.endsWith('Z') || item.timestamp.includes('+') ? item.timestamp : `${item.timestamp}Z`;
              return {
                ...item,
                timestamp: new Date(utcDateString)
              };
            });
          } else {
            console.error(`Error al cargar datos históricos para el silo ${siloId}`);
            allData[siloId] = [];
          }
        })
      );
      setHistoricalData(allData);
      setSelectedSilosForGraph(siloIds);
    } catch (error) {
      console.error("Error de conexión al obtener datos históricos", error);
      setHistoricalData({});
    } finally {
      setLoadingHistory(false);
    }
  }, [silos]);

  useEffect(() => {
    if (viewMode === 'graph' && silos.length > 0) {
      if (Object.keys(historicalData).length === 0) {
        fetchAllSilosHistoricalData();
      }
      if (isGeneralView) {
        setSelectedSilosForGraph(silos.map(silo => silo.id));
      }
    }
  }, [silos, viewMode, historicalData, isGeneralView, fetchAllSilosHistoricalData]);

  const fetchHistoricalData = useCallback(async (siloId) => {
    setLoadingHistory(true);
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${GLOBAL_CONFIG.API_BASE_URL}/inventory/silos/${siloId}/lecturas`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const formattedData = (data || []).map(item => {
          const utcDateString = item.timestamp.endsWith('Z') || item.timestamp.includes('+') ? item.timestamp : `${item.timestamp}Z`;
          return {
            ...item,
            timestamp: new Date(utcDateString)
          };
        });
        setHistoricalData(prev => ({ ...prev, [siloId]: formattedData }));
      } else {
        console.error("Error al cargar datos históricos");
        setHistoricalData(prev => ({ ...prev, [siloId]: [] }));
      }
    } catch (error) {
      console.error("Error de conexión al obtener datos históricos", error);
      setHistoricalData(prev => ({ ...prev, [siloId]: [] }));
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const handleSiloClick = (silo) => {
    setSelectedSilo(silo);
    fetchHistoricalData(silo.id);
    setShowModal(true);
  };

  const toggleGeneralView = () => {
    setIsGeneralView(prev => {
      const newState = !prev;
      if (newState) {
        setSelectedSilosForGraph(silos.map(silo => silo.id));
      } else {
        setSelectedSilosForGraph([]);
      }
      return newState;
    });
  };

  const handleSiloToggleForGraph = (siloId) => {
    if (isGeneralView) {
      setIsGeneralView(false);
      setSelectedSilosForGraph([siloId]);
      return;
    }

    setSelectedSilosForGraph(prevSelected => {
      const isSelected = prevSelected.includes(siloId);
      const newSelection = isSelected
        ? prevSelected.filter(id => id !== siloId)
        : [...prevSelected, siloId];

      if (newSelection.length === 0) {
        setIsGeneralView(true);
        setSelectedSilosForGraph(silos.map(silo => silo.id));
      }

      return newSelection;
    });
  };

  const getStatusText = (porcentaje) => {
    if (porcentaje >= 80) return 'Casi lleno';
    if (porcentaje >= 60) return 'Medio lleno';
    if (porcentaje >= 30) return 'Parcialmente lleno';
    return 'Bajo nivel';
  };

  const getStatusColor = (porcentaje) => {
    if (porcentaje >= 80) return '#ff4444';
    if (porcentaje >= 60) return '#ffaa00';
    if (porcentaje >= 30) return '#ffdd00';
    return '#44ff44';
  };

  const tableColumns = [
    { key: 'nombre', label: 'Nombre' },
    {
      key: 'nivel_actual_porcentaje',
      label: 'Nivel (%)',
      render: (value) => value !== undefined ? `${value.toFixed(1)}%` : '—'
    },
    {
      key: 'toneladas_actuales',
      label: 'Toneladas',
      render: (value) => value !== undefined ? `${value.toFixed(1)} ton` : '—'
    },
    {
      key: 'capacidad_maxima_toneladas',
      label: 'Capacidad Máx.',
      render: (value) => value !== undefined ? `${value} ton` : '—'
    },
    {
      key: 'status',
      label: 'Estado',
      render: (value, item) => (
        <span
          className="status-badge"
          style={{ backgroundColor: getStatusColor(item.nivel_actual_porcentaje) }}
        >
          {getStatusText(item.nivel_actual_porcentaje)}
        </span>
      )
    },
    {
      key: 'fecha_ultima_lectura',
      label: 'Última Lectura',
      render: (value) => formatDateForMexico(value)
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (value, item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSiloClick(item);
          }}
          className="details-btn"
        >
          Ver detalles
        </button>
      )
    }
  ];

  const getGraphData = () => {
    if (isGeneralView) {
      const allReadings = Object.values(historicalData).flat();
      const groupedByTimestamp = allReadings.reduce((acc, reading) => {
        const date = reading.timestamp;
        const dateKey = date.toLocaleString('es-MX', { year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'America/Mexico_City' });
        if (!acc[dateKey]) {
          acc[dateKey] = { timestamp: date, total: 0, count: 0 };
        }
        acc[dateKey].total += reading.porcentaje;
        acc[dateKey].count++;
        return acc;
      }, {});
      return Object.keys(groupedByTimestamp).map(dateKey => {
        const { timestamp, total, count } = groupedByTimestamp[dateKey];
        return {
          timestamp,
          porcentaje: total / count,
        };
      }).sort((a, b) => a.timestamp - b.timestamp);
    }

    const combinedDataMap = {};
    selectedSilosForGraph.forEach(siloId => {
      const silo = silos.find(s => s.id === siloId);
      const siloData = historicalData[siloId] || [];
      siloData.forEach(reading => {
        const dateKey = reading.timestamp.toISOString();
        if (!combinedDataMap[dateKey]) {
          combinedDataMap[dateKey] = { timestamp: reading.timestamp };
        }
        combinedDataMap[dateKey][silo.nombre] = reading.porcentaje;
      });
    });

    return Object.values(combinedDataMap).sort((a, b) => a.timestamp - b.timestamp);
  };

  if (loading) {
    return (
      <div className="silos-container loading-container">
        <div className="loading-spinner"></div>
        <p className="mt-3">Cargando silos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="silos-container">
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={fetchSilos} className="retry-btn">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="silos-container">
      <div className="silos-header">
        <h1>Gestión de Silos</h1>
        <p>Monitoreo en tiempo real del nivel de silos</p>
      </div>

      <div className="view-controls-container">
        <div className="view-controls">
          <button
            className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setViewMode('cards')}
          >
            <MdDashboard />
            Tarjetas
          </button>
          <button
            className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
          >
            <MdList />
            Tabla
          </button>
          <button
            className={`view-btn ${viewMode === 'graph' ? 'active' : ''}`}
            onClick={() => {
              setViewMode('graph');
              if (silos.length > 0 && Object.keys(historicalData).length === 0) {
                fetchAllSilosHistoricalData();
              }
            }}
          >
            <MdBarChart />
            Gráfica
          </button>
        </div>
        <button className="refresh-btn" onClick={requestReading} disabled={refreshing}>
          <MdSync />
          {refreshing ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {viewMode === 'cards' && (
        <div className="silos-grid">
          {silos.map(silo => (
            <div key={silo.id} onClick={() => handleSiloClick(silo)}>
              <SiloCard silo={{
                  ...silo,
                  fecha_ultima_lectura_display: formatDateForMexico(silo.fecha_ultima_lectura)
              }} />
            </div>
          ))}
        </div>
      )}

      {viewMode === 'table' && (
        <div className="table-container">
          <DataTable
            data={silos}
            columns={tableColumns}
            title="Lista de Silos"
            searchable={true}
            sortable={true}
            paginated={true}
            pageSize={10}
          />
        </div>
      )}

      {viewMode === 'graph' && (
        <div className="graph-view-container">
          <div className="silo-selector">
            <h4 className="subtitle">Comportamiento</h4>
            <label className={`silo-checkbox general-view-checkbox ${isGeneralView ? 'active' : ''}`}>
              <input
                type="checkbox"
                checked={isGeneralView}
                onChange={toggleGeneralView}
              />
              General
            </label>
            <div className="divider"></div>
            <h4 className="subtitle">Seleccionar Silos Individuales</h4>
            {silos.map(silo => (
              <label key={silo.id} className="silo-checkbox">
                <input
                  type="checkbox"
                  checked={selectedSilosForGraph.includes(silo.id)}
                  onChange={() => handleSiloToggleForGraph(silo.id)}
                />
                {silo.nombre}
              </label>
            ))}
          </div>
          <div className="silo-chart-outer">
            {loadingHistory ? (
              <div className="text-center loading-container">
                <div className="loading-spinner"></div>
                <p>Cargando historial de silos...</p>
              </div>
            ) : (
                <SiloHistoryChart
                  data={getGraphData()}
                  title={isGeneralView ? "Comportamiento General de HDPE" : "Comparación de Nivel de Silos"}
                  multiSilo={!isGeneralView}
                  isGeneralView={isGeneralView}
                  silos={silos}
                  selectedSilosForGraph={selectedSilosForGraph}
                />
            )}
          </div>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedSilo(null);
        }}
        title={`Detalles del Silo: ${selectedSilo?.nombre}`}
      >
        {selectedSilo && (
          <div className="silo-details">
            <div className="detail-row">
              <strong>Capacidad máxima:</strong> {selectedSilo.capacidad_maxima_toneladas} toneladas
            </div>
            <div className="detail-row">
              <strong>Altura total:</strong> {selectedSilo.altura_total_metros} metros
            </div>
            <div className="detail-row">
              <strong>Densidad del material:</strong> {selectedSilo.densidad_material} kg/m³
            </div>
            <div className="detail-row">
              <strong>Nivel actual:</strong> {selectedSilo.nivel_actual_porcentaje.toFixed(1)}%
            </div>
            <div className="detail-row">
              <strong>Toneladas actuales:</strong> {selectedSilo.toneladas_actuales.toFixed(1)} ton
            </div>
            <div className="detail-row">
              <strong>Estado:</strong>
              <span
                className="status-badge"
                style={{ backgroundColor: getStatusColor(selectedSilo.nivel_actual_porcentaje) }}
              >
                {getStatusText(selectedSilo.nivel_actual_porcentaje)}
              </span>
            </div>
            <div className="detail-row">
              <strong>Última lectura:</strong>
              {formatDateForMexico(selectedSilo.fecha_ultima_lectura)}
            </div>
            <div className="silo-chart-modal">
              <div className="silo-chart-bar-container-modal">
                <div
                  className="silo-chart-bar-modal"
                  style={{
                    height: `${selectedSilo.nivel_actual_porcentaje}%`,
                    backgroundColor: getStatusColor(selectedSilo.nivel_actual_porcentaje)
                  }}
                />
              </div>
            </div>

            <hr className="divider" />
            <h4 className="subtitle">Historial de Nivel</h4>
            {loadingHistory ? (
              <div className="text-center loading-container">
                <div className="loading-spinner"></div>
                <p>Cargando historial...</p>
              </div>
            ) : (
              <SiloHistoryChart
                data={historicalData[selectedSilo.id] || []}
                title="Historial de Nivel del Silo"
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Silos;