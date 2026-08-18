/* ============================================================================
   UI.JS — Icônes (style Lucide), formatage, composants React réutilisables
   ============================================================================ */
window.App = window.App || {};

App.UI = (function () {
  "use strict";
  const { useState, useEffect, useRef, useContext, createContext } = React;

  /* ---------------------------- Formatage ---------------------------------- */
  const Fmt = {
    num: (v) => (v == null || isNaN(v) ? "—" : new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(v) + " €"),
    num0: (v) => (v == null || isNaN(v) ? "—" : new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(v)),
    num2: (v) => (v == null || isNaN(v) ? "—" : new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(v)),
    pct: (v) => (v == null || isNaN(v) ? "—" : new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(v * 100) + " %"),
    int: (v) => (v == null || isNaN(v) ? "—" : new Intl.NumberFormat("fr-FR").format(Math.round(v))),
    date: (v) => (v ? new Date(v).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—"),
  };

  /* ---------------------------- Icônes (Lucide-like) ------------------------ */
  const ICONS = {
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
    chevronDown: '<polyline points="6 9 12 15 18 9"/>',
    chevronRight: '<polyline points="9 18 15 12 9 6"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="1"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/><line x1="9" y1="14" x2="9" y2="14.01"/><line x1="15" y1="14" x2="15" y2="14.01"/><path d="M9 22v-4h6v4"/>',
    bed: '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
    dollar: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    percent: '<line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    trendUp: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
    barChart: '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>',
    pieChart: '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
    fileText: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
    fileSpreadsheet: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h2"/><path d="M14 13h2"/><path d="M8 17h2"/><path d="M14 17h2"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    mapPin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>',
    alertTriangle: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    checkCircle: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    table: '<path d="M3 3h18v18H3z"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/>',
    sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    banknote: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
    externalLink: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
    landmark: '<line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7 12 2"/>',
    menu: '<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>',
    scale: '<path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
  };

  function Icon({ name, size = 18, className = "", strokeWidth = 2 }) {
    const inner = ICONS[name] || ICONS.info;
    return React.createElement("svg", {
      xmlns: "http://www.w3.org/2000/svg",
      width: size, height: size, viewBox: "0 0 24 24",
      fill: "none", stroke: "currentColor", strokeWidth,
      strokeLinecap: "round", strokeLinejoin: "round",
      className, dangerouslySetInnerHTML: { __html: inner },
    });
  }

  /* ---------------------------- Composants génériques ------------------------ */

  function Button({ children, variant = "primary", size = "md", className = "", icon, ...props }) {
    const base = "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent-gold)] focus-visible:ring-offset-[var(--bg)]";
    const sizes = { sm: "text-xs px-2.5 py-1.5", md: "text-sm px-3.5 py-2", lg: "text-sm px-5 py-2.5" };
    const variants = {
      primary: "bg-[var(--accent-gold)] text-[#1a1204] hover:brightness-110 shadow-sm shadow-black/10",
      secondary: "bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--accent-gold)]/50",
      ghost: "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]",
      danger: "bg-[var(--accent-red)]/10 text-[var(--accent-red)] border border-[var(--accent-red)]/30 hover:bg-[var(--accent-red)]/20",
      emerald: "bg-[var(--accent-emerald)] text-[#04211a] hover:brightness-110",
    };
    return React.createElement(
      "button",
      { className: `${base} ${sizes[size]} ${variants[variant]} ${className}`, ...props },
      icon ? React.createElement(Icon, { name: icon, size: size === "sm" ? 14 : 16 }) : null,
      children
    );
  }

  function IconButton({ name, className = "", size = 18, title, ...props }) {
    return React.createElement(
      "button",
      {
        title,
        className: `inline-flex items-center justify-center w-8 h-8 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)] ${className}`,
        ...props,
      },
      React.createElement(Icon, { name, size })
    );
  }

  function Card({ children, className = "", ...props }) {
    return React.createElement(
      "div",
      { className: `bg-[var(--surface)] border border-[var(--border)] rounded-xl ${className}`, ...props },
      children
    );
  }

  function Badge({ children, tone = "slate" }) {
    const tones = {
      slate: "bg-slate-500/15 text-slate-300 border-slate-500/30",
      amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      blue: "bg-blue-500/15 text-blue-300 border-blue-500/30",
      emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      red: "bg-red-500/15 text-red-300 border-red-500/30",
      gold: "bg-[var(--accent-gold)]/15 text-[var(--accent-gold)] border-[var(--accent-gold)]/30",
    };
    return React.createElement(
      "span",
      { className: `inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${tones[tone] || tones.slate}` },
      children
    );
  }

  function Modal({ open, onClose, title, children, width = "max-w-2xl", footer }) {
    if (!open) return null;
    return React.createElement(
      "div",
      { className: "fixed inset-0 z-50 flex items-center justify-center p-4", role: "dialog", "aria-modal": "true" },
      React.createElement("div", { className: "absolute inset-0 bg-black/60 backdrop-blur-sm", onClick: onClose }),
      React.createElement(
        "div",
        { className: `relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full ${width} max-h-[88vh] flex flex-col shadow-2xl` },
        React.createElement(
          "div",
          { className: "flex items-center justify-between px-6 py-4 border-b border-[var(--border)]" },
          React.createElement("h3", { className: "font-serif text-lg text-[var(--text)]" }, title),
          React.createElement(IconButton, { name: "x", onClick: onClose, title: "Fermer" })
        ),
        React.createElement("div", { className: "px-6 py-5 overflow-y-auto" }, children),
        footer ? React.createElement("div", { className: "px-6 py-4 border-t border-[var(--border)] flex items-center justify-end gap-2" }, footer) : null
      )
    );
  }

  function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Confirmer", danger = true }) {
    return React.createElement(
      Modal,
      { open, onClose, title, width: "max-w-md" },
      React.createElement("p", { className: "text-sm text-[var(--text-muted)] leading-relaxed" }, message),
      React.createElement(
        "div",
        { className: "flex justify-end gap-2 mt-6" },
        React.createElement(Button, { variant: "secondary", onClick: onClose }, "Annuler"),
        React.createElement(Button, { variant: danger ? "danger" : "primary", onClick: () => { onConfirm(); onClose(); } }, confirmLabel)
      )
    );
  }

  function Field({ label, children, hint, className = "" }) {
    return React.createElement(
      "label",
      { className: `block ${className}` },
      label ? React.createElement("span", { className: "block text-xs font-medium text-[var(--text-muted)] mb-1.5" }, label) : null,
      children,
      hint ? React.createElement("span", { className: "block text-[11px] text-[var(--text-muted)] mt-1" }, hint) : null
    );
  }

  const inputBase = "w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]/60 focus:outline-none focus:border-[var(--accent-gold)] focus:ring-1 focus:ring-[var(--accent-gold)]/40 transition-colors";

  function TextInput({ className = "", ...props }) {
    return React.createElement("input", { type: "text", className: inputBase + " " + className, ...props });
  }

  function NumberInput({ suffix, className = "", ...props }) {
    if (suffix) {
      return React.createElement(
        "div",
        { className: "relative" },
        React.createElement("input", { type: "number", className: inputBase + " pr-10 tabular-nums font-mono text-[13px] " + className, ...props }),
        React.createElement("span", { className: "absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]" }, suffix)
      );
    }
    return React.createElement("input", { type: "number", className: inputBase + " tabular-nums font-mono text-[13px] " + className, ...props });
  }

  function Select({ options, className = "", ...props }) {
    return React.createElement(
      "select",
      { className: inputBase + " " + className, ...props },
      options.map((o) => {
        const val = typeof o === "string" ? o : o.value;
        const label = typeof o === "string" ? o : o.label;
        return React.createElement("option", { key: val, value: val }, label);
      })
    );
  }

  function Textarea({ className = "", ...props }) {
    return React.createElement("textarea", { className: inputBase + " resize-y min-h-[90px] leading-relaxed " + className, ...props });
  }

  function StatCard({ icon, label, value, sub, tone = "default" }) {
    const toneClasses = {
      default: "text-[var(--text)]",
      emerald: "text-[var(--accent-emerald)]",
      red: "text-[var(--accent-red)]",
      gold: "text-[var(--accent-gold)]",
    };
    return React.createElement(
      Card,
      { className: "p-4 flex flex-col gap-1" },
      React.createElement(
        "div",
        { className: "flex items-center gap-2 text-[var(--text-muted)]" },
        icon ? React.createElement(Icon, { name: icon, size: 15 }) : null,
        React.createElement("span", { className: "text-[11px] uppercase tracking-wide font-medium" }, label)
      ),
      React.createElement("div", { className: `font-mono text-2xl font-semibold tabular-nums ${toneClasses[tone]}` }, value),
      sub ? React.createElement("div", { className: "text-[11px] text-[var(--text-muted)]" }, sub) : null
    );
  }

  function Toast({ toasts, dismiss }) {
    return React.createElement(
      "div",
      { className: "fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-80" },
      toasts.map((t) =>
        React.createElement(
          "div",
          {
            key: t.id,
            className: `flex items-start gap-2.5 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-sm text-sm animate-[fadeIn_.2s_ease] ${
              t.type === "error" ? "bg-red-950/90 border-red-500/40 text-red-200" : t.type === "success" ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-200" : "bg-[var(--surface-2)]/95 border-[var(--border)] text-[var(--text)]"
            }`,
          },
          React.createElement(Icon, { name: t.type === "error" ? "alertTriangle" : t.type === "success" ? "checkCircle" : "info", size: 16, className: "mt-0.5 shrink-0" }),
          React.createElement("span", { className: "flex-1" }, t.message),
          React.createElement(IconButton, { name: "x", size: 13, onClick: () => dismiss(t.id) })
        )
      )
    );
  }

  function EmptyState({ icon = "database", title, message, action }) {
    return React.createElement(
      "div",
      { className: "flex flex-col items-center justify-center text-center py-16 px-6" },
      React.createElement("div", { className: "w-14 h-14 rounded-full bg-[var(--surface-2)] flex items-center justify-center mb-4 text-[var(--accent-gold)]" }, React.createElement(Icon, { name: icon, size: 24 })),
      React.createElement("h3", { className: "font-serif text-lg text-[var(--text)] mb-1.5" }, title),
      React.createElement("p", { className: "text-sm text-[var(--text-muted)] max-w-sm mb-5" }, message),
      action
    );
  }

  function SectionTitle({ eyebrow, title, right }) {
    return React.createElement(
      "div",
      { className: "flex items-end justify-between mb-4 flex-wrap gap-3" },
      React.createElement(
        "div",
        null,
        eyebrow ? React.createElement("div", { className: "text-[11px] uppercase tracking-[0.14em] text-[var(--accent-gold)] font-semibold mb-1" }, eyebrow) : null,
        React.createElement("h2", { className: "font-serif text-xl text-[var(--text)]" }, title)
      ),
      right
    );
  }

  return {
    Fmt, Icon, ICONS,
    Button, IconButton, Card, Badge, Modal, ConfirmDialog,
    Field, TextInput, NumberInput, Select, Textarea,
    StatCard, Toast, EmptyState, SectionTitle,
  };
})();

/* Contexte React global partagé par tous les onglets : projet courant, état
   applicatif et helpers de mutation (voir app.js pour le Provider). */
App.Ctx = React.createContext(null);
