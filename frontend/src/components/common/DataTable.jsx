import React from 'react';
import './DataTable.css';

const DataTable = ({
  data = [],
  columns = [],
  searchable = true,
  sortable = true,
  paginated,
  pagination,
  pageSize = 10,
  title = '',
  actions = null,
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortBy, setSortBy] = React.useState(null);
  const [sortOrder, setSortOrder] = React.useState('asc');
  const [currentPage, setCurrentPage] = React.useState(1);
  const usePaginated = paginated || pagination;

  const safeData = React.useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.filter(row => row && typeof row === 'object');
  }, [data]);

  const filteredData = React.useMemo(() => {
    if (!searchable || !searchTerm) return safeData;
    const lower = searchTerm.toLowerCase();
    return safeData.filter(row =>
      columns.some(col => {
        const value = row[col.key];
        return value && value.toString().toLowerCase().includes(lower);
      })
    );
  }, [safeData, columns, searchTerm, searchable]);

  const sortedData = React.useMemo(() => {
    if (!sortable || !sortBy) return filteredData;
    return [...filteredData].sort((a, b) => {
      const va = a[sortBy];
      const vb = b[sortBy];
      if (va === vb) return 0;
      if (sortOrder === 'asc') return va > vb ? 1 : -1;
      return va < vb ? 1 : -1;
    });
  }, [filteredData, sortBy, sortOrder, sortable]);

  const totalPages = usePaginated ? Math.ceil(sortedData.length / pageSize) : 1;
  let paginatedData = usePaginated
    ? sortedData && Array.isArray(sortedData)
      ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
      : []
    : Array.isArray(sortedData) ? sortedData : [];

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (key) => {
    if (sortBy !== key) return '↕';
    return sortOrder === 'asc' ? '▲' : '▼';
  };

  // Función helper para renderizar el contenido de la celda de manera segura
  const renderCellContent = (col, row) => {
    if (!row || typeof row !== 'object') {
      return '—';
    }

    if (col.render) {
      try {
        // CORRECCIÓN: Intentar con la firma de 2 argumentos (value, row)
        return col.render(row[col.key], row);
      } catch (error) {
        // Si falla, es posible que la función solo espere 1 argumento (value)
        try {
          return col.render(row[col.key]);
        } catch (e) {
          // Si ambos fallan, devolvemos un valor por defecto
          console.error('Error rendering cell with both function signatures:', e, { col, row });
          return '—';
        }
      }
    }

    // Si no hay función render, mostrar el valor directamente
    return row && typeof row[col.key] !== 'undefined' ? row[col.key] : '—';
  };

  return (
    <div className="data-table-container rounded-xl shadow-lg p-4 border">
      {title && <h3 className="table-title">{title}</h3>}
      <div className="table-wrapper overflow-x-auto rounded-md border">
        <table className="data-table w-full border-collapse font-sans text-sm">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={col.sortable ? 'table-header sortable' : 'table-header'}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="header-content">
                    {col.label}
                    {col.sortable && (
                      <span className="sort-icon" aria-hidden="true">
                        {getSortIcon(col.key)}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="no-data">
                  No hay datos para mostrar
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => {
                if (!row || typeof row !== 'object') {
                  return (
                    <tr key={`invalid-${idx}`} className="table-row">
                      <td colSpan={columns.length} className="table-cell" style={{ color: '#999' }}>
                        Fila de datos inválida
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={row.id || row.code || idx} className="table-row">
                    {columns.map((col) => (
                      <td key={col.key} className="table-cell">
                        {renderCellContent(col, row)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {usePaginated && totalPages > 1 && (
        <div className="table-footer flex items-center justify-center gap-4 mt-4">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </button>
          <span className="results-info mx-2">
            Página {currentPage} de {totalPages}
          </span>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </button>
        </div>
      )}
      {searchable && (
        <div className="search-container mt-4 max-w-xs">
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={e => {
              setCurrentPage(1);
              setSearchTerm(e.target.value);
            }}
            className="search-input"
          />
        </div>
      )}
      {actions && <div className="table-actions mt-4 flex gap-4 items-center">{actions}</div>}
    </div>
  );
};

export default DataTable;