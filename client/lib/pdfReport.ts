import jsPDF from "jspdf";
import { sensorSchema, localToFirebaseMap } from "@/lib/sensors";
import { coerceBoolean, metricStatus, StatusLevel } from "@/lib/status";
import { formatTimestamp } from "@/lib/time";

const TEAL = "#0F766E";
const INK = "#1C1917";
const MUTED = "#78716C";
const STATUS_HEX: Record<StatusLevel, string> = {
  normal: "#16A34A",
  warning: "#D97706",
  critical: "#DC2626",
  offline: "#94A3B8",
};

type Packet = { ts: number; decoded?: Record<string, unknown> };

type Breach = {
  key: string;
  label: string;
  value: number | boolean;
  ts: number;
  severity: StatusLevel;
};

function collectBreaches(history: Packet[]): Breach[] {
  const breaches: Breach[] = [];

  for (const p of history) {
    if (!p.decoded) continue;

    for (const m of sensorSchema) {
      const fbKey = localToFirebaseMap[m.key];
      const value = p.decoded[fbKey] as number | boolean | undefined;
      const status = metricStatus(value, m as any);

      if (status === "warning" || status === "critical") {
        breaches.push({ key: m.key, label: m.label, value: value as number | boolean, ts: p.ts, severity: status });
      }
    }
  }

  return breaches.sort((a, b) => b.ts - a.ts);
}

function metricStats(history: Packet[], fbKey: string): { avg: number; min: number; max: number } | null {
  const values = history
    .map((p) => p.decoded?.[fbKey])
    .filter((v): v is number => typeof v === "number");

  if (values.length === 0) return null;

  const sum = values.reduce((a, b) => a + b, 0);
  return { avg: sum / values.length, min: Math.min(...values), max: Math.max(...values) };
}

/**
 * Builds and downloads the weekly health report as a client-side PDF.
 * `history` is the current rolling replay buffer returned by useSensors.
 * `currentHealthScore` is passed in rather than recomputed from the buffer's
 * raw latest entry — it should be the same last-known-good-based score shown
 * on the dashboard, so a record that's routinely missing a field doesn't make
 * the report's headline score look worse than what the page itself shows
 * (see "Last-Known-Good Value Handling" in Questions.md). The per-metric
 * avg/min/max table and breach list below still iterate the raw per-reading
 * buffer values, unrelated to this — those already skip missing fields
 * per-reading rather than needing carried-forward values.
 */
