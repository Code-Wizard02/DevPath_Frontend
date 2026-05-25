import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, type CSSProperties } from "react";
import { z } from "zod";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "DevPath -- Aprende a programar y consigue trabajo en 6 meses" },
      {
        name: "description",
        content:
          "DevPath es el bootcamp mas intensivo de LATAM. Aprende a programar y consigue trabajo en 6 meses, con garantia de empleo.",
      },
    ],
  }),
});

const leadSchema = z.object({
  nombre: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .regex(/^[a-zA-Z\u00C0-\u017F\s]+$/, "El nombre solo puede contener letras y espacios"),
  telefono: z
    .string()
    .min(8, "El telefono debe tener al menos 8 digitos")
    .max(15, "El telefono no puede exceder 15 digitos")
    .regex(/^[0-9\s\-]+$/, "El telefono solo puede contener numeros, espacios y guiones"),
  email: z
    .string()
    .min(1, "El email es obligatorio")
    .email("Ingresa un email valido")
    .max(255, "El email no puede exceder 255 caracteres"),
  inicio: z.string().min(1, "Selecciona cuando quieres empezar"),
});

type LeadErrors = Partial<Record<keyof typeof leadSchema.shape, string>>;

function LeadForm() {
  const [accepted, setAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [lada, setLada] = useState("+52");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [inicio, setInicio] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<LeadErrors>({});

  const validateField = (name: keyof typeof leadSchema.shape, value: string) => {
    const partial = leadSchema.pick({ [name]: true } as any);
    const result = partial.safeParse({ [name]: value });
    if (!result.success) {
      return result.error.errors[0]?.message;
    }
    return undefined;
  };

  const fetchWithTimeout = (url: string, options: RequestInit, timeoutMs = 10000) => {
    return Promise.race([
      fetch(url, options),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), timeoutMs)),
    ]);
  };

  const getErrorMessage = (status: number): string => {
    if (status === 401 || status === 403)
      return "Error de autorizacion. Por favor intenta mas tarde.";
    if (status >= 500) return "El servidor no respondio. Intenta de nuevo en unos momentos.";
    return "No pudimos enviar tu informacion. Intenta de nuevo.";
  };

  const handleBlur = (name: keyof typeof leadSchema.shape, value: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleChange = (name: keyof typeof leadSchema.shape, value: string) => {
    if (name === "nombre") setNombre(value);
    if (name === "telefono") setTelefono(value);
    if (name === "email") setEmail(value);
    if (name === "inicio") setInicio(value);
    if (touched[name]) {
      const err = validateField(name, value);
      setFieldErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  if (submitted) {
    return (
      <div
        className="rounded-2xl border border-border-dark/50 p-8 text-center"
        style={{ background: "var(--canvas-elevated)" }}
      >
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold"
          style={{ background: "var(--brand)", color: "var(--canvas-deep)" }}
        >
          OK
        </div>
        <h3
          className="text-xl font-semibold text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Listo. Te contactamos pronto
        </h3>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          Revisa tu telefono en los proximos minutos
        </p>
      </div>
    );
  }

  const inputBase: CSSProperties = {
    background: "var(--canvas-deep)",
    border: "1px solid var(--border-dark)",
    borderRadius: 8,
    padding: "10px 14px",
    fontFamily: "var(--font-body)",
    fontSize: 14,
    width: "100%",
    color: "#fff",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const getInputStyle = (fieldName: string): CSSProperties => {
    const hasError = !!fieldErrors[fieldName as keyof LeadErrors];
    return {
      ...inputBase,
      borderColor: hasError ? "var(--rose)" : undefined,
    };
  };

  const labelStyle: CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: 12,
    fontWeight: 500,
    color: "var(--text-muted)",
    marginBottom: 6,
    display: "block",
  };

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!accepted || submitting) return;
        const result = leadSchema.safeParse({ nombre, telefono, email, inicio });
        if (!result.success) {
          const errors: LeadErrors = {};
          for (const err of result.error.errors) {
            const key = err.path[0] as keyof LeadErrors;
            if (!errors[key]) errors[key] = err.message;
          }
          setFieldErrors(errors);
          setTouched({ nombre: true, telefono: true, email: true, inicio: true });
          return;
        }
        setSubmitting(true);
        setError(null);
        try {
          const res = (await fetchWithTimeout(
            "https://hook.us2.make.com/9naat1jo6cw0bqqlheau4ylgih331jky",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                nombre,
                whatsapp: `${lada} ${telefono}`.trim(),
                lada,
                telefono,
                email,
                inicio,
                source: "devpath-landing",
                submittedAt: new Date().toISOString(),
              }),
            },
          )) as Response;
          if (!res.ok) {
            setError(getErrorMessage(res.status));
            return;
          }
          setSubmitted(true);
        } catch {
          setError("No pudimos enviar tu informacion. Intenta de nuevo.");
        } finally {
          setSubmitting(false);
        }
      }}
      className="rounded-2xl border border-border-dark/50 p-7"
      style={{ background: "var(--canvas-elevated)" }}
    >
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h3
            className="text-lg font-semibold text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Recibe informacion sin compromiso
          </h3>
          <p className="mt-1 text-xs" style={{ color: "var(--text-dim)" }}>
            Te contactamos en menos de 24 horas
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            console.log("Precargar demo clicked");
            setNombre("Angel Zorrilla");
            setLada("+52");
            setTelefono("9512103083");
            setEmail("whoangel.agl@gmail.com");
            setInicio("En 1 a 3 meses");
            setAccepted(true);
            setFieldErrors({});
            setTouched({});
          }}
          className="shrink-0 rounded-md px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-all duration-150 hover:opacity-80"
          style={{
            background: "var(--canvas-deep)",
            color: "var(--text-muted)",
            border: "1px solid var(--border-dark)",
            zIndex: 10,
            position: "relative",
          }}
          title="Precargar datos de prueba"
        >
          Precargar demo
        </button>
      </div>
      <div className="flex flex-col gap-4">
        <div>
          <label style={labelStyle}>Nombre</label>
          <input
            style={getInputStyle("nombre")}
            placeholder="Tu nombre completo"
            value={nombre}
            onChange={(e) => handleChange("nombre", e.target.value)}
            onBlur={(e) => handleBlur("nombre", e.target.value)}
          />
          {fieldErrors.nombre && (
            <p className="mt-1 text-xs" style={{ color: "var(--rose)" }}>
              {fieldErrors.nombre}
            </p>
          )}
        </div>

        <div>
          <label style={labelStyle}>Telefono</label>
          <div className="flex gap-2">
            <select
              style={{ ...getInputStyle("lada"), width: 80, flexShrink: 0 }}
              value={lada}
              onChange={(e) => setLada(e.target.value)}
            >
              <option value="+52">+52</option>
              <option value="+57">+57</option>
              <option value="+54">+54</option>
              <option value="+56">+56</option>
              <option value="+51">+51</option>
            </select>
            <input
              style={getInputStyle("telefono")}
              placeholder="55 1234 5678"
              type="tel"
              value={telefono}
              onChange={(e) => handleChange("telefono", e.target.value)}
              onBlur={(e) => handleBlur("telefono", e.target.value)}
            />
          </div>
          {fieldErrors.telefono && (
            <p className="mt-1 text-xs" style={{ color: "var(--rose)" }}>
              {fieldErrors.telefono}
            </p>
          )}
        </div>

        <div>
          <label style={labelStyle}>Email</label>
          <input
            style={getInputStyle("email")}
            placeholder="tu@email.com"
            type="email"
            value={email}
            onChange={(e) => handleChange("email", e.target.value)}
            onBlur={(e) => handleBlur("email", e.target.value)}
          />
          {fieldErrors.email && (
            <p className="mt-1 text-xs" style={{ color: "var(--rose)" }}>
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div>
          <label style={labelStyle}>Cuando quieres empezar?</label>
          <select
            style={getInputStyle("inicio")}
            value={inicio}
            onChange={(e) => handleChange("inicio", e.target.value)}
            onBlur={(e) => handleBlur("inicio", e.target.value)}
          >
            <option value="" disabled>
              Selecciona una opcion
            </option>
            <option>Este mes</option>
            <option>En 1 a 3 meses</option>
            <option>Solo explorando</option>
          </select>
          {fieldErrors.inicio && (
            <p className="mt-1 text-xs" style={{ color: "var(--rose)" }}>
              {fieldErrors.inicio}
            </p>
          )}
        </div>

        <div className="mt-1 flex items-start gap-3">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 cursor-pointer"
            style={{ accentColor: "var(--brand)" }}
          />
          <span className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Acepto que DevPath me contacte mediante llamadas, incluyendo automatizadas, con fines
            informativos y comerciales. Puedo revocar este consentimiento escribiendo a
            privacidad@devpath.mx.{" "}
            <a
              href="#"
              className="underline transition-colors hover:text-white"
              style={{ color: "var(--brand)" }}
            >
              Aviso de Privacidad
            </a>
          </span>
        </div>

        {error && (
          <div
            className="rounded-lg p-3 text-sm"
            style={{ background: "oklch(0.72 0.12 25 / 0.1)", color: "var(--rose)" }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!accepted || submitting}
          className="w-full rounded-lg py-3.5 text-sm font-semibold uppercase tracking-wide transition-all duration-200"
          style={{
            background: accepted && !submitting ? "var(--brand)" : "var(--canvas-deep)",
            color: accepted && !submitting ? "var(--canvas-deep)" : "var(--text-dim)",
            cursor: accepted && !submitting ? "pointer" : "not-allowed",
            boxShadow: accepted && !submitting ? "0 4px 20px var(--brand-glow)" : undefined,
          }}
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Enviando...
            </span>
          ) : (
            "Quiero informacion"
          )}
        </button>
      </div>
    </form>
  );
}

