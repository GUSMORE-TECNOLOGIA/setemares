import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { NumberInput } from '@/components/ui/NumberInput';
import { Switch } from '@/components/ui/Switch';

const paramsSchema = z.object({
  ravPercent: z.number().min(0).max(100),
  fee: z.number().min(0),
  incentiveValue: z.number().min(0),
  class: z.string(),
  baggage: z.string(),
  payment: z.string(),
  maxInstallments: z.number().min(1).max(36),
  baseFine: z.number().min(0),
  refundable: z.boolean(),
  family: z.string().optional(),
});

type ParamsFormData = z.infer<typeof paramsSchema>;

export function ParamsForm() {
  const { register, handleSubmit, control, formState: { errors } } = useForm<ParamsFormData>({
    resolver: zodResolver(paramsSchema),
    defaultValues: {
      ravPercent: 10,
      fee: 0,
      incentiveValue: 0,
      class: 'executiva',
      baggage: '2x23kg',
      payment: 'cartao',
      maxInstallments: 4,
      baseFine: 100,
      refundable: false,
      family: '',
    },
  });

  const onSubmit = (data: ParamsFormData) => {
    console.log('Form data:', data);
    alert('Formulário enviado! Veja o console.');
  };

  const classOptions = [
    { value: 'economica', label: 'Econômica' },
    { value: 'premium', label: 'Premium Economy' },
    { value: 'executiva', label: 'Executiva' },
    { value: 'primeira', label: 'Primeira Classe' },
  ];

  const baggageOptions = [
    { value: '2x23kg', label: '2 peças de até 23kg por bilhete' },
    { value: '1x23kg', label: '1 peça de até 23kg por bilhete' },
    { value: '2x32kg', label: '2 peças de até 32kg por bilhete' },
    { value: 'confirmar', label: 'A confirmar' },
  ];

  const paymentOptions = [
    { value: 'cartao', label: 'Em até Xx no cartão de crédito, taxas à vista' },
    { value: 'vista', label: 'À vista no cartão de crédito' },
    { value: 'pix', label: 'PIX à vista' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Parâmetros da Cotação</h3>
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="ravPercent"
                control={control}
                render={({ field }) => (
                  <NumberInput
                    label="RAV %"
                    type="percentage"
                    error={errors.ravPercent?.message}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              
              <Controller
                name="fee"
                control={control}
                render={({ field }) => (
                  <NumberInput
                    label="Fee"
                    type="currency"
                    error={errors.fee?.message}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              
              <Controller
                name="incentiveValue"
                control={control}
                render={({ field }) => (
                  <NumberInput
                    label="Incentivo (USD)"
                    type="currency"
                    error={errors.incentiveValue?.message}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              
              <Select
                label="Classe"
                options={classOptions}
                error={errors.class?.message}
                {...register('class')}
              />
              
              <Select
                label="Pagamento"
                options={paymentOptions}
                error={errors.payment?.message}
                {...register('payment')}
              />
              
              <Select
                label="Bagagem"
                options={baggageOptions}
                error={errors.baggage?.message}
                {...register('baggage')}
              />
            </div>
          </div>
        </div>
        
        <div className="col-span-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Parâmetros da Cotação</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Parcelas máx."
                type="number"
                placeholder="4"
                error={errors.maxInstallments?.message}
                {...register('maxInstallments', { valueAsNumber: true })}
              />
              
              <Controller
                name="baseFine"
                control={control}
                render={({ field }) => (
                  <NumberInput
                    label="Multa base (USD)"
                    type="currency"
                    error={errors.baseFine?.message}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              
              <Controller
                name="refundable"
                control={control}
                render={({ field }) => (
                  <Switch
                    label="Bilhete reembolsável"
                    error={errors.refundable?.message}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              
              <Select
                label="Família"
                options={[
                  { value: '', label: '—' },
                  { value: 'silva', label: 'Silva' },
                  { value: 'santos', label: 'Santos' },
                ]}
                {...register('family')}
              />
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="btn btn-primary"
              >
                Salvar Parâmetros
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}