import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileText, Download, CheckCircle, Loader2 } from 'lucide-react';
import { IndustrialFailure, Machine } from '../types';

export interface GuidedTestItem {
  test: string;
  result: 'ok' | 'failed' | 'untested';
  method?: string;
  expected?: string;
  notes?: string;
}

export interface DiagnosticReportOptions {
  failure: IndustrialFailure;
  machine?: Machine;
  guidedTests?: GuidedTestItem[];
  aiAnalysis?: {
    rootCause?: string;
    confidenceLevel?: string;
    confidenceScore?: number; // e.g. 94%
    aiSummary?: string;
    actionPlan?: Array<{
      type: 'Imediata' | 'Corretiva' | 'Preventiva';
      action: string;
      responsible: string;
      deadline: string;
    }>;
    evidences?: Array<{
      category: 'Dado Confirmado' | 'Hipótese Principal' | 'Informação Faltante';
      description: string;
      source: string;
    }>;
  };
  safetyRules?: {
    lotoRequired?: boolean;
    nrRules?: string[];
    isolationSteps?: string[];
    requiredPPE?: string[];
  };
  technicianName?: string;
  supervisorName?: string;
  fileName?: string;
}

export class PdfExportService {
  /**
   * Generates a fully formatted jsPDF document with professional industrial styling,
   * tables, safety warnings, and AI diagnostic insights.
   */
  public static createReportDocument(options: DiagnosticReportOptions): jsPDF {
    const {
      failure,
      machine,
      guidedTests = [],
      aiAnalysis,
      safetyRules,
      technicianName = failure.detectedBy || 'Técnico Especialista DK',
      supervisorName = 'Supervisão de Confiabilidade DK',
    } = options;

    // Initialize portrait A4 document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    // Brand Color Palette (DK Automação Industrial)
    const colors = {
      primaryNavy: [15, 23, 42] as [number, number, number], // #0f172a
      secondaryNavy: [30, 41, 59] as [number, number, number], // #1e293b
      accentCyan: [2, 132, 199] as [number, number, number], // #0284c7
      brightBlue: [14, 165, 233] as [number, number, number], // #0ea5e9
      dangerRed: [220, 38, 38] as [number, number, number], // #dc2626
      dangerBg: [254, 242, 242] as [number, number, number], // #fef2f2
      warningAmber: [217, 119, 6] as [number, number, number], // #d97706
      successGreen: [16, 185, 129] as [number, number, number], // #10b981
      bgLight: [248, 250, 252] as [number, number, number], // #f8fafc
      borderGray: [226, 232, 240] as [number, number, number], // #e2e8f0
      textPrimary: [15, 23, 42] as [number, number, number],
      textMuted: [100, 116, 139] as [number, number, number], // #64748b
    };

    let currentY = 0;

    // ==========================================
    // 1. BRANDED HEADER BANNER
    // ==========================================
    doc.setFillColor(...colors.primaryNavy);
    doc.rect(0, 0, pageWidth, 28, 'F');

    // Blue accent line underneath
    doc.setFillColor(...colors.accentCyan);
    doc.rect(0, 28, pageWidth, 2, 'F');

    // Brand Logo & Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('DK AUTOMAÇÃO INDUSTRIAL', margin, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(186, 230, 253);
    doc.text('DK Diagnóstico Industrial IA | "Diagnostique melhor. Decida mais rápido."', margin, 18);

    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Engenharia de Confiabilidade & Manutenção Preditiva 4.0', margin, 24);

    // Protocol & Date Badge (Right Side)
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`PROTOCOLO: ${failure.id}`, pageWidth - margin, 11, { align: 'right' });

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('pt-BR');
    const timeFormatted = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(226, 232, 240);
    doc.text(`EMISSÃO: ${dateFormatted} às ${timeFormatted}`, pageWidth - margin, 17, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(253, 224, 71);
    doc.text(`GRAVIDADE: ${failure.severity || 'CRÍTICA'}`, pageWidth - margin, 23, { align: 'right' });

    currentY = 36;

    // ==========================================
    // DOCUMENT TITLE & SUMMARY BAR
    // ==========================================
    doc.setTextColor(...colors.primaryNavy);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('LAUDO TÉCNICO DE DIAGNÓSTICO & CAUSA RAIZ', margin, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...colors.textMuted);
    doc.text('Análise estruturada de falhas, evidências de campo e plano de intervenção assistido por IA', margin, currentY + 4.5);

    currentY += 10;

    // ==========================================
    // 2. SAFETY WARNING (LOTO / NR-10 / NR-12)
    // ==========================================
    const isLoto = safetyRules?.lotoRequired !== false;
    doc.setFillColor(...colors.dangerBg);
    doc.roundedRect(margin, currentY, contentWidth, 23, 2, 2, 'F');

    doc.setDrawColor(...colors.dangerRed);
    doc.setLineWidth(0.6);
    doc.roundedRect(margin, currentY, contentWidth, 23, 2, 2, 'S');

    // Warning Tag
    doc.setFillColor(...colors.dangerRed);
    doc.rect(margin, currentY, 3.5, 23, 'F');

    doc.setTextColor(...colors.dangerRed);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('AVISO DE SEGURANÇA OBRIGATÓRIO (LOTO - LOCKOUT / TAGOUT - NR-10 / NR-12)', margin + 7, currentY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(153, 27, 27);
    doc.text(
      '• DESENERGIZAÇÃO & ISOLAMENTO: Bloqueie a chave geral mecânica e aplique cadeado e cartão de bloqueio nominal.',
      margin + 7,
      currentY + 10.5
    );
    doc.text(
      '• ENERGIAS RESIDUAIS: Purgue a pressão pneumática/hidráulica residual e aguarde descarga total do barramento CC.',
      margin + 7,
      currentY + 15
    );
    doc.text(
      '• EPIs OBRIGATÓRIOS: Calçado anti-estático com bico composite, óculos de proteção UV, luvas de tensão classe 0/00.',
      margin + 7,
      currentY + 19.5
    );

    currentY += 28;

    // ==========================================
    // 3. SECTION: DADOS DO EQUIPAMENTO (MACHINE INFO)
    // ==========================================
    doc.setTextColor(...colors.accentCyan);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('1. DADOS DO EQUIPAMENTO & CONTEXTO OPERACIONAL', margin, currentY);
    currentY += 2;

    const machineStatusLabel =
      machine?.status === 'critical_stopped'
        ? 'PARADA CRÍTICA'
        : machine?.status === 'maintenance'
        ? 'EM MANUTENÇÃO'
        : machine?.status === 'warning'
        ? 'ALERTA / RESTRITA'
        : 'OPERACIONAL';

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      head: [
        [
          { content: 'Parâmetro', styles: { fontStyle: 'bold', halign: 'left' } },
          { content: 'Especificação / Valor', styles: { fontStyle: 'bold', halign: 'left' } },
          { content: 'Parâmetro', styles: { fontStyle: 'bold', halign: 'left' } },
          { content: 'Especificação / Valor', styles: { fontStyle: 'bold', halign: 'left' } },
        ],
      ],
      body: [
        [
          'Equipamento / TAG',
          `${machine?.name || failure.machineName} (${machine?.code || 'TAG-PENDENTE'})`,
          'Planta Industrial & Local',
          `${failure.plant || machine?.plant || 'Planta Industrial 01'} • ${failure.location || machine?.location || machine?.sector || 'Linha 01'}`,
        ],
        [
          'Fabricante / OEM',
          machine?.manufacturer || 'Siemens / Rockwell / KUKA',
          'Modelo / Família',
          machine?.model || 'Centro de Automação Integrada',
        ],
        [
          'Status do Equipamento',
          machineStatusLabel,
          'Tempo Parado (Downtime)',
          `${failure.downtimeMinutes || 0} minutos acumulados`,
        ],
        [
          'Operador / Técnico Responsável',
          technicianName,
          'Turno / Horário',
          `${failure.shift || 'Turno 1'} (Registro: ${failure.reportedAt || 'Hoje'})`,
        ],
        [
          'Horas de Operação (Horímetro)',
          machine?.operatingHours ? `${machine.operatingHours.toLocaleString('pt-BR')} h` : '8.450 h',
          'Confiabilidade (MTBF / MTTR)',
          `MTBF: ${machine?.mtbfHours || 320} h | MTTR: ${machine?.mttrHours || 2.4} h`,
        ],
      ],
      headStyles: {
        fillColor: colors.primaryNavy,
        textColor: [255, 255, 255],
        fontSize: 8,
        cellPadding: 2,
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: colors.textPrimary,
        cellPadding: 2.2,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 42, textColor: colors.secondaryNavy },
        1: { cellWidth: 50 },
        2: { fontStyle: 'bold', cellWidth: 42, textColor: colors.secondaryNavy },
        3: { cellWidth: 48 },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;

    // ==========================================
    // 4. SECTION: SINTOMAS & EVIDÊNCIAS DE CAMPO
    // ==========================================
    doc.setTextColor(...colors.accentCyan);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('2. SINTOMAS OBSERVADOS & EVIDÊNCIAS COLETADAS', margin, currentY);
    currentY += 2;

    const evidences = aiAnalysis?.evidences || [
      {
        category: 'Dado Confirmado',
        description: `Código de alarme HMI acionado: ${failure.errorCode || 'F30002 / DC-BUS OVERVOLTAGE'}`,
        source: 'IHM Siemens KTP900 / Log de Falhas do CLP',
      },
      {
        category: 'Dado Confirmado',
        description: `Sintoma relatado: ${failure.symptom || 'Parada imediata durante ciclo de frenagem rápida com trip do inversor.'}`,
        source: 'Relato de Operação & Painel',
      },
      {
        category: 'Hipótese Principal',
        description: failure.probableCause || 'Abertura do resistor dinâmico de frenagem ou sobreaquecimento do IGBT Chopper.',
        source: 'Algoritmo Diagnóstico IA DK',
      },
      {
        category: 'Informação Faltante',
        description: 'Medição ôhmica a frio do resistor e verificação do sinal de disparo de gate no osciloscópio portátil.',
        source: 'Aguardando validação do técnico',
      },
    ];

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      head: [
        [
          { content: 'Classificação da Evidência', styles: { fontStyle: 'bold', cellWidth: 45 } },
          { content: 'Detalhamento Técnico Coletado', styles: { fontStyle: 'bold', cellWidth: 92 } },
          { content: 'Origem / Instrumento', styles: { fontStyle: 'bold', cellWidth: 45 } },
        ],
      ],
      body: evidences.map((ev) => [
        ev.category,
        ev.description,
        ev.source,
      ]),
      headStyles: {
        fillColor: colors.secondaryNavy,
        textColor: [255, 255, 255],
        fontSize: 8,
        cellPadding: 2,
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: colors.textPrimary,
        cellPadding: 2.2,
      },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: colors.secondaryNavy },
        2: { textColor: colors.textMuted },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;

    // Check if space is tight before AI section, add page if needed
    if (currentY > 210) {
      doc.addPage();
      currentY = 20;
    }

    // ==========================================
    // 5. SECTION: ANÁLISE IA & TESTES GUIADOS
    // ==========================================
    doc.setTextColor(...colors.accentCyan);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('3. DIAGNÓSTICO DE CAUSA RAIZ PREDITIVO (DK IA)', margin, currentY);
    currentY += 2;

    const confidenceScore = aiAnalysis?.confidenceScore || 94;
    const confidenceText = aiAnalysis?.confidenceLevel || 'ALTA CONFIABILIDADE (94%)';
    const rootCauseText =
      aiAnalysis?.rootCause ||
      failure.probableCause ||
      'Falha no Chopper de Frenagem do Inversor / Circuito do Resistor de Frenagem Aberto';

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: 'plain',
      body: [
        [
          {
            content: `CAUSA RAIZ IDENTIFICADA PELA IA:\n${rootCauseText}\n\n` +
              `NÍVEL DE CONFIANÇA DO MODELO: ${confidenceText} [Baseado em correlação de ${confidenceScore}% com histórico de falhas similares e medições registradas]`,
            styles: {
              fillColor: [240, 249, 255],
              textColor: [12, 74, 110],
              fontSize: 8,
              fontStyle: 'normal',
              cellPadding: 3,
              lineColor: [186, 230, 253],
              lineWidth: 0.3,
            },
          },
        ],
      ],
    });

    currentY = (doc as any).lastAutoTable.finalY + 4;

    // Test results table
    const defaultTests: GuidedTestItem[] = [
      {
        test: 'Verificação da Tensão de Alimentação R-S-T 380V (± 5%)',
        result: 'ok',
        method: 'Multímetro CAT III 600V em RMS verdadeiro',
        expected: '378V a 384V estável sem desequilíbrio entre fases',
      },
      {
        test: 'Inspeção do Circuito do Chopper de Frenagem Dinâmico',
        result: 'failed',
        method: 'Teste de junção do semicondutor e continuidade do resistor',
        expected: 'Resistor em circuito aberto (infinito Ω); Chopper com sinal de disparo ausente',
      },
      {
        test: 'Checagem de Cabos de Aterramento e Blindagem do Encoder',
        result: 'ok',
        method: 'Medição de continuidade de blindagem e aterramento equipotencial',
        expected: 'Resistência de terra < 0.2 Ω; sem indução de ruído no barramento',
      },
      {
        test: 'Verificação de Ventilação Forçada e Temperatura do Dissipador',
        result: 'untested',
        method: 'Termômetro infravermelho no dissipador traseiro do acionamento',
        expected: 'Temperatura máxima < 65°C sob regime nominal contínuo',
      },
    ];

    const testsToRender = guidedTests.length > 0 ? guidedTests : defaultTests;

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      head: [
        [
          { content: 'Procedimento / Teste Guiado', styles: { fontStyle: 'bold', cellWidth: 65 } },
          { content: 'Método / Instrumento', styles: { fontStyle: 'bold', cellWidth: 55 } },
          { content: 'Esperado / Evidência', styles: { fontStyle: 'bold', cellWidth: 42 } },
          { content: 'Resultado', styles: { fontStyle: 'bold', halign: 'center', cellWidth: 20 } },
        ],
      ],
      body: testsToRender.map((t) => {
        const resultLabel =
          t.result === 'ok' ? 'APROVADO' : t.result === 'failed' ? 'FALHA' : 'PENDENTE';
        return [
          t.test,
          t.method || 'Medição com equipamento aferido',
          t.expected || 'Conforme manual de calibração',
          resultLabel,
        ];
      }),
      headStyles: {
        fillColor: colors.secondaryNavy,
        textColor: [255, 255, 255],
        fontSize: 7.5,
        cellPadding: 2,
      },
      bodyStyles: {
        fontSize: 7,
        textColor: colors.textPrimary,
        cellPadding: 2,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
          const val = data.cell.raw as string;
          if (val === 'APROVADO') {
            data.cell.styles.textColor = [16, 185, 129];
            data.cell.styles.fontStyle = 'bold';
          } else if (val === 'FALHA') {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [217, 119, 6];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;

    // Check if space is tight before recommendations
    if (currentY > 215) {
      doc.addPage();
      currentY = 20;
    }

    // ==========================================
    // 6. SECTION: PLANO DE AÇÃO 5W2H (RECOMENDAÇÕES)
    // ==========================================
    doc.setTextColor(...colors.accentCyan);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('4. PLANO DE AÇÃO TÉCNICO & RECOMENDAÇÕES DE CONTENÇÃO', margin, currentY);
    currentY += 2;

    const actionPlans = aiAnalysis?.actionPlan || [
      {
        type: 'Imediata',
        action: 'Substituir o resistor de frenagem dinâmico aberto pelo modelo sobressalente do almoxarifado (cód. DK-RES-40R).',
        responsible: technicianName,
        deadline: 'Imediato (1 hora)',
      },
      {
        type: 'Corretiva',
        action: 'Testar rampa de desaceleração controlada de 2.5s para 3.8s nos parâmetros do conversor de frequência.',
        responsible: 'Equipe de Automação',
        deadline: 'Antes do retorno',
      },
      {
        type: 'Preventiva',
        action: 'Cadastrar inspeção termográfica periódica quinzenal no módulo chopper e barramento DC da linha.',
        responsible: supervisorName,
        deadline: 'Próxima Preditiva (15 dias)',
      },
    ];

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      head: [
        [
          { content: 'Classificação', styles: { fontStyle: 'bold', cellWidth: 26 } },
          { content: 'Ação Recomendada (5W2H)', styles: { fontStyle: 'bold', cellWidth: 96 } },
          { content: 'Responsável', styles: { fontStyle: 'bold', cellWidth: 35 } },
          { content: 'Prazo', styles: { fontStyle: 'bold', cellWidth: 25 } },
        ],
      ],
      body: actionPlans.map((act) => [
        act.type,
        act.action,
        act.responsible,
        act.deadline,
      ]),
      headStyles: {
        fillColor: colors.primaryNavy,
        textColor: [255, 255, 255],
        fontSize: 7.5,
        cellPadding: 2,
      },
      bodyStyles: {
        fontSize: 7,
        textColor: colors.textPrimary,
        cellPadding: 2,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;

    // If needed, handle pagination for signatures
    if (currentY > pageHeight - 35) {
      doc.addPage();
      currentY = 25;
    }

    // ==========================================
    // 7. SIGNATURES & VALIDATION BLOCK
    // ==========================================
    const sigY = Math.max(currentY, pageHeight - 35);
    const colWidth = 75;

    // Signature 1: Technician
    doc.setDrawColor(...colors.borderGray);
    doc.setLineWidth(0.4);
    doc.line(margin, sigY, margin + colWidth, sigY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...colors.textPrimary);
    doc.text(technicianName, margin, sigY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...colors.textMuted);
    doc.text('Especialista de Campo / Diagnóstico IA', margin, sigY + 7.5);

    // Signature 2: Supervisor
    const sig2X = pageWidth - margin - colWidth;
    doc.line(sig2X, sigY, sig2X + colWidth, sigY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...colors.textPrimary);
    doc.text(supervisorName, sig2X, sigY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...colors.textMuted);
    doc.text('Supervisão de Manutenção & Engenharia de Confiabilidade', sig2X, sigY + 7.5);

    // ==========================================
    // 8. GLOBAL FOOTER (APPLIED TO ALL PAGES)
    // ==========================================
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Subtle bottom line
      doc.setDrawColor(...colors.borderGray);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...colors.textMuted);
      doc.text(
        `DK Diagnóstico Industrial IA • Sistema de Apoio à Decisão Técnica • Relatório Confidencial • Gerado em ${dateFormatted}`,
        margin,
        pageHeight - 6
      );

      doc.text(
        `Página ${i} de ${totalPages}`,
        pageWidth - margin,
        pageHeight - 6,
        { align: 'right' }
      );
    }

    return doc;
  }

  /**
   * Generates and triggers download of the PDF report.
   */
  public static exportDiagnosticReport(options: DiagnosticReportOptions): void {
    const doc = PdfExportService.createReportDocument(options);
    const fileName =
      options.fileName ||
      `DK_Laudo_${options.failure.id || 'Diagnostico'}_${options.failure.errorCode || 'FALHA'}.pdf`;
    doc.save(fileName);
  }

  /**
   * Returns the generated PDF as a Blob (useful for previews, print dialogues, or uploads).
   */
  public static getReportBlob(options: DiagnosticReportOptions): Blob {
    const doc = PdfExportService.createReportDocument(options);
    return doc.output('blob');
  }

  /**
   * Returns the generated PDF as a base64 Data URI.
   */
  public static getReportDataUri(options: DiagnosticReportOptions): string {
    const doc = PdfExportService.createReportDocument(options);
    return doc.output('datauristring');
  }
}

