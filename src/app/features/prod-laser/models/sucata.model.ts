export interface PesagemSucata {
  id: number;
  nome: string;
  matricula: string | null;
  temporario: boolean;
  pesoKg: number;
  dataColeta: string;
  criadoEm: string;
  atualizadoEm: string | null;
  reportado: boolean;
  dataReportado: string | null;
}

export interface PesagemSucataPayload {
  nome: string;
  matricula: string | null;
  pesoKg: number;
  dataColeta?: string;
}

export interface TotalSucataPeriodo {
  inicio: string;
  totalKg: number;
  qtdPesagens: number;
}

export interface ResumoSucata {
  hoje: TotalSucataPeriodo;
  semana: TotalSucataPeriodo;
  mes: TotalSucataPeriodo;
  ano: TotalSucataPeriodo;
  pendente: TotalSucataPeriodo;
}

export interface IndicadorSucataItem {
  periodo: string;
  totalKg: number;
  totalTon: number;
  qtdPesagens: number;
}

export interface IndicadoresSucata {
  agrupamento: 'dia' | 'semana' | 'mes' | 'ano';
  inicio: string;
  fim: string;
  totalKg: number;
  totalTon: number;
  qtdPesagens: number;
  itens: IndicadorSucataItem[];
}

export interface FuncionarioSucata {
  matricula: string;
  nome: string;
}

export interface ReporteSucataResultado {
  qtdReportados: number;
  totalKg: number;
  jaReportados: { id: number }[];
  naoEncontrados: number[];
}
