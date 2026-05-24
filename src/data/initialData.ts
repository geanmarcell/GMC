/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vehicle, DriverProfile, Shift, Expense, Maintenance } from '../types';

export const DEFAULT_VEHICLE: Vehicle = {
  model: 'Onix Sedan Plus LTZ GNV',
  brand: 'Chevrolet',
  year: '2023',
  licensePlate: 'ABC-1D23',
  fuelType: 'GNV',
  avgConsumption: 12.5, // Km/m³ GNV ou Km/L gasolina
  currentOdometer: 64200,
  oilChangeInterval: 10000, // Troca a cada 10.000 Km
  lastOilChangeOdometer: 55000 // Próxima troca com 65.000 Km (está quase no limite!)
};

export const DEFAULT_PROFILE: DriverProfile = {
  name: 'Gean Carvalho',
  city: 'Rio de Janeiro - RJ',
  dailyGoal: 320.00, // Meta diária de R$ 320,00 brutos
  monthlyGoal: 4500.00, // Meta mensal de faturamento líquido de R$ 4.500,00
  workingDaysPerWeek: 5
};

export const INITIAL_SHIFTS: Shift[] = [
  {
    id: 's-01',
    date: '2026-05-11',
    hoursWorked: 8.5,
    startOdometer: 61850,
    endOdometer: 62060,
    totalKm: 210,
    uberEarnings: 285.40,
    earnings99: 112.30,
    indriveEarnings: 45.00,
    privateEarnings: 0,
    otherEarnings: 15.00, // gorjetas
    fuelExpense: 65.00, // GNV
    foodExpense: 22.50,
    otherExpenses: 5.00, // pedágio
    notes: 'Segunda-feira boa. Bastante dinâmico da Uber pela manhã.'
  },
  {
    id: 's-02',
    date: '2026-05-12',
    hoursWorked: 9.0,
    startOdometer: 62060,
    endOdometer: 62290,
    totalKm: 230,
    uberEarnings: 298.50,
    earnings99: 145.20,
    indriveEarnings: 0,
    privateEarnings: 40.00, // Corrida aeroporto por fora
    otherEarnings: 0,
    fuelExpense: 72.00,
    foodExpense: 28.00,
    otherExpenses: 0,
    notes: 'Terça chuvosa ajudou na demanda da 99 e consegui pegar um retorno particular do aeroporto.'
  },
  {
    id: 's-03',
    date: '2026-05-13',
    hoursWorked: 7.5,
    startOdometer: 62290,
    endOdometer: 62475,
    totalKm: 185,
    uberEarnings: 220.10,
    earnings99: 98.40,
    indriveEarnings: 30.00,
    privateEarnings: 0,
    otherEarnings: 10.00,
    fuelExpense: 58.00,
    foodExpense: 18.50,
    otherExpenses: 12.00, // água climatizador
    notes: 'Quarta de sol quente, parei um pouco mais cedo para descansar.'
  },
  {
    id: 's-04',
    date: '2026-05-14',
    hoursWorked: 8.0,
    startOdometer: 62475,
    endOdometer: 62670,
    totalKm: 195,
    uberEarnings: 247.80,
    earnings99: 110.50,
    indriveEarnings: 55.00,
    privateEarnings: 0,
    otherEarnings: 0,
    fuelExpense: 60.50,
    foodExpense: 24.00,
    otherExpenses: 0,
    notes: 'Quinta-feira equilibrada.'
  },
  {
    id: 's-05',
    date: '2026-05-15',
    hoursWorked: 10.5,
    startOdometer: 62670,
    endOdometer: 62940,
    totalKm: 270,
    uberEarnings: 395.20,
    earnings99: 168.40,
    indriveEarnings: 40.00,
    privateEarnings: 50.00,
    otherEarnings: 25.00, // Gorjeta show na Barra
    fuelExpense: 88.00,
    foodExpense: 35.00,
    otherExpenses: 12.00,
    notes: 'Sexta sensacional! Rodei até de madrugada tirando proveito das dinâmicas de saída de shows.'
  },
  {
    id: 's-06',
    date: '2026-05-18',
    hoursWorked: 8.0,
    startOdometer: 62940,
    endOdometer: 63120,
    totalKm: 180,
    uberEarnings: 240.20,
    earnings99: 95.00,
    indriveEarnings: 20.00,
    privateEarnings: 0,
    otherEarnings: 5.00,
    fuelExpense: 55.00,
    foodExpense: 15.00,
    otherExpenses: 0,
    notes: 'Retorno de segunda-feira morno, me concentrei nas zonas de escritório.'
  },
  {
    id: 's-07',
    date: '2026-05-19',
    hoursWorked: 9.0,
    startOdometer: 63120,
    endOdometer: 63335,
    totalKm: 215,
    uberEarnings: 310.50,
    earnings99: 105.10,
    indriveEarnings: 50.00,
    privateEarnings: 0,
    otherEarnings: 8.00,
    fuelExpense: 68.00,
    foodExpense: 25.00,
    otherExpenses: 0,
    notes: 'Terça com bom rendimento. Consegui completar metas intermediárias.'
  },
  {
    id: 's-08',
    date: '2026-05-20',
    hoursWorked: 8.5,
    startOdometer: 63335,
    endOdometer: 63545,
    totalKm: 210,
    uberEarnings: 270.80,
    earnings99: 124.30,
    indriveEarnings: 35.00,
    privateEarnings: 0,
    otherEarnings: 15.00,
    fuelExpense: 65.00,
    foodExpense: 22.00,
    otherExpenses: 15.00, // Lava-jato rápido de ducha
    notes: 'Quarta-feira com bom movimento por causa do jogo do Flamengo.'
  },
  {
    id: 's-09',
    date: '2026-05-21',
    hoursWorked: 8.0,
    startOdometer: 63545,
    endOdometer: 63740,
    totalKm: 195,
    uberEarnings: 255.40,
    earnings99: 108.90,
    indriveEarnings: 40.00,
    privateEarnings: 30.00,
    otherEarnings: 0,
    fuelExpense: 61.00,
    foodExpense: 19.50,
    otherExpenses: 0,
    notes: 'Quinta chuvosa, demanda alta.'
  },
  {
    id: 's-10',
    date: '2026-05-22',
    hoursWorked: 5.5,
    startOdometer: 63740,
    endOdometer: 63865,
    totalKm: 125,
    uberEarnings: 185.00,
    earnings99: 80.00,
    indriveEarnings: 15.00,
    privateEarnings: 0,
    otherEarnings: 5.00,
    fuelExpense: 40.00,
    foodExpense: 12.00,
    otherExpenses: 0,
    notes: 'Sexta-feira em progresso. Turno da manhã finalizado.'
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'e-01',
    date: '2026-05-01',
    category: 'Mensalidade',
    description: 'Seguro mensal contra terceiros e roubo (Carro)',
    value: 180.00
  } as any, // fallback in case expense has slightly different categories
  {
    id: 'e-02',
    date: '2026-05-05',
    category: 'Limpeza/Lava-jato',
    description: 'Lava-jato completo interna/externa + cera líquida',
    value: 65.00
  },
  {
    id: 'e-03',
    date: '2026-05-10',
    category: 'Celular/Internet',
    description: 'Plano Vivo Controle para navegação de mapas/plataformas',
    value: 74.90
  },
  {
    id: 'e-04',
    date: '2026-05-15',
    category: 'Outros',
    description: 'Recarga Tag Sem Parar (Pedágio expresso)',
    value: 100.00
  }
];

