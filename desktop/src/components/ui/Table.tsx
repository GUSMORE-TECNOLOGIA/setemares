import React from 'react';
import { ChevronUp, ChevronDown, Search, Plus, Edit2, Trash2, X } from 'lucide-react';

interface Column<T> {
  key: keyof T;
  label: string;
  width?: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  onAdd?: () => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function Table<T extends Record<string, any>>({
  data,
  columns,
  searchable = true,
  searchPlaceholder = "Buscar...",
  onSearch,
  onAdd,
  onEdit,
  onDelete,
  loading = false,
  emptyMessage = "Nenhum item encontrado",
  className = ""
}: TableProps<T>) {
  const [sortField, setSortField] = React.useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [pendingSearch, setPendingSearch] = React.useState('');

  const handleSort = (field: keyof T) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSearch = (query: string) => {
    setPendingSearch(query);
  };

  const executeSearch = () => {
    setSearchQuery(pendingSearch);
    onSearch?.(pendingSearch);
  };

  const clearSearch = () => {
    setPendingSearch('');
    setSearchQuery('');
    onSearch?.('');
  };

  // Filtrar dados por busca (apenas se não há busca no backend)
  const filteredData = React.useMemo(() => {
    // Se há callback onSearch, significa que a busca é feita no backend
    // Então não aplicar filtro local
    if (onSearch) return data;
    
    // Se não há callback onSearch, aplicar busca local
    if (!searchQuery.trim()) return data;
    
    const query = searchQuery.toLowerCase().trim();
    return data.filter(row => {
      // Buscar em todos os campos string do objeto
      return Object.values(row).some(value => {
        if (typeof value === 'string') {
          return value.toLowerCase().includes(query);
        }
        return false;
      });
    });
  }, [data, searchQuery, onSearch]);

  const sortedData = React.useMemo(() => {
    if (!sortField) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortField, sortDirection]);

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded w-1/4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-white/5 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass-card ${className}`}>
      {/* Header com busca e ações */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-100">
            {sortedData.length} {sortedData.length === 1 ? 'item' : 'itens'}
            {searchQuery.trim() && onSearch && (
              <span className="text-slate-400 text-sm font-normal ml-2">
                encontrado{searchQuery.trim() && ` para "${searchQuery}"`}
              </span>
            )}
            {searchQuery.trim() && !onSearch && sortedData.length !== data.length && (
              <span className="text-slate-400 text-sm font-normal ml-2">
                (de {data.length} total)
              </span>
            )}
          </h3>
          {onAdd && (
            <button
              onClick={onAdd}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus size={16} />
              Adicionar
            </button>
          )}
        </div>
        
        {searchable && (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={pendingSearch}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && executeSearch()}
                className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/40"
              />
            </div>
            <button
              onClick={executeSearch}
              className="px-4 py-2 bg-brand hover:bg-brand/80 text-white rounded-lg transition-colors duration-150 flex items-center gap-2"
              title="Buscar"
            >
              <Search size={16} />
              Buscar
            </button>
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors duration-150 flex items-center gap-2"
                title="Limpar busca"
              >
                <X size={16} />
                Limpar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:text-slate-200' : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && (
                      <div className="flex flex-col">
                        <ChevronUp 
                          size={12} 
                          className={`${
                            sortField === column.key && sortDirection === 'asc' 
                              ? 'text-brand' : 'text-slate-500'
                          }`} 
                        />
                        <ChevronDown 
                          size={12} 
                          className={`${
                            sortField === column.key && sortDirection === 'desc' 
                              ? 'text-brand' : 'text-slate-500'
                          }`} 
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedData.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                  className="px-6 py-12 text-center text-slate-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row, index) => (
                <tr 
                  key={index} 
                  className="hover:bg-white/5 transition-colors duration-150"
                >
                  {columns.map((column) => (
                    <td key={String(column.key)} className="px-6 py-4 text-sm text-slate-200">
                      {column.render 
                        ? column.render(row[column.key], row)
                        : String(row[column.key] || '-')
                      }
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="p-2 text-slate-400 hover:text-brand transition-colors duration-150"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className="p-2 text-slate-400 hover:text-red-400 transition-colors duration-150"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
