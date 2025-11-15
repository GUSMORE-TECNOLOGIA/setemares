import { useState } from 'react';
import { Database, MapPin, Plane, Building2, AlertTriangle } from 'lucide-react';
import { AirportsCatalog } from './AirportsCatalog';
import { CitiesCatalog } from './CitiesCatalog';
import { AirlinesCatalog } from './AirlinesCatalog';
import { UnknownCodesPage } from './UnknownCodesPage';

type TabType = 'airports' | 'cities' | 'airlines' | 'unknown';

const tabs = [
  {
    id: 'airports' as TabType,
    label: 'Aeroportos',
    icon: MapPin,
    description: 'Gerencie aeroportos e códigos IATA/ICAO'
  },
  {
    id: 'cities' as TabType,
    label: 'Cidades',
    icon: Building2,
    description: 'Gerencie cidades e códigos de destino'
  },
  {
    id: 'airlines' as TabType,
    label: 'Companhias',
    icon: Plane,
    description: 'Gerencie companhias aéreas'
  },
  {
    id: 'unknown' as TabType,
    label: 'Pendências',
    icon: AlertTriangle,
    description: 'Códigos não reconhecidos'
  }
];

export function CatalogPage() {
  const [activeTab, setActiveTab] = useState<TabType>('airports');

  const renderContent = () => {
    switch (activeTab) {
      case 'airports':
        return <AirportsCatalog />;
      case 'cities':
        return <CitiesCatalog />;
      case 'airlines':
        return <AirlinesCatalog />;
      case 'unknown':
        return <UnknownCodesPage />;
      default:
        return <AirportsCatalog />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 h-16 bg-slate-900/70 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 xl:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-brand/20 rounded-xl">
              <Database className="text-brand" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">Catálogo de Códigos</h1>
              <p className="text-sm text-slate-400">Gerencie aeroportos, cidades e companhias</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 xl:px-8 py-6">
        {/* Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-xl border border-white/10">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-brand text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon size={18} />
                  <div className="text-left">
                    <div className="font-medium">{tab.label}</div>
                    <div className="text-xs opacity-75">{tab.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="animate-in fade-in-50 duration-300">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
