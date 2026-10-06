import { IndustrialFailure, Machine } from '../types';
import { PdfExportService, GuidedTestItem } from '../services/PdfExportService';

export const generateIndustrialReportPDF = (
  failure: IndustrialFailure,
  machine?: Machine,
  guidedTests?: Array<{ test: string; result: 'ok' | 'failed' | 'untested' }>
) => {
  PdfExportService.exportDiagnosticReport({
    failure,
    machine,
    guidedTests: guidedTests as GuidedTestItem[],
  });
};

export { PdfExportService };