const COMPANIES = ["Mercado Libre", "Rappi", "Kavak", "BBVA", "Globant"];

const TESTIMONIALS = [
  {
    initials: "ML",
    name: "Maria Lopez",
    role: "Frontend Dev en Rappi",
    quote: "Pase de mesera a desarrolladora en 6 meses. DevPath cambio mi vida.",
    featured: true,
  },
  {
    initials: "JR",
    name: "Jorge Ramirez",
    role: "Backend Dev en Kavak",
    quote: "El soporte de carrera fue brutal. Tuve 3 ofertas antes de graduarme.",
  },
  {
    initials: "SC",
    name: "Sofia Castro",
    role: "Fullstack en Mercado Libre",
    quote: "Cero experiencia previa. Hoy gano 4x mas de lo que ganaba antes.",
  },
];

const PROGRAM_PHASES = [
  {
    num: "01",
    title: "Fundamentos",
    duration: "Meses 1 y 2",
    desc: "HTML, CSS, JavaScript y Git. Construyes tu primera app desde el dia uno.",
    skills: ["HTML", "CSS", "JavaScript", "Git"],
  },
  {
    num: "02",
    title: "Especializacion",
    duration: "Meses 3 y 4",
    desc: "Elige frontend con React o backend con Node.js. Bases de datos, APIs y deploy.",
    skills: ["React", "Node.js", "SQL", "APIs"],
  },
  {
    num: "03",
    title: "Carrera",
    duration: "Meses 5 y 6",
    desc: "Proyecto real con empresa partner. Preparacion de entrevistas y colocacion laboral.",
    skills: ["Portfolio", "Entrevistas", "Networking", "Placement"],
  },
];