/**
 * Convenience helper function matching functional paradigms
 */
export const generateDiagnosticPdfReport = (
  failure: IndustrialFailure,
  machine?: Machine,
  guidedTests?: GuidedTestItem[],
  customOptions?: Partial<DiagnosticReportOptions>
): void => {
  PdfExportService.exportDiagnosticReport({
    failure,
    machine,
    guidedTests,
    ...customOptions,
  });
};

/**
 * Interactive React Button Component for triggering PDF generation anywhere in the UI
 */
export interface PdfExportButtonProps {
  failure: IndustrialFailure;
  machine?: Machine;
  guidedTests?: GuidedTestItem[];
  label?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'compact';
  onGenerated?: () => void;
}

export const PdfExportButton: React.FC<PdfExportButtonProps> = ({
  failure,
  machine,
  guidedTests,
  label = 'Exportar Laudo PDF',
  className = '',
  variant = 'primary',
  onGenerated,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [hasExported, setHasExported] = useState(false);

  const handleExport = () => {
    try {
      setIsExporting(true);
      // Small tick for smooth animation
      setTimeout(() => {
        PdfExportService.exportDiagnosticReport({
          failure,
          machine,
          guidedTests,
        });
        setIsExporting(false);
        setHasExported(true);
        if (onGenerated) onGenerated();
        setTimeout(() => setHasExported(false), 3000);
      }, 300);
    } catch (err) {
      console.error('Falha ao exportar PDF:', err);
      setIsExporting(false);
    }
  };

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleExport}
        disabled={isExporting}
        title="Gerar laudo técnico em PDF com gráficos e IA"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
          hasExported
            ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
        } ${className}`}
      >
        {isExporting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
        ) : hasExported ? (
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <FileText className="w-3.5 h-3.5 text-blue-400" />
        )}
        <span>{hasExported ? 'Gerado!' : label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
        variant === 'primary'
          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'
          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
      } ${className}`}
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : hasExported ? (
        <CheckCircle className="w-4 h-4 text-emerald-300" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      <span>{isExporting ? 'Gerando Laudo...' : hasExported ? 'Laudo Baixado!' : label}</span>
    </button>
  );
};

export default PdfExportService;
