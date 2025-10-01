import React, { useState } from 'react';
import { MapPin, Plane, Globe, Edit2, Trash2, Plus } from 'lucide-react';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { useAirports, useSupabaseCRUD } from '@/hooks/useSupabase';
import type { AirportRow } from '@/types/db';

interface AirportFormData {
  iata3: string;
  icao4?: string;
  name: string;
  city_iata: string;
  country: string;
  active?: boolean;
}

export function AirportsCatalog() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const { 
    data: airports, 
    loading, 
    error, 
    total, 
    currentPage, 
    itemsPerPage, 
    totalPages,
    refetch, 
    changePage, 
    changeItemsPerPage 
  } = useAirports({ search: searchQuery });
  const { create, update, remove, loading: crudLoading } = useSupabaseCRUD<AirportRow>('airports');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAirport, setEditingAirport] = useState<AirportRow | null>(null);
  const [formData, setFormData] = useState<AirportFormData>({
    iata3: '',
    icao4: '',
    name: '',
    city_iata: '',
    country: '',
    active: true
  });

  const columns = [
    {
      key: 'iata3' as keyof AirportRow,
      label: 'IATA',
      width: '80px',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Plane size={16} className="text-brand" />
          <span className="font-mono font-semibold text-slate-100">{value}</span>
        </div>
      )
    },
    {
      key: 'icao4' as keyof AirportRow,
      label: 'ICAO',
      width: '80px',
      sortable: true,
      render: (value: string) => (
        <span className="font-mono text-slate-300">{value || '-'}</span>
      )
    },
    {
      key: 'name' as keyof AirportRow,
      label: 'Nome',
      sortable: true,
      render: (value: string) => (
        <div className="font-medium text-slate-100">{value}</div>
      )
    },
    {
      key: 'city_iata' as keyof AirportRow,
      label: 'Cidade',
      width: '100px',
      sortable: true,
      render: (value: string) => (
        <Badge variant="info" size="sm">{value}</Badge>
      )
    },
    {
      key: 'country' as keyof AirportRow,
      label: 'País',
      width: '120px',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-1">
          <Globe size={14} className="text-slate-400" />
          <span className="text-slate-300">{value}</span>
        </div>
      )
    },
    {
      key: 'active' as keyof AirportRow,
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
    setEditingAirport(null);
    setFormData({
      iata3: '',
      icao4: '',
      name: '',
      city_iata: '',
      country: '',
      active: true
    });
    setIsModalOpen(true);
  };

  const handleEdit = (airport: AirportRow) => {
    setEditingAirport(airport);
    setFormData({
      iata3: airport.iata3,
      icao4: airport.icao4 || '',
      name: airport.name,
      city_iata: airport.city_iata,
      country: airport.country,
      active: airport.active
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (airport: AirportRow) => {
    if (confirm(`Tem certeza que deseja excluir o aeroporto ${airport.iata3}?`)) {
      try {
        await remove(airport.id);
        refetch();
      } catch (error) {
        console.error('Erro ao excluir aeroporto:', error);
      }
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAirport) {
        await update(editingAirport.id, formData);
      } else {
        await create(formData);
      }
      
      setIsModalOpen(false);
      refetch();
    } catch (error) {
      console.error('Erro ao salvar aeroporto:', error);
    }
  };

  const handleInputChange = (field: keyof AirportFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (error) {
    return (
      <div className="glass-card p-6">
        <div className="text-center">
          <div className="text-red-400 mb-2">❌ Erro ao carregar aeroportos</div>
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
            <MapPin className="text-brand" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Aeroportos</h1>
            <p className="text-slate-400">Gerencie o catálogo de aeroportos • {total.toLocaleString()} itens</p>
          </div>
        </div>

        <Table
          data={airports}
          columns={columns}
          loading={loading}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSearch={handleSearch}
          searchPlaceholder="Buscar por IATA, ICAO, nome ou país..."
          emptyMessage="Nenhum aeroporto encontrado"
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAirport ? 'Editar Aeroporto' : 'Novo Aeroporto'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Código IATA *
              </label>
              <input
                type="text"
                value={formData.iata3}
                onChange={(e) => handleInputChange('iata3', e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/40"
                placeholder="GRU"
                maxLength={3}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Código ICAO
              </label>
              <input
                type="text"
                value={formData.icao4}
                onChange={(e) => handleInputChange('icao4', e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/40"
                placeholder="SBGR"
                maxLength={4}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Nome do Aeroporto *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/40"
              placeholder="Guarulhos International Airport"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Cidade (IATA) *
              </label>
              <input
                type="text"
                value={formData.city_iata}
                onChange={(e) => handleInputChange('city_iata', e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/40"
                placeholder="SAO"
                maxLength={3}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                País *
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/40"
                placeholder="Brazil"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Fuso Horário
            </label>
            <input
              type="text"
              value={formData.tz}
              onChange={(e) => handleInputChange('tz', e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/40"
              placeholder="America/Sao_Paulo"
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
              Aeroporto ativo
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
                  {editingAirport ? 'Atualizar' : 'Criar'}
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Paginação - apenas quando não há busca */}
      {!searchQuery.trim() && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={total}
          itemsPerPage={itemsPerPage}
          onPageChange={changePage}
          onItemsPerPageChange={changeItemsPerPage}
        />
      )}
    </>
  );
}
