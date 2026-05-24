import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "DevPath -- Dashboard de Leads" },
      { name: "description", content: "Panel interno de leads cualificados de DevPath." },
    ],
  }),
});

const FORM_ENDPOINT = "https://hook.us2.make.com/88zvyt4conitq554ad5ew3552r8nirn8";
const QUAL_ENDPOINT = "https://hook.us2.make.com/onyoz8h8g2pb76yttq50m5si91u6faxi";

interface FormLead {
  nombre: string;
  lada: string;
  telefono: string;
  email: string;
  inicio: string;
  source: string;
  submittedAt: string;
}

interface QualificationLead {
  status: string;
  score: string;
  category: string;
  presupuesto: string;
  interes: string;
  prioridad: string;
  accion: string;
  summary: string;
  preguntas: string;
  senalesPositivas: string;
  senalesNegativas: string;
  mensaje: string;
}

interface Lead extends FormLead, QualificationLead {
  id: string;
}

function parseFormLead(raw: Record<string, string>): FormLead {
  const lada = raw["2"] ?? "+52";
  return {
    nombre: (raw["0"] ?? "Sin nombre").trim(),
    lada,
    telefono: raw["3"] ?? "--",
    email: raw["4"] ?? "--",
    inicio: raw["5"] ?? "--",
    source: raw["6"] ?? "--",
    submittedAt: raw["7"] ?? "",
  };
}

function parseQualification(raw: Record<string, string | null>): QualificationLead {
  const status = raw["0"] ?? "";
  const score = raw["1"] ?? "";
  const hasData = status || score;
  return {
    status: hasData ? status : "pending",
    score: hasData ? score : "",
    category: hasData ? (raw["2"] ?? "") : "sin_calificar",
    presupuesto: hasData ? (raw["3"] ?? "") : "-",
    interes: hasData ? (raw["4"] ?? "") : "-",
    prioridad: hasData ? (raw["5"] ?? "") : "-",
    accion: hasData ? (raw["6"] ?? "") : "pendiente",
    summary: hasData ? (raw["8"] ?? "") : "Sin calificacion aun",
    preguntas: hasData ? (raw["9"] ?? "") : "",
    senalesPositivas: hasData ? (raw["10"] ?? "") : "",
    senalesNegativas: hasData ? (raw["11"] ?? "") : "",
    mensaje: hasData ? (raw["12"] ?? "") : "",
  };
}

function joinLeads(forms: FormLead[], quals: QualificationLead[]): Lead[] {
  return forms.map((f, i) => ({
    id: `lead-${i}`,
    ...f,
    ...(quals[i] ?? {
      status: "pending",
      score: "",
      category: "sin_calificar",
      presupuesto: "-",
      interes: "-",
      prioridad: "-",
      accion: "pendiente",
      summary: "Sin calificacion aun",
      preguntas: "",
      senalesPositivas: "",
      senalesNegativas: "",
      mensaje: "",
    }),
  }));
}

function levelBadge(value: string) {
  const map: Record<string, { bg: string; text: string; dot: string }> = {
    alto: {
      bg: "oklch(0.78 0.14 145 / 0.12)",
      text: "oklch(0.38 0.12 145)",
      dot: "oklch(0.55 0.14 145)",
    },
    media: {
      bg: "oklch(0.82 0.14 85 / 0.12)",
      text: "oklch(0.45 0.12 80)",
      dot: "oklch(0.6 0.12 80)",
    },
    baja: {
      bg: "oklch(0.72 0.12 25 / 0.1)",
      text: "oklch(0.55 0.12 25)",
      dot: "oklch(0.55 0.12 25)",
    },
  };
  const c = map[value.toLowerCase()] ?? {
    bg: "oklch(0.94 0.004 106)",
    text: "oklch(0.48 0.02 106)",
    dot: "oklch(0.6 0.02 106)",
  };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ background: c.bg, color: c.text }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.dot }} />
      {value.charAt(0).toUpperCase() + value.slice(1)}
    </span>
  );
}

