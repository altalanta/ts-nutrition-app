import { renderToBuffer } from '@react-pdf/renderer';
import { ReportJSON } from 'nutri-core';
import { NutritionReportPDF } from './pdf';
import { PDFOptions, CitationMeta } from './types';

/**
 * Render a nutrition report PDF
 */
export async function renderReportPdf(
  report: ReportJSON,
  options: PDFOptions
): Promise<Uint8Array> {
  const element = <NutritionReportPDF report={report} options={options} />;

  // Render to buffer (Uint8Array)
  const buffer = await renderToBuffer(element);

  return buffer;
}

/**
 * Build citations map from goals and limits metadata
 */
export function buildCitationsMap(goals: any, limits: any): CitationMeta {
  const citations: CitationMeta = {};

  // Process goals metadata
  if (goals.metadata?.sources) {
    for (const [nutrient, sourceData] of Object.entries(goals.metadata.sources)) {
      if (sourceData && typeof sourceData === 'object') {
        citations[nutrient] = citations[nutrient] || {};
        if ('goal' in sourceData) {
          citations[nutrient].goal = sourceData.goal as any;
        }
      }
    }
  }

  // Process limits metadata
  if (limits.metadata?.sources) {
    for (const [nutrient, sourceData] of Object.entries(limits.metadata.sources)) {
      if (sourceData && typeof sourceData === 'object') {
        citations[nutrient] = citations[nutrient] || {};
        if ('ul' in sourceData) {
          citations[nutrient].ul = sourceData.ul as any;
        }
      }
    }
  }

  return citations;
}

/**
 * Get app version (could be from package.json or environment)
 */
export function getAppVersion(): string {
  try {
    const packageJson = require('../package.json');
    return packageJson.version || '1.0.0';
  } catch {
    return '1.0.0';
  }
}
