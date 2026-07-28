"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  ArrowRight, ArrowUpRight, Calendar, Clapperboard, Megaphone,
  MonitorSmartphone, PenLine, Send, Sparkles, ThumbsUp, Bot,
  CheckCircle2, Play, Palette, Instagram,
} from "lucide-react";

/* ============================================================
   YPHE — Landing page institucional
   Pública em /site. Usa os assets oficiais de public/brand.
   ============================================================ */

const AZUL = "#20BCED";
const AZUL_PROFUNDO = "#052699";
const CIANO_CLARO = "#97E9FF";

const fadeUp = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.21, 0.6, 0.35, 1] },
};

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, delay: i * 0.1, ease: [0.21, 0.6, 0.35, 1] },
});

const SERVICOS = [
  { icon: Calendar, titulo: "Calendário editorial", desc: "Planejamento mensal completo: temas, formatos e cadência pensados para a autoridade da sua marca." },
  { icon: PenLine, titulo: "Copy & roteiro", desc: "Roteiros com tom de voz documentado por cliente. Nada de texto genérico — cada linha respeita a sua identidade." },
  { icon: Clapperboard, titulo: "Captação & edição", desc: "Gravação profissional na sua clínica e edição que prende atenção nos 3 primeiros segundos." },
  { icon: Palette, titulo: "Design", desc: "Carrosséis e artes com direção visual própria, do grid do feed às peças de campanha." },
  { icon: Megaphone, titulo: "Tráfego pago", desc: "Os conteúdos de melhor desempenho viram anúncio. Orgânico e mídia paga trabalhando juntos." },
  { icon: Bot, titulo: "Tecnologia", desc: "Chatbot de atendimento, sites e o nosso sistema próprio de gestão de conteúdo — o NEXUS." },
];

const PIPELINE = [
  { n: "01", titulo: "Estratégia", desc: "Agenda, calendário e roteiros definidos com você" },
  { n: "02", titulo: "Produção", desc: "Captação otimizada e edição com identidade" },
  { n: "03", titulo: "Aprovação", desc: "Você revisa tudo num portal exclusivo, sem WhatsApp" },
  { n: "04", titulo: "Publicação & mídia", desc: "Post no ar na data certa e impulsionamento do que performa" },
];

const NUMEROS = [
  { valor: "90+", label: "produções por mês" },
  { valor: "4", label: "etapas de qualidade por conteúdo" },
  { valor: "100%", label: "aprovado por você antes de ir ao ar" },
  { valor: "1", label: "sistema próprio de gestão" },
];

