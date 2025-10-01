import { useMemo } from "react";
import { PnrEditor } from "@/components/pnr/PnrEditor";
import { SimpleSummary } from "@/components/decoder/SimpleSummary";
import { UnifiedPreview } from "@/components/decoder/UnifiedPreview";
import { AdvancedPricingEngine } from "@/components/pricing/AdvancedPricingEngine";
import { ModalDetalhesDecodificacao } from "@/components/ModalDetalhesDecodificacao";
import { QuoteMetadataFields } from "@/components/quote/QuoteMetadataFields";
import { useHeaderActions } from "../../../shared/hooks/useHeaderActions";
import { BookingsHeaderActions } from "../components/BookingsHeaderActions";
import { useBookingsController } from "../hooks/useBookingsController";

export function BookingsPage() {
  const {
    pnrText,
    isGenerating,
    isComplexPNR,
    parsedOptions,
    simplePnrData,
    decodedFlights,
    errors,
    pricingResult,
    resetTrigger,
    showDetailsModal,
    decodeResults,
    quoteFamily,
    quoteObservation,
    onChangePnr,
    onChangeQuoteFamily,
    onChangeQuoteObservation,
    onClearAll,
    onExecute,
    onImportSample,
    onGeneratePdf,
    openDetailsModal,
    closeDetailsModal,
    updateOptionPricing,
    updateSimplePricing,
    setPricingResultFromEngine
  } = useBookingsController();

  useHeaderActions(
    <BookingsHeaderActions
      onImportSample={onImportSample}
      onGeneratePdf={() => {
        void onGeneratePdf();
      }}
      isGenerating={isGenerating}
      disabled={isGenerating || !pnrText.trim()}
    />
  );

  const simpleSummaryFares = useMemo(() => parsedOptions[0]?.fareCategories, [parsedOptions]);
  const hasComplexPricingOptions = isComplexPNR && parsedOptions.length > 0;
  const hasSimplePricingData = !isComplexPNR && (simplePnrData?.fares?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-6">
          <PnrEditor onPnrChange={onChangePnr} onClearAll={onClearAll} onExecute={onExecute} />
        </div>
        <div className="col-span-12 xl:col-span-6">
          <UnifiedPreview
            pnrData={pnrText}
            isComplexPNR={isComplexPNR}
            parsedOptions={parsedOptions}
            onShowDetails={openDetailsModal}
            decodeResults={decodeResults}
            decodedFlights={decodedFlights}
            errors={errors}
            overrides={[]}
            heuristics={[]}
          />
        </div>
      </div>

      {/* Campos de Metadados da Cotação */}
      <QuoteMetadataFields
        family={quoteFamily}
        observation={quoteObservation}
        onFamilyChange={onChangeQuoteFamily}
        onObservationChange={onChangeQuoteObservation}
      />

      <div className="space-y-6">
        <div className="space-y-4">
          {hasComplexPricingOptions ? (
            parsedOptions.map((option, optionIndex) => (
              <AdvancedPricingEngine
                key={option.label}
                optionLabel={`Pricing Engine: ${option.label}`}
                optionIndex={optionIndex}
                fareCategories={option.fareCategories?.map(fare => ({ ...fare, includeInPdf: fare.includeInPdf ?? true })) || []}
                onPricingChange={setPricingResultFromEngine}
                onSave={(updatedCategories) => updateOptionPricing(optionIndex, updatedCategories)}
                resetTrigger={resetTrigger}
              />
            ))
          ) : hasSimplePricingData ? (
            <AdvancedPricingEngine
              optionLabel="Pricing Engine"
              optionIndex={0}
              fareCategories={simplePnrData!.fares.map((fare) => ({
                fareClass: fare.fareClass,
                paxType: fare.paxType,
                baseFare: fare.baseFare,
                baseTaxes: fare.baseTaxes,
                notes: fare.notes,
                includeInPdf: fare.includeInPdf
              }))}
              onPricingChange={setPricingResultFromEngine}
              onSave={(updatedCategories) => updateSimplePricing(updatedCategories)}
              resetTrigger={resetTrigger}
              ravPercent={simplePnrData?.ravPercent}
              fee={0}
              incentivoPercent={simplePnrData?.incentivoPercent}
            />
          ) : (
            <div className="glass-card p-6 text-center text-sm text-slate-400">
              Cole um PNR e execute a decodificação para que o Pricing Engine apresente sugestões de tarifa.
            </div>
          )}
        </div>

        <SimpleSummary
          pnrData={simplePnrData}
          pricingResult={pricingResult}
          updatedFares={simpleSummaryFares}
        />
      </div>

      {showDetailsModal && (
        <ModalDetalhesDecodificacao
          isOpen={showDetailsModal}
          onClose={closeDetailsModal}
          decodedFlights={decodedFlights}
          errors={errors}
          onCorrection={() => {}}
        />
      )}
    </div>
  );
}