export const INITIAL_MAINTENANCE_LOG: Maintenance[] = [
  {
    id: 'm-01',
    date: '2026-02-14',
    type: 'Troca de Óleo',
    odometer: 45000,
    description: 'Troca de óleo lubrificante 5W30 Sintético e filtro de combustível, ar e cabine.',
    cost: 320.00,
    nextOdometerAlert: 55000,
    isCompleted: true
  },
  {
    id: 'm-02',
    date: '2026-04-10',
    type: 'Troca de Óleo',
    odometer: 55000,
    description: 'Óleo 5W30 mineral de alta performance e troca do bujão do cárter.',
    cost: 190.00,
    nextOdometerAlert: 65000, // Atualmente odômetro está em 64200 (faltam apenas 800 KM!)
    isCompleted: true
  },
  {
    id: 'm-03',
    date: '2026-05-03',
    type: 'Alinhamento/Balanceamento',
    odometer: 60500,
    description: 'Alinhamento 3D dianteiro, balanceamento das 4 rodas e rodízio de pneus.',
    cost: 120.00,
    isCompleted: true
  },
  {
    id: 'm-04',
    date: '2026-05-20',
    type: 'Filtros',
    odometer: 63500,
    description: 'Troca de filtro do condicionador de ar e higienização interna com ozônio (odores do carro)',
    cost: 85.00,
    isCompleted: true
  }
];
