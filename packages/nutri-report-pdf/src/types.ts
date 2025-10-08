import { LifeStage, Goals, Limits, ReportJSON } from 'nutri-core';

export interface CitationMeta {
  [nutrientKey: string]: {
    goal?: {
      citation: string;
      retrieved_on: string;
      url: string;
    };
    ul?: {
      citation: string;
      retrieved_on: string;
      url: string;
    };
  };
}

export interface PDFOptions {
  stage: LifeStage;
  goals: Goals;
  limits: Limits;
  weekStartISO: string;
  sources: CitationMeta;
  appVersion: string;
}

export interface ULBadge {
  symbol: '✓' | '!' | '✕';
  color: 'green' | 'yellow' | 'red';
}

