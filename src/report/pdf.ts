import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { reportsDir } from '../lib/reports';
import type { AuditResult } from '../types/audit';

type PdfClient = {
  name: string;
  websiteUrl: string;
  businessType: string;
  city: string;
  state: string;
};

function safe(value: unknown) {
  return String(value ?? '').replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '?');
}

function wrap(text: string, font: { widthOfTextAtSize: (text: string, size: number) => number }, size: number, maxWidth: number) {
  const words = safe(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.length > 0 ? lines : [''];
}

export async function generatePdf({
  client,
  auditId,
  result,
}: {
  client: PdfClient;
  auditId: string;
  result: AuditResult;
}) {
  const dir = reportsDir();
  await mkdir(dir, { recursive: true });

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const width = 595;
  const height = 842;
  const margin = 48;
  const maxWidth = width - margin * 2;

  let page = doc.addPage([width, height]);
  let y = height - margin;

  const newPage = () => {
    page = doc.addPage([width, height]);
    y = height - margin;
  };

  const ensure = (needed: number) => {
    if (y - needed < margin) newPage();
  };

  const drawLines = (
    lines: string[],
    options: { size?: number; font?: typeof font; color?: ReturnType<typeof rgb>; gap?: number },
  ) => {
    const size = options.size ?? 11;
    const usedFont = options.font ?? font;
    const color = options.color ?? rgb(0.1, 0.12, 0.16);
    const gap = options.gap ?? 4;
    for (const line of lines) {
      ensure(size + gap);
      page.drawText(line, { x: margin, y: y - size, size, font: usedFont, color });
      y -= size + gap;
    }
  };

  const heading = (text: string, size = 16) => {
    ensure(size + 14);
    y -= 8;
    drawLines([safe(text)], { size, font: bold, color: rgb(0.05, 0.2, 0.28) });
    y -= 4;
  };

  const paragraph = (text: string, size = 11) => {
    drawLines(wrap(text, font, size, maxWidth), { size });
  };

  drawLines(['Edgelink Technology'], { size: 12, font: bold, color: rgb(0.05, 0.35, 0.4) });
  drawLines(['SEO Audit Report'], { size: 26, font: bold });
  paragraph(`${client.name} · ${client.businessType}`);
  paragraph(`${client.websiteUrl}`);
  paragraph(`${client.city}, ${client.state}, India`);
  paragraph(`Generated ${new Date().toISOString().slice(0, 10)} · Audit ${auditId}`);

  heading('Overall score', 18);
  drawLines([`${result.overall_score} / 100`], { size: 32, font: bold, color: rgb(0.07, 0.33, 0.38) });

  heading('Score breakdown');
  for (const [key, value] of Object.entries(result.score_breakdown || {})) {
    paragraph(`${key.replaceAll('_', ' ')}: ${value}/100`);
  }

  heading('Executive summary');
  paragraph(result.executive_summary || '');

  heading('Critical issues');
  for (const issue of result.critical_issues || []) paragraph(`- ${issue}`);

  heading('Quick wins');
  for (const issue of result.quick_wins || []) paragraph(`- ${issue}`);

  heading('Recommendations');
  for (const item of result.recommendations || []) {
    ensure(40);
    drawLines(wrap(`${item.priority} · ${item.category}`, bold, 12, maxWidth), {
      size: 12,
      font: bold,
    });
    paragraph(`Finding: ${item.finding}`);
    paragraph(`Fix: ${item.fix}`);
    paragraph(`Impact: ${item.estimated_impact} · Effort: ${item.effort}`);
    paragraph(`Check: ${item.falsifiability_check}`);
    y -= 6;
  }

  const bytes = await doc.save();
  const filePath = path.join(dir, `audit-${auditId}.pdf`);
  await writeFile(filePath, bytes);
  return filePath;
}
