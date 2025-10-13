import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ConciergeFormData } from '@/lib/openai-service';

interface ConciergeFormProps {
  onSubmit: (data: ConciergeFormData) => void;
  isSubmitting: boolean;
}

const TRAVEL_TYPES = [
  { value: 'lua_de_mel', label: 'Lua de Mel' },
  { value: 'familia', label: 'Família' },
  { value: 'negocios', label: 'Negócios' },
  { value: 'aventura', label: 'Aventura' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'gastronomico', label: 'Gastronômico' },
  { value: 'relaxamento', label: 'Relaxamento' },
];

const BUDGET_OPTIONS = [
  { value: 'economico', label: 'Econômico' },
  { value: 'confortavel', label: 'Confortável' },
  { value: 'premium', label: 'Premium' },
  { value: 'luxo', label: 'Luxo' },
];

const INTERESTS_OPTIONS = [
  { value: 'historia', label: 'História e Cultura' },
  { value: 'natureza', label: 'Natureza e Paisagens' },
  { value: 'gastronomia', label: 'Gastronomia Local' },
  { value: 'arte', label: 'Arte e Museus' },
  { value: 'aventura', label: 'Aventura e Esportes' },
  { value: 'compras', label: 'Compras e Mercados' },
  { value: 'vida_noturna', label: 'Vida Noturna' },
  { value: 'spas', label: 'Spas e Bem-estar' },
  { value: 'fotografia', label: 'Fotografia' },
  { value: 'festivais', label: 'Festivais e Eventos' },
];

