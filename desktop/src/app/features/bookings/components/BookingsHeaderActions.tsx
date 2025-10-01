import { Play, Upload } from "lucide-react";

interface BookingsHeaderActionsProps {
  onImportSample: () => void;
  onGeneratePdf: () => void;
  isGenerating: boolean;
  disabled: boolean;
}

export function BookingsHeaderActions({ onImportSample, onGeneratePdf, isGenerating, disabled }: BookingsHeaderActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" className="btn btn-outline" onClick={onImportSample}>
        <Upload size={18} /> Importar PNR
      </button>
      <button
        type="button"
        className="btn btn-primary"
        onClick={onGeneratePdf}
        disabled={disabled}
      >
        {isGenerating ? (
          <>
            <div className="animate-spin w-4 h-4 border-2 border-black/30 border-t-black rounded-full" />
            Gerando...
          </>
        ) : (
          <>
            <Play size={18} /> Gerar PDF
          </>
        )}
      </button>
    </div>
  );
}
