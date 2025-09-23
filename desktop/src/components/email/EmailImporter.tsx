// EMAIL-MULTI-002: Componente para importar e-mail com múltiplas opções
import React, { useState } from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { parseEmailToOptions, ParsedEmail, ParsedOption } from '../../lib/email-parser';

interface EmailImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (parsedEmail: ParsedEmail) => void;
}

export function EmailImporter({ isOpen, onClose, onImport }: EmailImporterProps) {
  const [emailText, setEmailText] = useState('');
  const [parsedEmail, setParsedEmail] = useState<ParsedEmail | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async () => {
    if (!emailText.trim()) {
      setError('Por favor, cole o conteúdo do e-mail');
      return;
    }

    setIsParsing(true);
    setError(null);

    try {
      const parsed = parseEmailToOptions(emailText);
      setParsedEmail(parsed);
      console.log('📧 E-mail parseado:', parsed);
    } catch (err) {
      console.error('❌ Erro ao parsear e-mail:', err);
      setError('Erro ao processar o e-mail. Verifique o formato.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = () => {
    if (parsedEmail) {
      onImport(parsedEmail);
      handleClose();
    }
  };

  const handleClose = () => {
    setEmailText('');
    setParsedEmail(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-600 max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-600">
          <div className="flex items-center gap-3">
            <Upload className="w-6 h-6 text-brand" />
            <div>
              <h2 className="text-xl font-semibold text-slate-100">Importar PNR/E-mail</h2>
              <p className="text-sm text-slate-400">Cole o e-mail completo para gerar múltiplas opções</p>
            </div>
          </div>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Textarea para e-mail */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Conteúdo do E-mail
            </label>
            <textarea
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              placeholder="Cole aqui o conteúdo completo do e-mail recebido da consolidadora..."
              className="w-full h-64 p-4 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-500">
                {emailText.length} caracteres
              </span>
              <Button
                onClick={handleParse}
                disabled={!emailText.trim() || isParsing}
                className="bg-brand hover:bg-brand/90"
              >
                {isParsing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Processando...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Processar E-mail
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-300">{error}</span>
            </div>
          )}

          {/* Preview das opções */}
          {parsedEmail && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-semibold text-slate-100">
                  Preview das Opções ({parsedEmail.options.length})
                </h3>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {parsedEmail.options.map((option, optionIndex) => (
                  <OptionPreview
                    key={optionIndex}
                    option={option}
                    optionIndex={optionIndex}
                  />
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-600">
                <Button
                  onClick={handleClose}
                  variant="outline"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleImport}
                  className="bg-brand hover:bg-brand/90"
                >
                  Importar Opções
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente para preview de cada opção
function OptionPreview({ option, optionIndex }: { option: ParsedOption; optionIndex: number }) {
  return (
    <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-slate-100">{option.label}</h4>
        <div className="text-sm text-slate-400">
          {option.segments.length} segmento(s) • {option.fares.length} categoria(s)
        </div>
      </div>

      {/* Segmentos */}
      {option.segments.length > 0 && (
        <div className="mb-3">
          <div className="text-sm font-medium text-slate-300 mb-2">Segmentos:</div>
          <div className="space-y-1">
            {option.segments.map((segment, idx) => (
              <div key={idx} className="text-sm text-slate-400">
                {segment.carrier} {segment.flight} • {segment.depAirport} → {segment.arrAirport}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categorias de tarifa */}
      {option.fares.length > 0 && (
        <div className="mb-3">
          <div className="text-sm font-medium text-slate-300 mb-2">Categorias:</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {option.fares.map((fare, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-slate-600/50 rounded">
                <div className="w-3 h-3 border border-slate-400 rounded-sm bg-slate-700" />
                <span className="text-sm text-slate-300">
                  {fare.fareClass} {fare.paxType !== 'ADT' && `(${fare.paxType})`}
                </span>
                <span className="text-xs text-slate-400">
                  USD {fare.baseFare.toFixed(2)} + {fare.baseTaxes.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagamento */}
      {option.paymentTerms && (
        <div className="mb-3">
          <div className="text-sm font-medium text-slate-300 mb-1">Pagamento:</div>
          <div className="text-sm text-slate-400">{option.paymentTerms}</div>
        </div>
      )}

      {/* Notas */}
      {option.notes && (
        <div>
          <div className="text-sm font-medium text-slate-300 mb-1">Notas:</div>
          <div className="text-sm text-slate-400">{option.notes}</div>
        </div>
      )}
    </div>
  );
}
