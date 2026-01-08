// Organization sector types
export type OrganizationSector =
  | 'telecom'
  | 'energia'
  | 'logistica'
  | 'agricultura'
  | 'construcao'
  | 'varejo'
  | 'outros';

// Weather thresholds configuration
export interface WeatherThresholds {
  precipitation: {
    warning: number; // mm
    critical: number; // mm
  };
  wind: {
    warning: number; // km/h
    critical: number; // km/h
  };
  temperature: {
    min: number; // °C
    max: number; // °C
  };
}

// Custom field definition
export interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  required: boolean;
  options?: string[]; // For 'select' type
  defaultValue?: string | number | boolean;
}

// Organization configuration
export interface OrganizationConfig {
  thresholds: WeatherThresholds;
  customFields: CustomField[];
  enabledMetrics: string[];
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

// Organization location
export interface OrganizationLocation {
  id: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  type: 'headquarters' | 'branch' | 'operation_point';
  active: boolean;
  createdAt?: Date;
}

// Main organization interface
export interface Organization {
  id: string;
  name: string;
  cnpj?: string;
  sector: OrganizationSector;
  config: OrganizationConfig;
  locations: OrganizationLocation[];
  logo?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Operational data record
export interface OperationalData {
  id: string;
  organizationId: string;
  locationId: string;
  date: Date;
  scheduledOperations: number;
  completedOperations: number;
  cancelledOperations: number;
  cancellationReason?: string;
  weatherImpact?: boolean;
  customData: Record<string, string | number | boolean | Date>;
}

// Sector presets with default thresholds
export const sectorPresets: Record<OrganizationSector, Omit<OrganizationConfig, 'customFields'>> = {
  telecom: {
    thresholds: {
      precipitation: { warning: 10, critical: 25 },
      wind: { warning: 30, critical: 50 },
      temperature: { min: 5, max: 40 },
    },
    enabledMetrics: ['instalacoes', 'manutencoes', 'visitas'],
    notifications: { email: true, push: true, sms: false },
  },
  energia: {
    thresholds: {
      precipitation: { warning: 15, critical: 30 },
      wind: { warning: 40, critical: 60 },
      temperature: { min: 0, max: 45 },
    },
    enabledMetrics: ['leituras', 'reparos', 'inspecoes'],
    notifications: { email: true, push: true, sms: true },
  },
  logistica: {
    thresholds: {
      precipitation: { warning: 5, critical: 15 },
      wind: { warning: 25, critical: 40 },
      temperature: { min: -5, max: 35 },
    },
    enabledMetrics: ['entregas', 'coletas', 'rotas'],
    notifications: { email: true, push: true, sms: false },
  },
  agricultura: {
    thresholds: {
      precipitation: { warning: 20, critical: 50 },
      wind: { warning: 35, critical: 55 },
      temperature: { min: 5, max: 38 },
    },
    enabledMetrics: ['plantio', 'colheita', 'irrigacao', 'pulverizacao'],
    notifications: { email: true, push: false, sms: true },
  },
  construcao: {
    thresholds: {
      precipitation: { warning: 5, critical: 10 },
      wind: { warning: 20, critical: 35 },
      temperature: { min: 10, max: 35 },
    },
    enabledMetrics: ['obras', 'concretagem', 'fundacao'],
    notifications: { email: true, push: true, sms: false },
  },
  varejo: {
    thresholds: {
      precipitation: { warning: 15, critical: 30 },
      wind: { warning: 40, critical: 60 },
      temperature: { min: 0, max: 40 },
    },
    enabledMetrics: ['vendas', 'entregas', 'estoque'],
    notifications: { email: true, push: true, sms: false },
  },
  outros: {
    thresholds: {
      precipitation: { warning: 10, critical: 25 },
      wind: { warning: 30, critical: 50 },
      temperature: { min: 5, max: 40 },
    },
    enabledMetrics: ['operacoes', 'atendimentos'],
    notifications: { email: true, push: false, sms: false },
  },
};

// Sector labels in Portuguese
export const sectorLabels: Record<OrganizationSector, string> = {
  telecom: 'Telecomunicações',
  energia: 'Energia',
  logistica: 'Logística',
  agricultura: 'Agricultura',
  construcao: 'Construção Civil',
  varejo: 'Varejo',
  outros: 'Outros',
};

// Sector icons (lucide icon names)
export const sectorIcons: Record<OrganizationSector, string> = {
  telecom: 'Radio',
  energia: 'Zap',
  logistica: 'Truck',
  agricultura: 'Wheat',
  construcao: 'Building2',
  varejo: 'ShoppingBag',
  outros: 'Briefcase',
};
