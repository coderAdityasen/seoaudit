import type { CheerioAPI } from 'cheerio';
import type { SchemaReport } from '../types/audit';

const TARGET_TYPES = new Set([
  'LocalBusiness',
  'Dentist',
  'MedicalBusiness',
  'RealEstateAgent',
]);

const REQUIRED_FIELDS = ['name', 'address', 'telephone', 'openingHours'] as const;

function typeName(type: string) {
  const slash = type.lastIndexOf('/');
  const hash = type.lastIndexOf('#');
  const cut = Math.max(slash, hash);
  return cut >= 0 ? type.slice(cut + 1) : type;
}

function addTypes(value: unknown, types: Set<string>, nodes: Record<string, unknown>[]) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) addTypes(item, types, nodes);
    return;
  }

  const record = value as Record<string, unknown>;
  const rawType = record['@type'];
  const names: string[] = [];
  if (typeof rawType === 'string') names.push(typeName(rawType));
  if (Array.isArray(rawType)) {
    for (const item of rawType) {
      if (typeof item === 'string') names.push(typeName(item));
    }
  }
  for (const name of names) types.add(name);
  if (names.length > 0) nodes.push(record);
  addTypes(record['@graph'], types, nodes);
}

function hasValue(record: Record<string, unknown>, field: string) {
  const value = record[field];
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined && typeof value === 'object';
}

export function validateSchema($: CheerioAPI): SchemaReport {
  const types = new Set<string>();
  const nodes: Record<string, unknown>[] = [];
  const errors: string[] = [];
  let blocks = 0;

  $('script[type="application/ld+json"]').each((_, element) => {
    const raw = $(element).text().trim();
    if (!raw) return;
    blocks += 1;
    try {
      addTypes(JSON.parse(raw), types, nodes);
    } catch {
      errors.push('A JSON-LD block could not be parsed.');
    }
  });

  const targetNodes = nodes.filter((node) => {
    const rawType = node['@type'];
    const names = Array.isArray(rawType) ? rawType : [rawType];
    return names.some((name) => typeof name === 'string' && TARGET_TYPES.has(typeName(name)));
  });

  if (targetNodes.length === 0) {
    errors.push(
      'No LocalBusiness, Dentist, MedicalBusiness, or RealEstateAgent schema was found.',
    );
  }

  for (const node of targetNodes) {
    for (const field of REQUIRED_FIELDS) {
      if (!hasValue(node, field)) {
        errors.push(`Schema is missing required field "${field}".`);
      }
    }
  }

  return {
    found: blocks > 0,
    types: [...types],
    valid: targetNodes.length > 0 && errors.length === 0,
    errors,
  };
}
