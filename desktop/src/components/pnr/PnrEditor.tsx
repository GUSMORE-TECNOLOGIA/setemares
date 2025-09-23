import { useState } from 'react';
import { Button } from '../ui/Button';
import { Trash2, Play } from 'lucide-react';

interface PnrEditorProps {
  onPnrChange?: (pnr: string) => void;
  onClearAll?: () => void;
  onExecute?: () => void;
}

export function PnrEditor({ onPnrChange, onClearAll, onExecute }: PnrEditorProps) {
  const [pnrText, setPnrText] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setPnrText(value);
    onPnrChange?.(value);
  };

  const handleClear = () => {
    setPnrText('');
    onPnrChange?.('');
    onClearAll?.();
  };

  const handleExecute = () => {
    onExecute?.();
  };

  return (
    <div className="glass-card p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-100">PNR Editor</h2>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleExecute}
            disabled={!pnrText.trim()}
            className="bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-400 hover:text-orange-300 px-3 py-2 text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4 mr-2" />
            Executar
          </Button>
          <Button
            onClick={handleClear}
            disabled={!pnrText.trim()}
            className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 hover:text-red-300 px-3 py-2 text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Limpar
          </Button>
        </div>
      </div>
      <textarea
        value={pnrText}
        onChange={handleChange}
        placeholder="Cole o PNR aqui..."
        className="w-full h-[300px] bg-slate-800/50 border border-white/10 rounded-xl p-4 font-mono text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/40 resize-none"
        style={{
          lineHeight: '1.5',
          fontFamily: 'Monaco, Menlo, "Courier New", monospace'
        }}
      />
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <span>{pnrText.split('\n').length} linhas</span>
        <span>{pnrText.length} caracteres</span>
      </div>
    </div>
  );
}