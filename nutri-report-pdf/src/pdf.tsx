import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { ReportJSON } from 'nutri-core';
import { PDFOptions, CitationMeta, ULBadge } from './types';

// Create styles for deterministic formatting
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    paddingBottom: 5,
  },
  table: {
    display: 'table',
    width: 'auto',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    paddingVertical: 8,
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
    fontWeight: 'bold',
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
    paddingHorizontal: 4,
  },
  provenanceTableCell: {
    flex: 1,
    fontSize: 9,
    paddingHorizontal: 2,
  },
  ulBadge: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  ulGood: {
    color: '#22c55e',
  },
  ulWarn: {
    color: '#eab308',
  },
  ulError: {
    color: '#ef4444',
  },
  notesSection: {
    marginTop: 15,
  },
  noteItem: {
    fontSize: 10,
    marginBottom: 5,
    color: '#666666',
  },
  citationSection: {
    marginTop: 15,
  },
  citationItem: {
    fontSize: 9,
    marginBottom: 3,
    color: '#666666',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#999999',
  },
});

// Number formatter for consistent formatting
const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});

function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

function getULBadge(ulAlert: any): ULBadge {
  if (!ulAlert || ulAlert.severity === 'none') {
    return { symbol: '✓', color: 'green' };
  }
  if (ulAlert.severity === 'warn') {
    return { symbol: '!', color: 'yellow' };
  }
  return { symbol: '✕', color: 'red' };
}

function formatDate(isoString: string): string {
  const date = new Date(isoString + 'T00:00:00.000Z');
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function formatDateRange(startISO: string, endISO: string): string {
  const start = formatDate(startISO);
  const end = formatDate(endISO);
  return `${start} - ${end}`;
}

export function NutritionReportPDF({ report, options }: { report: ReportJSON; options: PDFOptions }) {
  const { stage, goals, limits, weekStartISO, sources, appVersion } = options;

  // Calculate week end (7 days from start)
  const weekStart = new Date(weekStartISO + 'T00:00:00.000Z');
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  const weekEndISO = weekEnd.toISOString().split('T')[0];

  const stageGoals = goals[stage];
  const stageULs = limits.UL[stage];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Maternal Nutrition Weekly Summary</Text>
          <Text style={styles.subtitle}>
            {stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Text>
          <Text style={styles.subtitle}>
            {formatDateRange(weekStartISO, weekEndISO)} • Version {appVersion}
          </Text>
        </View>

        {/* Key Outcomes Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Outcomes</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Nutrient</Text>
              <Text style={styles.tableCell}>Weekly Total</Text>
              <Text style={styles.tableCell}>Goal</Text>
              <Text style={styles.tableCell}>% Target</Text>
              <Text style={styles.tableCell}>UL</Text>
              <Text style={styles.tableCell}>Status</Text>
            </View>
            {Object.entries(report.nutrients).map(([nutrient, data]) => {
              const ulAlert = report.ulAlerts?.[nutrient];
              const ul = stageULs?.[nutrient];
              const goal = stageGoals?.[nutrient];
              const badge = getULBadge(ulAlert);

              return (
                <View key={nutrient} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{nutrient}</Text>
                  <Text style={styles.tableCell}>{formatNumber(data.weekly_total)}</Text>
                  <Text style={styles.tableCell}>{formatNumber(data.weekly_goal)}</Text>
                  <Text style={styles.tableCell}>{formatPercent(data.percent_target)}</Text>
                  <Text style={styles.tableCell}>{ul ? formatNumber(ul) : 'N/A'}</Text>
                  <Text style={[styles.tableCell, styles.ulBadge, styles[`ul${badge.color.charAt(0).toUpperCase() + badge.color.slice(1)}` as keyof typeof styles]]}>
                    {badge.symbol}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Provenance Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Provenance</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.provenanceTableCell}>Nutrient</Text>
              <Text style={styles.provenanceTableCell}>Source</Text>
              <Text style={styles.provenanceTableCell}>Confidence</Text>
              <Text style={styles.provenanceTableCell}>Flags</Text>
            </View>
            {Object.entries(report.nutrients).map(([nutrient, data]) => {
              const provenance = report.provenance[nutrient];
              const confidence = report.confidence[nutrient] || 0;

              return (
                <View key={nutrient} style={styles.tableRow}>
                  <Text style={styles.provenanceTableCell}>{nutrient}</Text>
                  <Text style={styles.provenanceTableCell}>{provenance}</Text>
                  <Text style={styles.provenanceTableCell}>{formatNumber(confidence)}</Text>
                  <Text style={styles.provenanceTableCell}>{(report.flags || []).join(', ') || 'None'}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Notes Section */}
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Data Quality Notes</Text>
          {report.flags && report.flags.length > 0 ? (
            report.flags.map((flag, index) => (
              <Text key={index} style={styles.noteItem}>• {flag}</Text>
            ))
          ) : (
            <Text style={styles.noteItem}>No data quality issues detected.</Text>
          )}
        </View>

        {/* Citations Section */}
        <View style={styles.citationSection}>
          <Text style={styles.sectionTitle}>References & Methodology</Text>
          {Object.entries(sources).map(([nutrient, citations]) => {
            const goalCitation = citations.goal;
            const ulCitation = citations.ul;

            return (
              <View key={nutrient}>
                {goalCitation && (
                  <Text style={styles.citationItem}>
                    {nutrient} Goal: {goalCitation.citation} (retrieved {goalCitation.retrieved_on})
                  </Text>
                )}
                {ulCitation && (
                  <Text style={styles.citationItem}>
                    {nutrient} UL: {ulCitation.citation} (retrieved {ulCitation.retrieved_on})
                  </Text>
                )}
              </View>
            );
          })}
          <Text style={styles.citationItem}>
            Methods: Values normalized to schema units. Vitamin A reported as Retinol Activity Equivalents (RAE). International Units (IU) not converted.
          </Text>
        </View>

        {/* Privacy Footer */}
        <View style={styles.footer}>
          <Text>
            No personal identifiers included. Generated on {new Date().toLocaleString('en-US', { timeZone: 'UTC' })}.
          </Text>
        </View>
      </Page>
    </Document>
  );
}