export function ConciergeForm({ onSubmit, isSubmitting }: ConciergeFormProps) {
  const [formData, setFormData] = useState<ConciergeFormData>({
    clientName: '',
    destination: '',
    checkin: '',
    checkout: '',
    travelType: 'lua_de_mel',
    budget: 'confortavel',
    adults: 1,
    children: 0,
    hotel: '',
    address: '',
    interests: [],
    observations: '',
    cuisinePreferences: [],
    dietaryRestrictions: [],
    nightlifeLevel: 'moderado',
    eventInterests: [],
    dailyPace: 'equilibrado',
    morningStart: '09:00',
    eveningEnd: '22:00',
    maxWalkingKmPerDay: 5,
    freeTimeBlocks: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof ConciergeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro quando o campo for alterado
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleInterestChange = (interest: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      interests: checked
        ? [...prev.interests, interest]
        : prev.interests.filter(i => i !== interest)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Nome do cliente é obrigatório';
    }

    if (!formData.destination.trim()) {
      newErrors.destination = 'Destino é obrigatório';
    }

    if (!formData.checkin) {
      newErrors.checkin = 'Data de check-in é obrigatória';
    }

    if (!formData.checkout) {
      newErrors.checkout = 'Data de check-out é obrigatória';
    }

    // Validar se checkout é posterior ao checkin
    if (formData.checkin && formData.checkout) {
      const checkinDate = new Date(formData.checkin);
      const checkoutDate = new Date(formData.checkout);
      
      if (checkoutDate <= checkinDate) {
        newErrors.checkout = 'Data de check-out deve ser posterior ao check-in';
      }
    }

    // Validar se não é data passada
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (formData.checkin && new Date(formData.checkin) < today) {
      newErrors.checkin = 'Data de check-in não pode ser no passado';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações do Cliente */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white border-b border-slate-600 pb-2">
          Informações do Cliente
        </h3>
        
        <Input
          label="Nome do Cliente *"
          value={formData.clientName}
          onChange={(e) => handleInputChange('clientName', e.target.value)}
          error={errors.clientName}
          placeholder="Ex: Maria Silva"
          required
        />
      </div>

      {/* Dados da Viagem */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white border-b border-slate-600 pb-2">
          Dados da Viagem
        </h3>
        
        <Input
          label="Destino *"
          value={formData.destination}
          onChange={(e) => handleInputChange('destination', e.target.value)}
          error={errors.destination}
          placeholder="Ex: Paris, França"
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Check-in *"
            type="date"
            value={formData.checkin}
            onChange={(e) => handleInputChange('checkin', e.target.value)}
            error={errors.checkin}
            required
          />
          
          <Input
            label="Check-out *"
            type="date"
            value={formData.checkout}
            onChange={(e) => handleInputChange('checkout', e.target.value)}
            error={errors.checkout}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Tipo de Viagem *"
            value={formData.travelType}
            onChange={(e) => handleInputChange('travelType', e.target.value)}
            options={TRAVEL_TYPES}
            required
          />
          
          <Select
            label="Orçamento *"
            value={formData.budget}
            onChange={(e) => handleInputChange('budget', e.target.value)}
            options={BUDGET_OPTIONS}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Adultos"
            type="number"
            min="1"
            max="20"
            value={formData.adults}
            onChange={(e) => handleInputChange('adults', parseInt(e.target.value) || 1)}
            helpText="Número de adultos"
          />
          
          <Input
            label="Crianças"
            type="number"
            min="0"
            max="10"
            value={formData.children}
            onChange={(e) => handleInputChange('children', parseInt(e.target.value) || 0)}
            helpText="Número de crianças"
          />
        </div>
      </div>

      {/* Detalhes Opcionais */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white border-b border-slate-600 pb-2">
          Detalhes Opcionais
        </h3>
        
        <Input
          label="Hotel"
          value={formData.hotel}
          onChange={(e) => handleInputChange('hotel', e.target.value)}
          placeholder="Ex: Hotel Plaza Athénée"
          helpText="Nome do hotel (se já reservado)"
        />
        
        <Input
          label="Endereço"
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          placeholder="Ex: Rua das Flores, 123"
          helpText="Endereço de hospedagem"
        />
      </div>

      {/* Interesses */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white border-b border-slate-600 pb-2">
          Interesses do Cliente
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {INTERESTS_OPTIONS.map((interest) => (
            <label
              key={interest.value}
              className="flex items-center space-x-2 cursor-pointer p-3 rounded-lg border border-slate-600 hover:bg-slate-700 transition-colors"
            >
              <input
                type="checkbox"
                checked={formData.interests.includes(interest.value)}
                onChange={(e) => handleInterestChange(interest.value, e.target.checked)}
                className="rounded border-slate-600 text-brand focus:ring-brand/60"
              />
              <span className="text-sm text-slate-200">{interest.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Preferências Premium */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white border-b border-slate-600 pb-2">
          Preferências Premium
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Culinária preferida (separe por vírgula)"
            placeholder="alta gastronomia, local autêntica, frutos do mar"
            value={(formData.cuisinePreferences || []).join(', ')}
            onChange={(e) => handleInputChange('cuisinePreferences', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
          />
          <Input
            label="Restrições alimentares (vírgula)"
            placeholder="sem glúten, sem lactose, vegetariano"
            value={(formData.dietaryRestrictions || []).join(', ')}
            onChange={(e) => handleInputChange('dietaryRestrictions', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Nível de vida noturna"
            value={formData.nightlifeLevel || 'moderado'}
            onChange={(e) => handleInputChange('nightlifeLevel', e.target.value as any)}
            options={[{ value: 'baixo', label: 'Baixo' }, { value: 'moderado', label: 'Moderado' }, { value: 'alto', label: 'Alto' }]}
          />
          <Select
            label="Ritmo diário"
            value={formData.dailyPace || 'equilibrado'}
            onChange={(e) => handleInputChange('dailyPace', e.target.value as any)}
            options={[{ value: 'relaxado', label: 'Relaxado' }, { value: 'equilibrado', label: 'Equilibrado' }, { value: 'intenso', label: 'Intenso' }]}
          />
          <Input
            label="Caminhada máxima (km/dia)"
            type="number"
            min="1"
            max="20"
            value={formData.maxWalkingKmPerDay || 5}
            onChange={(e) => handleInputChange('maxWalkingKmPerDay', parseInt(e.target.value) || 5)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Início do dia"
            type="time"
            value={formData.morningStart || '09:00'}
            onChange={(e) => handleInputChange('morningStart', e.target.value)}
          />
          <Input
            label="Fim do dia"
            type="time"
            value={formData.eveningEnd || '22:00'}
            onChange={(e) => handleInputChange('eveningEnd', e.target.value)}
          />
        </div>

        <div>
          <Input
            label="Horas livres (intervalos HH:mm-HH:mm, separados por vírgula)"
            placeholder="14:00-16:00, 19:00-20:00"
            value={(formData.freeTimeBlocks || []).join(', ')}
            onChange={(e) => handleInputChange('freeTimeBlocks', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
          />
        </div>
      </div>

      {/* Observações */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white border-b border-slate-600 pb-2">
          Observações Especiais
        </h3>
        
        <div>
          <label htmlFor="observations" className="block text-sm font-medium text-slate-200 mb-2">
            Observações
          </label>
          <textarea
            id="observations"
            value={formData.observations}
            onChange={(e) => handleInputChange('observations', e.target.value)}
            placeholder="Ex: Cliente tem restrições alimentares, prefere hotéis centrais, interesse em arte contemporânea..."
            className="w-full h-24 px-3 py-2 rounded-lg border border-slate-600 bg-slate-700 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/60 focus:border-brand resize-none"
            rows={4}
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-6 border-t border-slate-600">
        <Button
          type="submit"
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? 'Gerando Relatório...' : 'Gerar Relatório com IA'}
        </Button>
      </div>
    </form>
  );
}