function actionBadge(value: string) {
  const isUrgent = value.toLowerCase().includes("contactar");
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{
        background: isUrgent ? "oklch(0.78 0.16 75 / 0.12)" : "oklch(0.94 0.004 106)",
        color: isUrgent ? "oklch(0.5 0.14 70)" : "oklch(0.48 0.02 106)",
      }}
    >
      {isUrgent && (
        <span
          className="h-1.5 w-1.5 rounded-full animate-pulse"
          style={{ background: "oklch(0.5 0.14 70)" }}
        />
      )}
      {value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
}

function scoreBadge(score: string) {
  const num = parseInt(score, 10);
  if (isNaN(num))
    return (
      <span className="text-sm tabular-nums" style={{ color: "var(--muted-foreground)" }}>
        --
      </span>
    );
  const color =
    num >= 70 ? "oklch(0.45 0.12 145)" : num >= 40 ? "oklch(0.5 0.12 80)" : "oklch(0.55 0.12 25)";
  return (
    <span
      className="text-lg font-bold tabular-nums"
      style={{ color, fontFamily: "var(--font-display)" }}
    >
      {num}
    </span>
  );
}

function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterAccion, setFilterAccion] = useState<string>("todas");

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [formRes, qualRes] = await Promise.allSettled([
        fetch(FORM_ENDPOINT),
        fetch(QUAL_ENDPOINT),
      ]);

      let forms: FormLead[] = [];
      let quals: QualificationLead[] = [];

      if (formRes.status === "fulfilled" && formRes.value.ok) {
        const text = await formRes.value.text();
        try {
          const data = JSON.parse(text);
          const items = Array.isArray(data) ? data : [];
          forms = items.map((raw: Record<string, string>) => parseFormLead(raw));
        } catch {
          console.warn("Form endpoint returned non-JSON:", text.slice(0, 100));
        }
      }

      if (qualRes.status === "fulfilled" && qualRes.value.ok) {
        const text = await qualRes.value.text();
        try {
          const data = JSON.parse(text);
          const items = Array.isArray(data) ? data : [];
          quals = items.map((raw: Record<string, string>) => parseQualification(raw));
        } catch {
          console.warn("Qual endpoint returned non-JSON:", text.slice(0, 100));
        }
      }

      setLeads(joinLeads(forms, quals));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar leads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const matchesQ =
        !query ||
        l.nombre.toLowerCase().includes(query.toLowerCase()) ||
        l.email.toLowerCase().includes(query.toLowerCase()) ||
        l.score.includes(query);
      const matchesF =
        filterAccion === "todas" || l.accion.toLowerCase().includes(filterAccion.toLowerCase());
      return matchesQ && matchesF;
    });
  }, [leads, query, filterAccion]);

  const acciones = useMemo(() => {
    const set = new Set(leads.map((l) => l.accion));
    return ["todas", ...Array.from(set)];
  }, [leads]);

  const total = leads.length;
  const avgScore =
    total > 0 ? Math.round(leads.reduce((s, l) => s + (parseInt(l.score, 10) || 0), 0) / total) : 0;
  const highIntent = leads.filter((l) => l.interes.toLowerCase() === "alta").length;
  const highBudget = leads.filter((l) => l.presupuesto.toLowerCase() === "alto").length;
  const pendingQual = leads.filter((l) => l.status === "pending" || !l.score).length;

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--panel)", fontFamily: "var(--font-body)" }}
    >
      {/* Nav */}
      <nav
        className="border-b"
        style={{ borderColor: "oklch(0.92 0.004 106)", background: "oklch(0.995 0.002 106)" }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <span
              className="text-lg font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Dev<span style={{ color: "var(--accent-blue)" }}>Path</span>
            </span>
            <span className="h-4 w-px" style={{ background: "oklch(0.9 0.004 106)" }} />
            <span className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
              Leads
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchLeads}
              disabled={loading}
              className="flex h-7 w-7 items-center justify-center rounded-full transition-all hover:opacity-70 disabled:opacity-40"
              style={{ background: "var(--panel-soft)" }}
              title="Actualizar"
            >
              <svg
                className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
                style={{ color: "var(--muted-foreground)" }}
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M2 8a6 6 0 0111.33-3.18M14 8a6 6 0 01-11.33 3.18"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M14 2v3h-3M2 14v-3h3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Pipeline de leads
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
            Formulario + calificacion automatica de intencion y presupuesto
          </p>
        </div>

        {/* Metrics */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div
            className="rounded-xl border p-4"
            style={{ background: "#fff", borderColor: "oklch(0.92 0.004 106)" }}
          >
            <div
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--muted-foreground)" }}
            >
              Total leads
            </div>
            <div
              className="mt-1 text-3xl font-bold tabular-nums tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {total}
            </div>
          </div>
          <div
            className="rounded-xl border p-4"
            style={{
              background: "oklch(0.78 0.14 145 / 0.06)",
              borderColor: "oklch(0.78 0.14 145 / 0.15)",
            }}
          >
            <div
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: "oklch(0.45 0.1 145)" }}
            >
              Score promedio
            </div>
            <div
              className="mt-1 text-3xl font-bold tabular-nums tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "oklch(0.35 0.12 145)" }}
            >
              {avgScore}
            </div>
          </div>
          <div
            className="rounded-xl border p-4"
            style={{ background: "#fff", borderColor: "oklch(0.92 0.004 106)" }}
          >
            <div
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--muted-foreground)" }}
            >
              Alta intencion
            </div>
            <div
              className="mt-1 text-3xl font-bold tabular-nums tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "oklch(0.5 0.12 80)" }}
            >
              {highIntent}
            </div>
          </div>
          <div
            className="rounded-xl border p-4"
            style={{ background: "#fff", borderColor: "oklch(0.92 0.004 106)" }}
          >
            <div
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--muted-foreground)" }}
            >
              Sin calificar
            </div>
            <div
              className="mt-1 text-3xl font-bold tabular-nums tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "oklch(0.55 0.12 25)" }}
            >
              {pendingQual}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative flex-1 basis-64">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: "var(--muted-foreground)" }}
              viewBox="0 0 16 16"
              fill="none"
            >
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M11 11l3.5 3.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="text"
              placeholder="Buscar nombre, email o score..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg text-sm outline-none transition-all"
              style={{
                background: "#fff",
                border: "1px solid oklch(0.9 0.004 106)",
                padding: "9px 12px 9px 34px",
                color: "var(--foreground)",
              }}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {acciones.map((f) => {
              const isActive = filterAccion === f;
              const label = f === "todas" ? "Todas" : f.replace(/_/g, " ");
              return (
                <button
                  key={f}
                  onClick={() => setFilterAccion(f)}
                  className="rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150"
                  style={{
                    background: isActive ? "var(--accent-blue)" : "#fff",
                    color: isActive ? "#fff" : "var(--muted-foreground)",
                    border: `1px solid ${isActive ? "var(--accent-blue)" : "oklch(0.9 0.004 106)"}`,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div
          className="overflow-hidden rounded-xl border"
          style={{ background: "#fff", borderColor: "oklch(0.92 0.004 106)" }}
        >
          {error && (
            <div
              className="flex items-center justify-between border-b px-4 py-2 text-xs"
              style={{
                borderColor: "oklch(0.92 0.004 106)",
                background: "oklch(0.72 0.12 25 / 0.05)",
                color: "oklch(0.55 0.12 25)",
              }}
            >
              <span>{error}</span>
              <button onClick={fetchLeads} className="underline">
                Reintentar
              </button>
            </div>
          )}
          {loading ? (
            <div className="py-16 text-center">
              <div
                className="mx-auto mb-3 h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
                style={{ borderColor: "var(--accent-blue)", borderTopColor: "transparent" }}
              />
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                Cargando leads...
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
                No hay leads con este filtro
              </p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full border-collapse">
                  <thead>
                    <tr style={{ borderBottom: "1px solid oklch(0.92 0.004 106)" }}>
                      {[
                        { label: "Nombre", w: "12%" },
                        { label: "Email", w: "14%" },
                        { label: "Telefono", w: "12%" },
                        { label: "Score", w: "7%" },
                        { label: "Presupuesto", w: "10%" },
                        { label: "Interes", w: "8%" },
                        { label: "Accion", w: "12%" },
                        { label: "Resumen", w: "25%" },
                      ].map(({ label, w }) => (
                        <th
                          key={label}
                          className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider"
                          style={{
                            color: "var(--muted-foreground)",
                            userSelect: "none",
                            whiteSpace: "nowrap",
                            width: w,
                          }}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((l) => {
                      const expanded = expandedId === l.id;
                      return (
                        <tr key={l.id} style={{ borderBottom: "1px solid oklch(0.94 0.004 106)" }}>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium">{l.nombre}</div>
                            <div
                              className="text-[10px] tabular-nums"
                              style={{ color: "var(--text-dim)" }}
                            >
                              {l.submittedAt
                                ? new Date(l.submittedAt).toLocaleDateString("es-MX")
                                : ""}
                            </div>
                          </td>
                          <td
                            className="px-4 py-3 text-sm tabular-nums truncate max-w-[160px]"
                            style={{ color: "var(--muted-foreground)" }}
                            title={l.email}
                          >
                            {l.email}
                          </td>
                          <td
                            className="px-4 py-3 text-sm tabular-nums"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            {l.lada} {l.telefono}
                          </td>
                          <td className="px-4 py-3">{scoreBadge(l.score)}</td>
                          <td className="px-4 py-3">{levelBadge(l.presupuesto)}</td>
                          <td className="px-4 py-3">{levelBadge(l.interes)}</td>
                          <td className="px-4 py-3">{actionBadge(l.accion)}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setExpandedId(expanded ? null : l.id)}
                              className="text-left text-xs leading-relaxed line-clamp-2 hover:text-foreground transition-colors"
                              style={{ color: "var(--muted-foreground)" }}
                            >
                              {l.summary}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Expanded detail panel */}
              {expandedId &&
                (() => {
                  const lead = leads.find((l) => l.id === expandedId);
                  if (!lead) return null;
                  return (
                    <div
                      className="border-t p-6"
                      style={{
                        background: "oklch(0.98 0.002 106)",
                        borderColor: "oklch(0.92 0.004 106)",
                      }}
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <h3
                          className="text-sm font-semibold"
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          Detalle: {lead.nombre}
                        </h3>
                        <button
                          onClick={() => setExpandedId(null)}
                          className="text-xs underline"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          Cerrar
                        </button>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <div
                            className="mb-1 text-[10px] font-semibold uppercase tracking-wider"
                            style={{ color: "oklch(0.45 0.1 145)" }}
                          >
                            Senales positivas
                          </div>
                          <p
                            className="text-sm leading-relaxed"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            {lead.senalesPositivas || "N/A"}
                          </p>
                        </div>
                        <div>
                          <div
                            className="mb-1 text-[10px] font-semibold uppercase tracking-wider"
                            style={{ color: "oklch(0.55 0.12 25)" }}
                          >
                            Senales negativas
                          </div>
                          <p
                            className="text-sm leading-relaxed"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            {lead.senalesNegativas || "N/A"}
                          </p>
                        </div>
                        <div>
                          <div
                            className="mb-1 text-[10px] font-semibold uppercase tracking-wider"
                            style={{ color: "oklch(0.5 0.12 80)" }}
                          >
                            Preguntas clave
                          </div>
                          <p
                            className="text-sm leading-relaxed"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            {lead.preguntas || "N/A"}
                          </p>
                        </div>
                        <div>
                          <div
                            className="mb-1 text-[10px] font-semibold uppercase tracking-wider"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            Mensaje sugerido
                          </div>
                          <p
                            className="text-sm leading-relaxed"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            {lead.mensaje || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              {/* Mobile */}
              <div className="md:hidden">
                {filtered.map((l) => {
                  const expanded = expandedId === l.id;
                  return (
                    <div key={l.id} style={{ borderBottom: "1px solid oklch(0.94 0.004 106)" }}>
                      <div className="p-4">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold">{l.nombre}</div>
                            <div
                              className="mt-0.5 text-xs tabular-nums"
                              style={{ color: "var(--muted-foreground)" }}
                            >
                              {l.lada} {l.telefono}
                            </div>
                            <div
                              className="mt-0.5 text-xs truncate max-w-[200px]"
                              style={{ color: "var(--muted-foreground)" }}
                            >
                              {l.email}
                            </div>
                          </div>
                          {scoreBadge(l.score)}
                        </div>
                        <div
                          className="flex items-center gap-4 text-xs mb-3"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          <div>
                            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider">
                              Presupuesto
                            </span>
                            {levelBadge(l.presupuesto)}
                          </div>
                          <div>
                            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider">
                              Interes
                            </span>
                            {levelBadge(l.interes)}
                          </div>
                          <div>
                            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider">
                              Accion
                            </span>
                            {actionBadge(l.accion)}
                          </div>
                        </div>
                        <button
                          onClick={() => setExpandedId(expanded ? null : l.id)}
                          className="text-left text-xs leading-relaxed line-clamp-2"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          {l.summary}
                        </button>
                      </div>
                      {expanded && (
                        <div
                          className="border-t p-4"
                          style={{
                            background: "oklch(0.98 0.002 106)",
                            borderColor: "oklch(0.92 0.004 106)",
                          }}
                        >
                          <div className="mb-4 flex items-center justify-between">
                            <h3
                              className="text-sm font-semibold"
                              style={{ fontFamily: "var(--font-display)" }}
                            >
                              Detalle
                            </h3>
                            <button
                              onClick={() => setExpandedId(null)}
                              className="text-xs underline"
                              style={{ color: "var(--muted-foreground)" }}
                            >
                              Cerrar
                            </button>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <div
                                className="mb-1 text-[10px] font-semibold uppercase tracking-wider"
                                style={{ color: "oklch(0.45 0.1 145)" }}
                              >
                                Senales positivas
                              </div>
                              <p
                                className="text-sm leading-relaxed"
                                style={{ color: "var(--muted-foreground)" }}
                              >
                                {l.senalesPositivas || "N/A"}
                              </p>
                            </div>
                            <div>
                              <div
                                className="mb-1 text-[10px] font-semibold uppercase tracking-wider"
                                style={{ color: "oklch(0.55 0.12 25)" }}
                              >
                                Senales negativas
                              </div>
                              <p
                                className="text-sm leading-relaxed"
                                style={{ color: "var(--muted-foreground)" }}
                              >
                                {l.senalesNegativas || "N/A"}
                              </p>
                            </div>
                            <div>
                              <div
                                className="mb-1 text-[10px] font-semibold uppercase tracking-wider"
                                style={{ color: "oklch(0.5 0.12 80)" }}
                              >
                                Preguntas
                              </div>
                              <p
                                className="text-sm leading-relaxed"
                                style={{ color: "var(--muted-foreground)" }}
                              >
                                {l.preguntas || "N/A"}
                              </p>
                            </div>
                            <div>
                              <div
                                className="mb-1 text-[10px] font-semibold uppercase tracking-wider"
                                style={{ color: "var(--muted-foreground)" }}
                              >
                                Mensaje
                              </div>
                              <p
                                className="text-sm leading-relaxed"
                                style={{ color: "var(--muted-foreground)" }}
                              >
                                {l.mensaje || "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Footer */}
          <div
            className="flex items-center justify-between border-t px-4 py-2.5 text-xs"
            style={{ borderColor: "oklch(0.92 0.004 106)", color: "var(--muted-foreground)" }}
          >
            <span>
              {filtered.length} de {leads.length} leads
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