function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className="fixed left-0 right-0 top-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "var(--canvas-deep)" : "transparent",
        borderBottom: scrolled ? "1px solid var(--border-dark)" : "1px solid transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <a
          href="/"
          className="text-2xl font-extrabold tracking-tight text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Dev<span style={{ color: "var(--brand)" }}>Path</span>
        </a>
        <div
          className="hidden gap-8 text-sm font-medium md:flex"
          style={{ color: "var(--text-muted)" }}
        >
          <a href="#programa" className="transition-colors hover:text-white">
            Programa
          </a>
          <a href="#egresados" className="transition-colors hover:text-white">
            Egresados
          </a>
          <a href="#precios" className="transition-colors hover:text-white">
            Precios
          </a>
        </div>
        <div className="flex gap-3">
          <a
            href="/dashboard"
            className="rounded-lg px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-colors hover:bg-white/10"
            style={{ color: "var(--text-muted)" }}
          >
            Iniciar sesion
          </a>
          <a
            href="#formulario"
            className="rounded-lg px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-85"
            style={{ background: "var(--brand)", color: "var(--canvas-deep)" }}
          >
            Aplicar
          </a>
        </div>
      </div>
    </nav>
  );
}

function Index() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--canvas)", fontFamily: "var(--font-body)" }}
    >
      <Nav />

      {/* HERO */}
      <section className="relative overflow-hidden pt-28">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 70% 40%, var(--brand-glow), transparent)," +
              "radial-gradient(ellipse 80% 60% at 30% 80%, oklch(0.15 0.02 50 / 0.5), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-16 md:pb-32 md:pt-24">
          <div className="grid items-start gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div className="animate-fade-up">
              <span
                className="mb-6 inline-block rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider"
                style={{
                  background: "var(--canvas-elevated)",
                  color: "var(--brand)",
                  border: "1px solid var(--border-dark)",
                }}
              >
                +500 egresados trabajando
              </span>
              <h1
                className="text-5xl font-extrabold leading-[1.05] tracking-tight text-white md:text-6xl lg:text-7xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Aprende a <span style={{ color: "var(--brand)" }}>programar</span>.
                <br />
                Consigue trabajo.
                <br />
                En 6 meses.
              </h1>
              <p
                className="mt-6 max-w-lg text-base leading-relaxed md:text-lg"
                style={{ color: "var(--text-muted)" }}
              >
                El bootcamp mas intensivo de LATAM. Sin experiencia previa. Con garantia de empleo o
                te devolvemos tu inversion.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#formulario"
                  className="inline-block rounded-lg px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-85"
                  style={{ background: "var(--brand)", color: "var(--canvas-deep)" }}
                >
                  Aplicar ahora
                </a>
                <a
                  href="#programa"
                  className="inline-block rounded-lg px-6 py-3 text-sm font-semibold uppercase tracking-wide transition-colors hover:border-white/50 hover:text-white"
                  style={{ color: "var(--text-muted)", border: "1px solid var(--border-dark)" }}
                >
                  Ver programa
                </a>
              </div>
              <div className="mt-14 flex flex-wrap items-center gap-6">
                <span
                  className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: "var(--text-dim)" }}
                >
                  Egresados en
                </span>
                <div
                  className="flex flex-wrap gap-5 text-xs font-medium tracking-wide"
                  style={{ fontFamily: "var(--font-display)", color: "var(--text-dim)" }}
                >
                  {COMPANIES.map((c) => (
                    <span key={c} className="transition-colors hover:text-white">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div id="formulario" className="animate-fade-up delay-200 lg:mt-8">
              <LeadForm />
            </div>
          </div>
        </div>
      </section>

      {/* PROGRAM */}
      <section id="programa" className="relative py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 animate-fade-up">
            <span
              className="mb-3 block text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--brand)" }}
            >
              Programa
            </span>
            <h2
              className="text-3xl font-extrabold tracking-tight text-white md:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Tres fases. Un objetivo.
            </h2>
            <p className="mt-3 max-w-md text-base" style={{ color: "var(--text-muted)" }}>
              Cada fase te acerca mas a tu primer empleo en tecnologia.
            </p>
          </div>
          <div className="relative">
            <div
              className="absolute left-5 top-0 bottom-0 w-px md:left-6"
              style={{ background: "linear-gradient(to bottom, var(--brand), var(--border-dark))" }}
            />
            <div className="space-y-12 md:space-y-16">
              {PROGRAM_PHASES.map((phase) => (
                <div key={phase.num} className="animate-fade-up relative pl-14 md:pl-16">
                  <div
                    className="absolute left-3 top-1 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold md:left-4 md:h-7 md:w-7"
                    style={{ background: "var(--brand)", color: "var(--canvas-deep)" }}
                  >
                    {phase.num}
                  </div>
                  <div>
                    <span
                      className="text-xs font-medium uppercase tracking-wider"
                      style={{ color: "var(--brand-dim)" }}
                    >
                      {phase.duration}
                    </span>
                    <h3
                      className="mt-1 text-2xl font-bold text-white md:text-3xl"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {phase.title}
                    </h3>
                    <p
                      className="mt-2 max-w-lg text-sm leading-relaxed"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {phase.desc}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {phase.skills.map((s) => (
                        <span
                          key={s}
                          className="rounded-md px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide"
                          style={{
                            background: "var(--canvas-elevated)",
                            color: "var(--text-muted)",
                            border: "1px solid var(--border-dark)",
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section
        id="egresados"
        className="py-24 md:py-32"
        style={{ background: "var(--canvas-deep)" }}
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 animate-fade-up">
            <span
              className="mb-3 block text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--brand)" }}
            >
              Egresados
            </span>
            <h2
              className="text-3xl font-extrabold tracking-tight text-white md:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Historias reales
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className={`animate-fade-up rounded-2xl border p-7 transition-colors hover:border-brand/30 ${t.featured ? "md:col-span-2 md:p-10" : ""}`}
                style={{
                  background: "var(--canvas-elevated)",
                  borderColor: "var(--border-dark)",
                }}
              >
                <div className="mb-5 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold"
                    style={{ background: "var(--brand)", color: "var(--canvas-deep)" }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs" style={{ color: "var(--text-dim)" }}>
                      {t.role}
                    </div>
                  </div>
                </div>
                <p
                  className={`leading-relaxed ${t.featured ? "text-lg md:text-xl" : "text-sm"}`}
                  style={{ color: t.featured ? "rgba(255,255,255,0.9)" : "var(--text-muted)" }}
                >
                  "{t.quote}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="precios" className="py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div
            className="animate-fade-up rounded-3xl border p-10 text-center md:p-16"
            style={{ background: "var(--canvas-elevated)", borderColor: "var(--border-dark)" }}
          >
            <span
              className="mb-4 block text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--brand)" }}
            >
              Inversion
            </span>
            <h2
              className="text-4xl font-extrabold tracking-tight text-white md:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              $4,999{" "}
              <span className="text-2xl font-medium" style={{ color: "var(--text-muted)" }}>
                MXN / mes
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm" style={{ color: "var(--text-muted)" }}>
              6 meses de programa intensivo. Incluye mentorias, proyecto real y soporte de carrera.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href="#formulario"
                className="inline-block rounded-lg px-8 py-3.5 text-sm font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-85"
                style={{ background: "var(--brand)", color: "var(--canvas-deep)" }}
              >
                Aplicar ahora
              </a>
              <div
                className="flex items-center gap-2 text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--brand)" }}
                />
                Garantia de empleo o reembolso
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t py-16" style={{ borderColor: "var(--border-dark)" }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-2">
              <div
                className="text-2xl font-extrabold tracking-tight text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Dev<span style={{ color: "var(--brand)" }}>Path</span>
              </div>
              <p
                className="mt-3 max-w-xs text-sm leading-relaxed"
                style={{ color: "var(--text-muted)" }}
              >
                El bootcamp mas intensivo de LATAM. Aprende a programar y consigue trabajo en 6
                meses.
              </p>
            </div>
            {[
              { title: "Programa", links: ["Plan de estudios", "Becas", "Garantia"] },
              { title: "Comunidad", links: ["Egresados", "Blog", "Eventos"] },
              { title: "Contacto", links: ["WhatsApp", "Email", "Soporte"] },
            ].map((col) => (
              <div key={col.title}>
                <div className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-white">
                  {col.title}
                </div>
                <ul className="flex flex-col gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
                  {col.links.map((l) => (
                    <li key={l}>
                      <a href="#" className="transition-colors hover:text-white">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div
            className="mt-12 flex flex-wrap items-center justify-between gap-4 text-xs"
            style={{
              color: "var(--text-dim)",
              borderTop: "1px solid var(--border-dark)",
              paddingTop: 24,
            }}
          >
            <span>2026 DevPath. Todos los derechos reservados.</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white">
                Privacidad
              </a>
              <a href="#" className="hover:text-white">
                Terminos
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
