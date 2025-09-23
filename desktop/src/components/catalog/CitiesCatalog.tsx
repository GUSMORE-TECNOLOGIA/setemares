import React, { useState } from 'react';
import { MapPin, Globe, Edit2, Trash2, Plus } from 'lucide-react';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { useCities, useSupabaseCRUD } from '@/hooks/useSupabase';
import type { CityRow } from '@/types/db';

interface CityFormData {
  iata3: string;
  name: string;
  country: string;
  active: boolean;
}

export function CitiesCatalog() {
  const { 
    data: cities, 
    loading, 
    error, 
    total, 
    currentPage, 
    itemsPerPage, 
    totalPages,
    refetch, 
    changePage, 
    changeItemsPerPage 
  } = useCities();
  const { create, update, remove, loading: crudLoading } = useSupabaseCRUD<CityRow>('cities');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<CityRow | null>(null);
  const [formData, setFormData] = useState<CityFormData>({
    iata3: '',
    name: '',
    country: '',
    active: true
  });

  const columns = [
    {
      key: 'iata3' as keyof CityRow,
      label: 'IATA',
      width: '80px',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-brand" />
          <span className="font-mono font-semibold text-slate-100">{value}</span>
        </div>
      )
    },
    {
      key: 'name' as keyof CityRow,
      label: 'Nome da Cidade',
      sortable: true,
      render: (value: string) => (
        <div className="font-medium text-slate-100">{value}</div>
      )
    },
    {
      key: 'country' as keyof CityRow,
      label: 'País',
      width: '150px',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Globe size={14} className="text-slate-400" />
          <span className="text-slate-300">{value}</span>
        </div>
      )
    },
    {
      key: 'active' as keyof CityRow,
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
    setEditingCity(null);
    setFormData({
      iata3: '',
      name: '',
      country: '',
      active: true
    });
    setIsModalOpen(true);
  };

  const handleEdit = (city: CityRow) => {
    setEditingCity(city);
    setFormData({
      iata3: city.iata3,
      name: city.name,
      country: city.country,
      active: city.active
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (city: CityRow) => {
    if (confirm(`Tem certeza que deseja excluir a cidade ${city.iata3}?`)) {
      try {
        await remove(city.id);
        refetch();
      } catch (error) {
        console.error('Erro ao excluir cidade:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCity) {
        await update(editingCity.id, formData);
      } else {
        await create(formData);
      }
      
      setIsModalOpen(false);
      refetch();
    } catch (error) {
      console.error('Erro ao salvar cidade:', error);
    }
  };

  const handleInputChange = (field: keyof CityFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (error) {
    return (
      <div className="glass-card p-6">
        <div className="text-center">
          <div className="text-red-400 mb-2">❌ Erro ao carregar cidades</div>
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
            <h1 className="text-2xl font-bold text-slate-100">Cidades</h1>
            <p className="text-slate-400">Gerencie o catálogo de cidades • {total.toLocaleString()} itens</p>
          </div>
        </div>

        <Table
          data={cities}
          columns={columns}
          loading={loading}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          searchPlaceholder="Buscar por IATA, nome ou país..."
          emptyMessage="Nenhuma cidade encontrada"
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCity ? 'Editar Cidade' : 'Nova Cidade'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Código IATA *
            </label>
            <input
              type="text"
              value={formData.iata3}
              onChange={(e) => handleInputChange('iata3', e.target.value.toUpperCase())}
              className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/40"
              placeholder="SAO"
              maxLength={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Nome da Cidade *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/40"
              placeholder="São Paulo"
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

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => handleInputChange('active', e.target.checked)}
              className="w-4 h-4 text-brand bg-slate-800 border-white/10 rounded focus:ring-brand/40 focus:ring-2"
            />
            <label htmlFor="active" className="text-sm text-slate-200">
              Cidade ativa
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
                  {editingCity ? 'Atualizar' : 'Criar'}
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
