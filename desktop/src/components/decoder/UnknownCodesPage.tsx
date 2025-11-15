import { useState, useEffect } from 'react';
import { AlertCircle, Search, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Table } from '../ui/Table';
import { CodeCorrectionModal } from './CodeCorrectionModal';
import { decoderV2, UnknownCodeData } from '../../lib/decoder-v2';

export function UnknownCodesPage() {
  const [unknownCodes, setUnknownCodes] = useState<UnknownCodeData[]>([]);
  const [filteredCodes, setFilteredCodes] = useState<UnknownCodeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResolved, setFilterResolved] = useState<'all' | 'resolved' | 'unresolved'>('unresolved');
  const [correctionModal, setCorrectionModal] = useState<{
    isOpen: boolean;
    code: string;
  }>({ isOpen: false, code: '' });

  // Carregar códigos desconhecidos
  const loadUnknownCodes = async () => {
    setIsLoading(true);
    try {
      const codes = decoderV2.getUnknownCodes();
      setUnknownCodes(codes);
    } catch (error) {
      console.error('❌ Erro ao carregar códigos desconhecidos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar códigos
  useEffect(() => {
    let filtered = unknownCodes;

    // Filtro por status
    if (filterResolved === 'resolved') {
      filtered = filtered.filter(code => code.resolved);
    } else if (filterResolved === 'unresolved') {
      filtered = filtered.filter(code => !code.resolved);
    }

    // Filtro por busca
    if (searchTerm.trim()) {
      filtered = filtered.filter(code =>
        code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (code.context && code.context.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredCodes(filtered);
  }, [unknownCodes, searchTerm, filterResolved]);

  // Carregar dados iniciais
  useEffect(() => {
    loadUnknownCodes();
  }, []);

  // Resolver código
  const handleCodeResolved = (code: string) => {
    // Atualizar lista local
    setUnknownCodes(prev => 
      prev.map(item => 
        item.code === code 
          ? { ...item, resolved: true }
          : item
      )
    );
  };

  // Estatísticas
  const stats = {
    total: unknownCodes.length,
    resolved: unknownCodes.filter(c => c.resolved).length,
    unresolved: unknownCodes.filter(c => !c.resolved).length,
    highAttempts: unknownCodes.filter(c => c.attempts >= 5).length
  };

  const getStatusBadge = (code: UnknownCodeData) => {
    if (code.resolved) {
      return <Badge variant="success">Resolvido</Badge>;
    }
    if (code.attempts >= 5) {
      return <Badge variant="error">Crítico</Badge>;
    }
    if (code.attempts >= 3) {
      return <Badge variant="warning">Alto</Badge>;
    }
    return <Badge variant="default">Baixo</Badge>;
  };

  const getPriorityColor = (attempts: number) => {
    if (attempts >= 5) return 'text-red-400';
    if (attempts >= 3) return 'text-yellow-400';
    return 'text-slate-400';
  };

  const columns = [
    {
      key: 'code' as keyof UnknownCodeData,
      label: 'Código',
      render: (_value: unknown, code: UnknownCodeData) => (
        <span className="font-mono font-bold text-slate-200">{code.code}</span>
      )
    },
    {
      key: 'context' as keyof UnknownCodeData,
      label: 'Contexto',
      render: (_value: unknown, code: UnknownCodeData) => (
        <span className="text-slate-300">{code.context || '—'}</span>
      )
    },
    {
      key: 'attempts' as keyof UnknownCodeData,
      label: 'Tentativas',
      render: (_value: unknown, code: UnknownCodeData) => (
        <span className={`font-bold ${getPriorityColor(code.attempts)}`}>
          {code.attempts}
        </span>
      )
    },
    {
      key: 'last_attempt' as keyof UnknownCodeData,
      label: 'Última Tentativa',
      render: (_value: unknown, code: UnknownCodeData) => (
        <span className="text-slate-400">
          {new Date(code.last_attempt).toLocaleDateString('pt-BR')}
        </span>
      )
    },
    {
      key: 'resolved' as keyof UnknownCodeData,
      label: 'Status',
      render: (_value: unknown, code: UnknownCodeData) => getStatusBadge(code)
    },
    {
      key: 'code' as keyof UnknownCodeData, // Reutilizar 'code' para actions
      label: 'Ações',
      render: (_value: unknown, code: UnknownCodeData) => (
        <div className="flex gap-2">
          {!code.resolved && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCorrectionModal({ isOpen: true, code: code.code })}
              className="text-amber-400 border-amber-400 hover:bg-amber-400/10"
            >
              Corrigir
            </Button>
          )}
        </div>
      )
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-200">Pendências de Códigos</h1>
          <p className="text-slate-400">
            Códigos não reconhecidos pelo sistema de decodificação
          </p>
        </div>
        <Button
          onClick={loadUnknownCodes}
          variant="outline"
          className="text-slate-300 border-slate-600 hover:bg-slate-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-slate-200">{stats.total}</div>
          <div className="text-sm text-slate-400">Total</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-400">{stats.unresolved}</div>
          <div className="text-sm text-slate-400">Pendentes</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-400">{stats.resolved}</div>
          <div className="text-sm text-slate-400">Resolvidos</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-400">{stats.highAttempts}</div>
          <div className="text-sm text-slate-400">Críticos</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código ou contexto..."
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterResolved === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterResolved('all')}
          >
            Todos
          </Button>
          <Button
            variant={filterResolved === 'unresolved' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterResolved('unresolved')}
          >
            Pendentes
          </Button>
          <Button
            variant={filterResolved === 'resolved' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterResolved('resolved')}
          >
            Resolvidos
          </Button>
        </div>
      </div>

      {/* Tabela */}
      {filteredCodes.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-200 mb-2">
            Nenhum código encontrado
          </h3>
          <p className="text-slate-400">
            {searchTerm || filterResolved !== 'all' 
              ? 'Tente ajustar os filtros de busca.'
              : 'Todos os códigos foram resolvidos! 🎉'
            }
          </p>
        </div>
      ) : (
        <div className="bg-slate-800/50 rounded-lg border border-slate-700">
          <Table
            data={filteredCodes}
            columns={columns}
            className="w-full"
          />
        </div>
      )}

      {/* Modal de Correção */}
      <CodeCorrectionModal
        isOpen={correctionModal.isOpen}
        onClose={() => setCorrectionModal({ isOpen: false, code: '' })}
        unknownCode={correctionModal.code}
        onResolved={handleCodeResolved}
      />
    </div>
  );
}
