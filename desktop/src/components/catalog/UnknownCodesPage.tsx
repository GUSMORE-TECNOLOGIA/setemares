import React, { useState } from 'react';
import { AlertTriangle, Search, Clock, CheckCircle } from 'lucide-react';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { useUnknownCodes, useSupabaseCRUD } from '@/hooks/useSupabase';
import type { CodeUnknownRow } from '@/types/db';

export function UnknownCodesPage() {
  const { data: unknownCodes, loading, error, refetch } = useUnknownCodes();
  const { update, loading: crudLoading } = useSupabaseCRUD<CodeUnknownRow>('codes_unknown');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState<CodeUnknownRow | null>(null);

  const columns = [
    {
      key: 'code' as keyof CodeUnknownRow,
      label: 'Código',
      width: '120px',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-yellow-500" />
          <span className="font-mono font-semibold text-slate-100">{value}</span>
        </div>
      )
    },
    {
      key: 'context' as keyof CodeUnknownRow,
      label: 'Contexto',
      sortable: false,
      render: (value: any) => (
        <div className="text-sm text-slate-300">
          {value ? (
            <div className="space-y-1">
              {value.line && (
                <div>Linha: {value.line}</div>
              )}
              {value.pnr && (
                <div className="font-mono text-xs">PNR: {value.pnr.substring(0, 50)}...</div>
              )}
              {value.carrier && (
                <div>Cia: {value.carrier}</div>
              )}
            </div>
          ) : (
            <span className="text-slate-500">Sem contexto</span>
          )}
        </div>
      )
    },
    {
      key: 'seen_at' as keyof CodeUnknownRow,
      label: 'Visto em',
      width: '150px',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-slate-400" />
          <span className="text-slate-300 text-sm">
            {new Date(value).toLocaleString('pt-BR')}
          </span>
        </div>
      )
    },
    {
      key: 'resolved' as keyof CodeUnknownRow,
      label: 'Status',
      width: '120px',
      sortable: true,
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'warning'} size="sm">
          {value ? 'Resolvido' : 'Pendente'}
        </Badge>
      )
    }
  ];

  const handleResolve = (code: CodeUnknownRow) => {
    setSelectedCode(code);
    setIsModalOpen(true);
  };

  const handleMarkResolved = async () => {
    if (!selectedCode) return;
    
    try {
      await update(selectedCode.id, { resolved: true });
      setIsModalOpen(false);
      refetch();
    } catch (error) {
      console.error('Erro ao marcar como resolvido:', error);
    }
  };

  const handleDelete = async (code: CodeUnknownRow) => {
    if (confirm(`Tem certeza que deseja excluir o código ${code.code}?`)) {
      try {
        // Implementar delete se necessário
        console.log('Deletar código:', code.code);
      } catch (error) {
        console.error('Erro ao excluir código:', error);
      }
    }
  };

  const pendingCount = unknownCodes.filter(code => !code.resolved).length;
  const resolvedCount = unknownCodes.filter(code => code.resolved).length;

  if (error) {
    return (
      <div className="glass-card p-6">
        <div className="text-center">
          <div className="text-red-400 mb-2">❌ Erro ao carregar códigos desconhecidos</div>
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
        {/* Header com estatísticas */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-yellow-500/20 rounded-xl">
            <AlertTriangle className="text-yellow-500" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Códigos Desconhecidos</h1>
            <p className="text-slate-400">Gerencie códigos que não foram reconhecidos</p>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <AlertTriangle className="text-yellow-500" size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-100">{pendingCount}</div>
                <div className="text-sm text-slate-400">Pendentes</div>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="text-green-500" size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-100">{resolvedCount}</div>
                <div className="text-sm text-slate-400">Resolvidos</div>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Search className="text-blue-500" size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-100">{unknownCodes.length}</div>
                <div className="text-sm text-slate-400">Total</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <Table
          data={unknownCodes}
          columns={columns}
          loading={loading}
          onEdit={handleResolve}
          onDelete={handleDelete}
          searchPlaceholder="Buscar por código..."
          emptyMessage="Nenhum código desconhecido encontrado"
        />
      </div>

      {/* Modal de resolução */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Resolver Código Desconhecido"
        size="lg"
      >
        {selectedCode && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <h3 className="font-semibold text-slate-100 mb-2">Código: {selectedCode.code}</h3>
              <div className="text-sm text-slate-300">
                <div>Visto em: {new Date(selectedCode.seen_at).toLocaleString('pt-BR')}</div>
                {selectedCode.context && (
                  <div className="mt-2">
                    <div className="font-medium mb-1">Contexto:</div>
                    <pre className="text-xs bg-slate-900/50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(selectedCode.context, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-yellow-500 mt-0.5" size={16} />
                <div>
                  <div className="font-medium text-yellow-300 mb-1">Como resolver:</div>
                  <div className="text-sm text-slate-300">
                    1. Identifique o tipo de código (aeroporto, cidade, companhia)<br/>
                    2. Encontre o código correto no catálogo<br/>
                    3. Crie um override para mapear o código<br/>
                    4. Marque como resolvido
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn btn-outline"
              >
                Cancelar
              </button>
              <button
                onClick={handleMarkResolved}
                disabled={crudLoading}
                className="btn btn-primary flex items-center gap-2"
              >
                {crudLoading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                    Marcando...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Marcar como Resolvido
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
