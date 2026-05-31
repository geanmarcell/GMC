/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type FuelType = 'Gasolina' | 'Etanol' | 'Flex' | 'GNV' | 'Diesel' | 'Elétrico';

export interface Vehicle {
  model: string;
  brand: string;
  year: string;
  licensePlate: string;
  fuelType: FuelType;
  avgConsumption: number; // Km/L
  currentOdometer: number; // Km atual do veículo
  oilChangeInterval: number; // Intervalo para troca de óleo (ex: 10000 km)
  lastOilChangeOdometer: number; // KM da última troca de óleo
  fipeValue?: number; // Valor Tabela FIPE (ex: R$ 55000)
  depreciationPerKm?: number; // Depreciação real por KM em R$ (ex: R$ 0.22)
}

export interface DriverProfile {
  name: string;
  city: string;
  dailyGoal: number; // Meta diária de ganhos brutos (R$)
  monthlyGoal: number; // Meta mensal de faturamento líquido (R$)
  annualGoal: number; // Meta anual de faturamento líquido (R$)
  workingDaysPerWeek: number; // Dias de trabalho por semana planejados (ex: 5 ou 6)
}

export interface Shift {
  id: string;
  date: string; // YYYY-MM-DD
  hoursWorked: number; // Horas trabalhadas
  startOdometer: number; // Odômetro Inicial (Km)
  endOdometer: number; // Odômetro Final (Km)
  totalKm: number; // Calculado automaticamente (endOdometer - startOdometer)
  
  // Ganhos Brutos por plataforma
  uberEarnings: number;
  earnings99: number;
  indriveEarnings: number;
  privateEarnings: number; // Corridas por fora / Particular
  otherEarnings: number; // Gorjetas ou entregas extras (Ex: Lalamove)
  
  // Despesas registradas no dia (Combustível já abastecido, alimentação na rua, etc.)
  fuelExpense: number;
  foodExpense: number;
  otherExpenses: number;
  
  notes?: string;
}

export type ExpenseCategory = 
  | 'Combustível'
  | 'Aluguel'
  | 'Financiamento'
  | 'Seguro'
  | 'IPVA/Impostos'
  | 'Manutenção'
  | 'Limpeza/Lava-jato'
  | 'Alimentação'
  | 'Celular/Internet'
  | 'Outros';

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  description: string;
  value: number;
}

export type MaintenanceType = 
  | 'Troca de Óleo'
  | 'Pastilhas/Discos de Freio'
  | 'Pneus'
  | 'Suspensão/Amortecedores'
  | 'Filtros'
  | 'Correia Dentada'
  | 'Alinhamento/Balanceamento'
  | 'Elétrica/Ar Condicionado'
  | 'Outros';

export interface Maintenance {
  id: string;
  date: string;
  type: MaintenanceType;
  odometer: number; // Km em que foi realizada
  description: string;
  cost: number;
  nextOdometerAlert?: number; // Km previsto para próxima troca/revisão
  isCompleted: boolean;
}