export function generateWeeklyReport(history: Packet[], transformerName: string, currentHealthScore: number) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 48;
  let y = 56;

  const sorted = [...history].sort((a, b) => a.ts - b.ts);
  const latest = sorted[sorted.length - 1];
  const earliest = sorted[0];
  const healthScore = currentHealthScore;
  const breaches = collectBreaches(sorted);
  const normalReadings = sorted.filter((p) =>
    sensorSchema.every((m) => metricStatus(p.decoded?.[localToFirebaseMap[m.key]] as any, m as any) === "normal"),
  ).length;
  const uptimePct = sorted.length ? Math.round((normalReadings / sorted.length) * 100) : 0;

  // Title
  doc.setTextColor(TEAL);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(transformerName, marginX, y);
  y += 22;
  doc.setFontSize(13);
  doc.text("Weekly Health Report", marginX, y);
  y += 24;

  doc.setDrawColor(TEAL);
  doc.setLineWidth(1.5);
  doc.line(marginX, y, 547, y);
  y += 20;

  // Meta
  doc.setFont("courier", "normal");
  doc.setFontSize(10);
  doc.setTextColor(MUTED);
  doc.text(
    `Coverage: ${earliest ? formatTimestamp(earliest.ts) : "-"}  to  ${latest ? formatTimestamp(latest.ts) : "-"}`,
    marginX,
    y,
  );
  y += 14;
  doc.text(`Generated on: ${formatTimestamp(Date.now())}`, marginX, y);
  y += 28;

  // Summary
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(TEAL);
  doc.text("Summary", marginX, y);
  y += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(INK);
  const summaryRows: [string, string][] = [
    ["System health score", `${healthScore} / 100`],
    ["Readings analyzed", `${sorted.length}`],
    ["Normal-operation uptime", `${uptimePct}%`],
    ["Threshold breaches", `${breaches.length}`],
  ];
  for (const [label, value] of summaryRows) {
    doc.setFont("helvetica", "normal");
    doc.text(label, marginX, y);
    doc.setFont("courier", "bold");
    doc.text(value, 300, y);
    y += 16;
  }
  y += 16;

  // Metric table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(TEAL);
  doc.text("Metric Averages (7-day window)", marginX, y);
  y += 16;

  const colX = { metric: marginX, avg: 260, min: 350, max: 440 };
  doc.setFontSize(9);
  doc.setTextColor(MUTED);
  doc.text("METRIC", colX.metric, y);
  doc.text("AVG", colX.avg, y);
  doc.text("MIN", colX.min, y);
  doc.text("MAX", colX.max, y);
  y += 6;
  doc.setDrawColor("#E7E5E4");
  doc.setLineWidth(0.75);
  doc.line(marginX, y, 547, y);
  y += 14;

  doc.setFontSize(10);
  for (const m of sensorSchema) {
    const fbKey = localToFirebaseMap[m.key];

    if (m.kind === "boolean") {
      // door/PIR arrive from Firebase as numeric 0|1, not native booleans — coerce
      // rather than require `typeof v === "boolean"` (see "Boolean Field Bug Fix"
      // in Questions.md), or every real door/PIR reading would be excluded here.
      const values = sorted.map((p) => coerceBoolean(p.decoded?.[fbKey])).filter((v): v is boolean => v !== undefined);
      const triggered = values.filter(Boolean).length;
      doc.setTextColor(INK);
      doc.setFont("helvetica", "normal");
      doc.text(m.label, colX.metric, y);
      doc.setFont("courier", "normal");
      doc.text(`triggered ${triggered}/${values.length}`, colX.avg, y);
      y += 15;
      continue;
    }

    const stats = metricStats(sorted, fbKey);
    doc.setTextColor(INK);
    doc.setFont("helvetica", "normal");
    doc.text(`${m.label}${m.unit ? ` (${m.unit})` : ""}`, colX.metric, y);
    doc.setFont("courier", "normal");
    doc.text(stats ? stats.avg.toFixed(1) : "-", colX.avg, y);
    doc.text(stats ? stats.min.toFixed(1) : "-", colX.min, y);
    doc.text(stats ? stats.max.toFixed(1) : "-", colX.max, y);
    y += 15;

    if (y > 760) {
      doc.addPage();
      y = 56;
    }
  }
  y += 20;

  // Breaches
  if (y > 700) {
    doc.addPage();
    y = 56;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(TEAL);
  doc.text("Threshold Breaches", marginX, y);
  y += 18;

  if (breaches.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(MUTED);
    doc.text("No threshold breaches recorded during this period.", marginX, y);
    y += 16;
  } else {
    const shown = breaches.slice(0, 40);

    doc.setFontSize(9);
    doc.setTextColor(MUTED);
    doc.text("METRIC", marginX, y);
    doc.text("VALUE", 220, y);
    doc.text("SEVERITY", 300, y);
    doc.text("TIMESTAMP", 390, y);
    y += 6;
    doc.line(marginX, y, 547, y);
    y += 14;

    doc.setFontSize(9.5);
    for (const b of shown) {
      if (y > 780) {
        doc.addPage();
        y = 56;
      }
      doc.setTextColor(INK);
      doc.setFont("helvetica", "normal");
      doc.text(b.label, marginX, y);
      doc.setFont("courier", "normal");
      const breachBool = coerceBoolean(b.value);
      doc.text(breachBool !== undefined ? (breachBool ? "TRIGGERED" : "CLEAR") : String(b.value), 220, y);
      doc.setTextColor(STATUS_HEX[b.severity]);
      doc.setFont("helvetica", "bold");
      doc.text(b.severity.toUpperCase(), 300, y);
      doc.setTextColor(MUTED);
      doc.setFont("courier", "normal");
      doc.text(formatTimestamp(b.ts), 390, y);
      y += 14;
    }

    if (breaches.length > shown.length) {
      y += 6;
      doc.setTextColor(MUTED);
      doc.setFont("helvetica", "italic");
      doc.text(`...and ${breaches.length - shown.length} more.`, marginX, y);
    }
  }

  const filename = `nust-transformer-weekly-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