export default function SitePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  return (
    <div className="min-h-screen bg-[#0d1017] text-[#DCE3EB] overflow-x-hidden selection:bg-cyan-400/30">
      {/* ===== NAV ===== */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-[#0d1017]/70 border-b border-white/5"
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <img src="/brand/logo-yphe.svg" alt="YPHE" className="h-5 w-auto brightness-0 invert" />
          <nav className="hidden md:flex items-center gap-8 text-sm text-white/60">
            <a href="#servicos" className="hover:text-white transition-colors">Serviços</a>
            <a href="#metodo" className="hover:text-white transition-colors">Método</a>
            <a href="#portal" className="hover:text-white transition-colors">Portal</a>
          </nav>
          <a href="#contato"
            className="group flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-[#0d1017] transition-transform hover:scale-[1.03]"
            style={{ background: `linear-gradient(90deg, ${AZUL}, ${CIANO_CLARO})` }}>
            Falar com a YPHE
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </motion.header>

      {/* ===== HERO ===== */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* fundo oficial com parallax */}
        <motion.div
          style={{ y: heroY }}
          className="absolute inset-0 scale-110"
        >
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(/brand/degrade-hero.png)" }} />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0d1017]/60 via-[#0d1017]/40 to-[#0d1017]" />
        </motion.div>

        {/* brilhos flutuantes */}
        <motion.div
          animate={{ y: [0, -24, 0], opacity: [0.35, 0.6, 0.35] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[480px] h-[480px] rounded-full blur-[140px] -top-24 -right-24 pointer-events-none"
          style={{ background: AZUL + "33" }}
        />
        <motion.div
          animate={{ y: [0, 20, 0], opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[420px] h-[420px] rounded-full blur-[140px] bottom-0 -left-32 pointer-events-none"
          style={{ background: AZUL_PROFUNDO + "66" }}
        />

        <motion.div style={{ opacity: heroOpacity }} className="relative z-10 max-w-4xl mx-auto px-6 text-center pt-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur text-xs text-white/70 mb-8"
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: AZUL }} />
            Agência de conteúdo para clínicas e médicos
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35, ease: [0.21, 0.6, 0.35, 1] }}
            className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight"
          >
            Sua autoridade médica,
            <br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(90deg, ${CIANO_CLARO}, ${AZUL}, ${CIANO_CLARO})` }}>
              construída todos os dias.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55 }}
            className="mt-6 text-lg text-white/60 max-w-2xl mx-auto leading-relaxed"
          >
            Estratégia, produção audiovisual, design e tráfego — com um pipeline de 4 etapas
            e um portal onde você aprova cada conteúdo antes de ir ao ar.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.75 }}
            className="mt-10 flex items-center justify-center gap-4 flex-wrap"
          >
            <a href="#contato"
              className="group flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-[#0d1017] transition-transform hover:scale-[1.04]"
              style={{ background: `linear-gradient(90deg, ${AZUL}, ${CIANO_CLARO})`, boxShadow: `0 8px 40px ${AZUL}55` }}>
              Quero crescer com a YPHE
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a href="#metodo" className="flex items-center gap-2 px-7 py-3.5 rounded-full font-medium text-white/80 border border-white/15 hover:bg-white/5 transition-colors">
              <Play className="w-4 h-4" /> Ver como funciona
            </a>
          </motion.div>
        </motion.div>

        {/* indicador de scroll */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 w-5 h-9 rounded-full border border-white/20 flex justify-center pt-2"
        >
          <div className="w-1 h-2 rounded-full bg-white/50" />
        </motion.div>
      </section>

      {/* ===== MARQUEE ===== */}
      <div className="relative py-6 border-y border-white/5 overflow-hidden bg-[#10141d]">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
          className="flex gap-12 whitespace-nowrap w-max"
        >
          {[...Array(2)].flatMap((_, r) =>
            ["REELS", "STORIES", "CARROSSEL", "TRÁFEGO PAGO", "ROTEIRO", "CAPTAÇÃO", "EDIÇÃO", "DESIGN", "CHATBOT", "SITES"].map((t, i) => (
              <span key={`${r}-${i}`} className="flex items-center gap-12 text-sm font-semibold tracking-[0.3em] text-white/25">
                {t}
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: AZUL }} />
              </span>
            ))
          )}
        </motion.div>
      </div>

      {/* ===== NÚMEROS ===== */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {NUMEROS.map((n, i) => (
            <motion.div key={n.label} {...stagger(i)} className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text"
                style={{ backgroundImage: `linear-gradient(180deg, #fff, ${AZUL})` }}>
                {n.valor}
              </p>
              <p className="mt-2 text-sm text-white/50">{n.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== SERVIÇOS ===== */}
      <section id="servicos" className="max-w-6xl mx-auto px-6 py-24">
        <motion.div {...fadeUp} className="max-w-2xl mb-14">
          <p className="text-xs font-semibold tracking-[0.25em] mb-3" style={{ color: AZUL }}>O QUE FAZEMOS</p>
          <h2 className="text-3xl md:text-5xl font-bold leading-tight">
            Tudo o que a sua presença digital precisa. <span className="text-white/40">Em um só time.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {SERVICOS.map((s, i) => (
            <motion.div
              key={s.titulo}
              {...stagger(i % 3)}
              whileHover={{ y: -6 }}
              className="group relative rounded-2xl border border-white/8 bg-white/[0.03] p-7 overflow-hidden transition-colors hover:border-white/15"
            >
              <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-[70px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: AZUL + "2e" }} />
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                style={{ background: `linear-gradient(135deg, ${AZUL}26, ${AZUL_PROFUNDO}33)`, border: `1px solid ${AZUL}30` }}>
                <s.icon className="w-5 h-5" style={{ color: AZUL }} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{s.titulo}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== MÉTODO / PIPELINE ===== */}
      <section id="metodo" className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: "url(/brand/glass-hero.png)" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1017] via-[#0d1017]/80 to-[#0d1017]" />

        <div className="relative max-w-6xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-semibold tracking-[0.25em] mb-3" style={{ color: AZUL }}>NOSSO MÉTODO</p>
            <h2 className="text-3xl md:text-5xl font-bold leading-tight">
              Conteúdo não nasce do improviso.
              <br /><span className="text-white/40">Nasce de processo.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-5">
            {PIPELINE.map((p, i) => (
              <motion.div key={p.n} {...stagger(i)} className="relative rounded-2xl border border-white/8 bg-[#10141d]/80 backdrop-blur p-6">
                <p className="text-5xl font-bold text-transparent bg-clip-text mb-4"
                  style={{ backgroundImage: `linear-gradient(180deg, ${AZUL}, ${AZUL_PROFUNDO})` }}>{p.n}</p>
                <h3 className="font-semibold mb-1.5">{p.titulo}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{p.desc}</p>
                {i < PIPELINE.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-1/2 -right-5 w-4 h-4 text-white/20" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PORTAL ===== */}
      <section id="portal" className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div {...fadeUp}>
            <p className="text-xs font-semibold tracking-[0.25em] mb-3" style={{ color: AZUL }}>EXCLUSIVO YPHE</p>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-5">
              Um portal onde você acompanha e aprova tudo.
            </h2>
            <p className="text-white/55 leading-relaxed mb-7">
              Nada de conteúdo perdido em conversa de WhatsApp. No portal do cliente você vê o andamento
              de cada peça, assiste ao vídeo finalizado e aprova — ou pede ajuste — com um clique.
            </p>
            <ul className="space-y-3">
              {["Andamento em tempo real, mês a mês", "Player do conteúdo dentro do portal", "Aprovação e feedback com um clique", "Acesso simples por código, sem senha"].map(t => (
                <li key={t} className="flex items-center gap-3 text-sm text-white/70">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: AZUL }} /> {t}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* mock do portal */}
          <motion.div
            initial={{ opacity: 0, x: 48, rotate: 1.5 }}
            whileInView={{ opacity: 1, x: 0, rotate: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease: [0.21, 0.6, 0.35, 1] }}
            className="relative"
          >
            <div className="absolute -inset-8 rounded-[2rem] blur-[80px] opacity-30" style={{ background: AZUL_PROFUNDO }} />
            <div className="relative rounded-2xl border border-white/10 bg-[#10141d] p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <img src="/brand/logo-yphe.svg" alt="" className="h-3.5 brightness-0 invert opacity-70" />
                <span className="text-[10px] text-white/40">Portal do cliente</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[["75", "no plano"], ["5", "p/ aprovar"], ["32", "aprovados"]].map(([v, l]) => (
                  <div key={l} className="rounded-lg border border-white/8 bg-white/[0.03] p-3 text-center">
                    <p className="text-lg font-bold" style={{ color: AZUL }}>{v}</p>
                    <p className="text-[9px] text-white/40">{l}</p>
                  </div>
                ))}
              </div>
              {["Reel — Tecnologia que cuida", "Carrossel — 5 sinais de alerta", "Story — Bastidor da equipe"].map((t, i) => (
                <div key={t} className="flex items-center gap-3 py-2.5 border-t border-white/5">
                  <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ background: AZUL + "1a" }}>
                    <Instagram className="w-3.5 h-3.5" style={{ color: AZUL }} />
                  </div>
                  <p className="text-xs text-white/70 flex-1 truncate">{t}</p>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full ${i === 0 ? "bg-amber-400/15 text-amber-300" : "bg-emerald-400/15 text-emerald-300"}`}>
                    {i === 0 ? "aprovar" : "aprovado"}
                  </span>
                </div>
              ))}
              <button className="mt-4 w-full py-2.5 rounded-lg text-xs font-semibold text-[#0d1017] flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(90deg, ${AZUL}, ${CIANO_CLARO})` }}>
                <ThumbsUp className="w-3.5 h-3.5" /> Aprovar conteúdo
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section id="contato" className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(/brand/degrade-hero.png)" }} />
        <div className="absolute inset-0 bg-[#0d1017]/70" />
        <motion.div {...fadeUp} className="relative max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-bold leading-tight">
            Pronto para ser <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(90deg, ${CIANO_CLARO}, ${AZUL})` }}>referência</span>?
          </h2>
          <p className="mt-5 text-white/60 text-lg">
            Vamos montar o plano de conteúdo da sua clínica.
          </p>
          <a href="https://wa.me/5546999999999?text=Quero%20conhecer%20a%20YPHE"
            target="_blank" rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 mt-9 px-8 py-4 rounded-full font-semibold text-[#0d1017] transition-transform hover:scale-[1.04]"
            style={{ background: `linear-gradient(90deg, ${AZUL}, ${CIANO_CLARO})`, boxShadow: `0 8px 48px ${AZUL}66` }}>
            <Send className="w-4 h-4" />
            Chamar no WhatsApp
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </a>
        </motion.div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/5 py-10">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between flex-wrap gap-4">
          <img src="/brand/logo-yphe.svg" alt="YPHE" className="h-4 brightness-0 invert opacity-60" />
          <p className="text-xs text-white/30">© {new Date().getFullYear()} YPHE — Tecnologia atendendo o marketing de referência.</p>
          <div className="flex items-center gap-4 text-white/40">
            <MonitorSmartphone className="w-4 h-4" />
            <Instagram className="w-4 h-4" />
          </div>
        </div>
      </footer>
    </div>
  );
}
