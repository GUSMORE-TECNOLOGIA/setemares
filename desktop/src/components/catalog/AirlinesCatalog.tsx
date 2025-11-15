import React, { useState } from 'react';
import { Plane, Globe, Plus } from 'lucide-react';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { useAirlines, useSupabaseCRUD } from '@/hooks/useSupabase';
import { airlineSchema } from '@/lib/validations/airline';
import { z } from 'zod';
import type { AirlineRow } from '@/types/db';

interface AirlineFormData {
  iata2: string;
  icao3?: string;
  name: string;
  country?: string;
  active: boolean;
}

export function AirlinesCatalog() {
  const { 
    data: airlines, 
    loading, 
    error, 
    total, 
    currentPage, 
    itemsPerPage, 
    totalPages,
    refetch, 
    changePage, 
    changeItemsPerPage 
  } = useAirlines();
  const { create, update, remove, loading: crudLoading } = useSupabaseCRUD<AirlineRow>('airlines');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAirline, setEditingAirline] = useState<AirlineRow | null>(null);
  const [formData, setFormData] = useState<AirlineFormData>({
    iata2: '',
    icao3: '',
    name: '',
    country: '',
    active: true
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const columns = [
    {
      key: 'iata2' as keyof AirlineRow,
      label: 'IATA',
      width: '80px',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Plane size={16} className="text-brand" />
          <span className="font-mono font-semibold text-slate-100">
            {value || '—'}
          </span>
        </div>
      )
    },
    {
      key: 'icao3' as keyof AirlineRow,
      label: 'ICAO',
      width: '80px',
      sortable: true,
      render: (value: string) => (
        <span className="font-mono text-slate-300">
          {value || '—'}
        </span>
      )
    },
    {
      key: 'name' as keyof AirlineRow,
      label: 'Nome da Companhia',
      sortable: true,
      render: (value: string) => (
        <div className="font-medium text-slate-100">{value}</div>
      )
    },
    {
      key: 'country' as keyof AirlineRow,
      label: 'País',
      width: '150px',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Globe size={14} className="text-slate-400" />
          <span className="text-slate-300">{value || '-'}</span>
        </div>
      )
    },
    {
      key: 'active' as keyof AirlineRow,
      label: 'Status',
      width: '100px',
      sortable: true,
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'error'} size="sm">
          {value ? 'Ativo' : 'Inativo'}
        </Badge>
      )
    }
  ];

  const handleAdd = () => {
    setEditingAirline(null);
    setFormData({
      iata2: '',
      icao3: '',
      name: '',
      country: '',
      active: true
    });
    setIsModalOpen(true);
  };

  const handleEdit = (airline: AirlineRow) => {
    setEditingAirline(airline);
    setFormData({
      iata2: airline.iata2,
      icao3: airline.icao3 || '',
      name: airline.name,
      country: airline.country || '',
      active: airline.active
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (airline: AirlineRow) => {
    if (confirm(`Tem certeza que deseja excluir a companhia ${airline.iata2}?`)) {
      try {
        await remove(airline.id);
        refetch();
      } catch (error) {
        console.error('Erro ao excluir companhia:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validar dados com Zod
      const validatedData = airlineSchema.parse(formData);
      
      if (editingAirline) {
        await update(editingAirline.id, validatedData);
      } else {
        await create(validatedData);
      }
      
      setIsModalOpen(false);
      refetch();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Mostrar erros de validação
        const firstError = error.issues[0];
        alert(`Erro de validação: ${firstError.message}`);
      } else {
        console.error('Erro ao salvar companhia:', error);
        alert('Erro ao salvar companhia. Tente novamente.');
      }
    }
  };

  const handleInputChange = (field: keyof AirlineFormData, value: string | boolean) => {
    const newFormData = {
      ...formData,
      [field]: value
    };
    
    setFormData(newFormData);
    
    // Validação em tempo real
    try {
      airlineSchema.parse(newFormData);
      setValidationErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as string] = err.message;
          }
        });
        setValidationErrors(errors);
      }
    }
  };

  if (error) {
    return (
      <div className="glass-card p-6">
        <div className="text-center">
          <div className="text-red-400 mb-2">❌ Erro ao carregar companhias</div>
          <div className="text-slate-400 text-sm">{error}</div>
          <button 
            onClick={refetch}
            className="btn btn-outline mt-4"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand/20 rounded-xl">
            <Plane className="text-brand" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Companhias Aéreas</h1>
            <p className="text-slate-400">Gerencie o catálogo de companhias aéreas • {total.toLocaleString()} itens</p>
          </div>
        </div>

        <Table
          data={airlines}
          columns={columns}
          loading={loading}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          searchPlaceholder="Buscar por IATA, ICAO, nome ou país..."
          emptyMessage="Nenhuma companhia encontrada"
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAirline ? 'Editar Companhia' : 'Nova Companhia'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Código IATA
              </label>
              <input
                type="text"
                value={formData.iata2}
                onChange={(e) => handleInputChange('iata2', e.target.value.toUpperCase())}
                className={`w-full px-3 py-2 bg-slate-800/50 border rounded-lg text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                  validationErrors.iata2 
                    ? 'border-red-500 focus:ring-red-500/40' 
                    : 'border-white/10 focus:ring-brand/40 focus:border-brand/40'
                }`}
                placeholder="LA (opcional)"
                maxLength={2}
              />
              {validationErrors.iata2 && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.iata2}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Código ICAO
              </label>
              <input
                type="text"
                value={formData.icao3}
                onChange={(e) => handleInputChange('icao3', e.target.value.toUpperCase())}
                className={`w-full px-3 py-2 bg-slate-800/50 border rounded-lg text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                  validationErrors.icao3 
                    ? 'border-red-500 focus:ring-red-500/40' 
                    : 'border-white/10 focus:ring-brand/40 focus:border-brand/40'
                }`}
                placeholder="LAN (opcional)"
                maxLength={3}
              />
              {validationErrors.icao3 && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.icao3}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Nome da Companhia *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/40"
              placeholder="LATAM Airlines"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              País
            </label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/40"
              placeholder="Chile"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => handleInputChange('active', e.target.checked)}
              className="w-4 h-4 text-brand bg-slate-800 border-white/10 rounded focus:ring-brand/40 focus:ring-2"
            />
            <label htmlFor="active" className="text-sm text-slate-200">
              Companhia ativa
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-outline"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={crudLoading}
              className="btn btn-primary flex items-center gap-2"
            >
              {crudLoading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  Salvando...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  {editingAirline ? 'Atualizar' : 'Criar'}
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Paginação */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={total}
        itemsPerPage={itemsPerPage}
        onPageChange={changePage}
        onItemsPerPageChange={changeItemsPerPage}
      />
    </>
  );
}
