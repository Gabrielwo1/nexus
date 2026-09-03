"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  ArrowRight, ArrowUpRight, Send, Sparkles, ThumbsUp, CheckCircle2,
  Play, Instagram, MonitorSmartphone, Presentation,
} from "lucide-react";

/* ============================================================
   YPHE — Landing page institucional
   Pública em /site. Espelha a arquitetura da apresentação
   comercial (/apresentacao): os cinco produtos organizados pela
   jornada do cliente, precedidos sempre pelo diagnóstico.
   ============================================================ */

const AZUL = "#20BCED";
const AZUL_PROFUNDO = "#052699";
const CIANO_CLARO = "#97E9FF";

const WHATSAPP =
  "https://wa.me/5546999424922?text=Ol%C3%A1!%20Vim%20pelo%20site%20da%20YPHE" +
  "%20e%20quero%20agendar%20uma%20conversa%20de%20diagn%C3%B3stico.";

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

/** Os cinco produtos, na ordem da jornada de quem procura você */
const PRODUTOS = [
  {
    icone: "/brand/produtos/branding.png",
    nome: "YPHE BRANDING",
    area: "Marca e posicionamento",
    pergunta: "Por que você, e não o concorrente ao lado?",
    desc: "Se o cliente não consegue completar essa frase sozinho, ele decide por preço. Definimos o que a organização representa, para quem, e traduzimos isso em como ela aparece.",
  },
  {
    icone: "/brand/produtos/content.png",
    nome: "YPHE CONTENT",
    area: "Narrativa e produção",
    pergunta: "Como aparecer com consistência sem depender de inspiração?",
    desc: "Ninguém decide no primeiro contato. Acompanha, reconhece, confia — e só então compra. Narrativa contínua, com produção agrupada para ocupar pouco do seu tempo.",
  },
  {
    icone: "/brand/produtos/leads.png",
    nome: "YPHE LEADS",
    area: "Mídia e captação",
    pergunta: "Quem já procura o que você faz chega até você?",
    desc: "Mídia paga captura quem já está decidido e digitando no Google, e apresenta a marca a quem ainda nem procurou, no Instagram e no Facebook. Toda verba vira linha rastreável.",
  },
  {
    icone: "/brand/produtos/connect.png",
    nome: "YPHE CONNECT",
    area: "Tecnologia e experiência",
    pergunta: "Quantas pessoas desistem antes de falar com alguém?",
    desc: "O trecho mais caro e o menos olhado. Site, WhatsApp e agendamento são a porta da operação no digital — e a automação existe para qualificar o contato humano, nunca para substituí-lo.",
  },
  {
    icone: "/brand/produtos/intel.png",
    nome: "YPHE INTELLIGENCE",
    area: "Dados, evolução e consultoria",
    pergunta: "Isso é gasto ou investimento? Como saber?",
    desc: "Sem este produto, os outros quatro viram fé. Os dados de todos os trechos se juntam num painel só, e a estratégia passa a evoluir por evidência.",
  },
];

/** As seis fases do método — constantes em qualquer projeto */
const FASES = [
  { n: "01", titulo: "Diagnóstico", desc: "Entender a organização antes de propor qualquer solução" },
  { n: "02", titulo: "Arquitetura", desc: "Traduzir o diagnóstico em decisões, metas e projeções" },
  { n: "03", titulo: "Construção", desc: "Produzir os ativos: marca, sistemas, conteúdo, tecnologia" },
  { n: "04", titulo: "Ativação", desc: "Colocar o sistema em movimento no mundo real" },
  { n: "05", titulo: "Inteligência", desc: "Ler o que os dados dizem, sem julgamento prematuro" },
  { n: "06", titulo: "Evolução", desc: "Ajustar a arquitetura e reiniciar o ciclo mais informado" },
];

const SETORES = [
  { titulo: "Clínica e consultório", desc: "Autoridade profissional, jornada do paciente, aquisição, conversão e ticket médio." },
  { titulo: "Instituição e serviço público", desc: "Acessibilidade, educação, impacto social, alcance e participação da comunidade." },
  { titulo: "Varejo e serviço", desc: "Reconhecimento de marca, recorrência de compra, retenção e valor no tempo." },
];

const NUMEROS = [
  { valor: "5", label: "produtos modulares" },
  { valor: "6", label: "fases em todo projeto" },
  { valor: "60+", label: "conteúdos publicados por mês" },
  { valor: "100%", label: "aprovado por você antes do ar" },
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
            <a href="#metodo" className="hover:text-white transition-colors">Método</a>
            <a href="#produtos" className="hover:text-white transition-colors">Produtos</a>
            <a href="#portal" className="hover:text-white transition-colors">Portal</a>
          </nav>
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
            className="group flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-[#0d1017] transition-transform hover:scale-[1.03]"
            style={{ background: `linear-gradient(90deg, ${AZUL}, ${CIANO_CLARO})` }}>
            Falar com a YPHE
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </motion.header>

      {/* ===== HERO ===== */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <motion.div style={{ y: heroY }} className="absolute inset-0 scale-110">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(/brand/degrade-hero.png)" }} />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0d1017]/60 via-[#0d1017]/40 to-[#0d1017]" />
        </motion.div>

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
            Tecnologia, Branding e Marketing
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35, ease: [0.21, 0.6, 0.35, 1] }}
            className="text-4xl md:text-6xl font-bold leading-[1.08] tracking-tight"
          >
            Projetamos a ponte entre quem tem a solução e{" "}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(90deg, ${CIANO_CLARO}, ${AZUL}, ${CIANO_CLARO})` }}>
              quem precisa dela.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55 }}
            className="mt-6 text-lg text-white/60 max-w-2xl mx-auto leading-relaxed"
          >
            Não entregamos peças soltas de conteúdo. Diagnosticamos primeiro, depois
            construímos o sistema certo, com os módulos certos, no ritmo certo.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.75 }}
            className="mt-10 flex items-center justify-center gap-4 flex-wrap"
          >
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
              className="group flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-[#0d1017] transition-transform hover:scale-[1.04]"
              style={{ background: `linear-gradient(90deg, ${AZUL}, ${CIANO_CLARO})`, boxShadow: `0 8px 40px ${AZUL}55` }}>
              Agendar um diagnóstico
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a href="#metodo" className="flex items-center gap-2 px-7 py-3.5 rounded-full font-medium text-white/80 border border-white/15 hover:bg-white/5 transition-colors">
              <Play className="w-4 h-4" /> Ver como funciona
            </a>
          </motion.div>
        </motion.div>

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
          transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
          className="flex gap-12 whitespace-nowrap w-max"
        >
          {[...Array(2)].flatMap((_, r) =>
            ["DIAGNÓSTICO", "BRANDING", "CONTENT", "LEADS", "CONNECT", "INTELLIGENCE", "CONSULTORIA"].map((t, i) => (
              <span key={`${r}-${i}`} className="flex items-center gap-12 text-sm font-semibold tracking-[0.3em] text-white/25">
                {t}
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: AZUL }} />
              </span>
            ))
          )}
        </motion.div>
      </div>

      {/* ===== A DISTÂNCIA ===== */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <motion.div {...fadeUp} className="max-w-2xl mb-14">
          <p className="text-xs font-semibold tracking-[0.25em] mb-3" style={{ color: AZUL }}>POR QUE EXISTIMOS</p>
          <h2 className="text-3xl md:text-5xl font-bold leading-tight">
            Existe uma distância entre quem sabe e{" "}
            <span className="text-white/40">quem precisa.</span>
          </h2>
          <p className="mt-5 text-white/55 leading-relaxed">
            Quando essa distância não é bem construída, conhecimento de valor real simplesmente
            não chega. Não começamos perguntando &ldquo;que campanha podemos fazer?&rdquo; —
            começamos perguntando que valor existe aqui, e por que ele ainda não chegou a quem precisa.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-[1fr_auto_1fr] gap-6 md:gap-8 items-center">
          <motion.div {...stagger(0)} className="rounded-2xl border border-white/8 bg-white/[0.03] p-7">
            <p className="text-xl font-semibold mb-2">Quem precisa</p>
            <p className="text-sm text-white/50 leading-relaxed">
              Tem o problema. Não sabe nomeá-lo, quem resolve, nem em quem confiar.
            </p>
          </motion.div>

          <motion.div {...stagger(1)} className="flex md:flex-col items-center gap-3">
            <span className="text-[10px] font-semibold tracking-[0.25em] text-amber-300/80 uppercase">a distância</span>
            <div className="h-px w-24 md:w-px md:h-16"
              style={{ background: `repeating-linear-gradient(to right, ${AZUL}66 0 5px, transparent 5px 11px)` }} />
          </motion.div>

          <motion.div {...stagger(2)} className="rounded-2xl border border-white/8 bg-white/[0.03] p-7">
            <p className="text-xl font-semibold mb-2">Quem resolve</p>
            <p className="text-sm text-white/50 leading-relaxed">
              Tem a solução, a competência e o resultado. E capacidade ociosa.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== NÚMEROS ===== */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
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

      {/* ===== MÉTODO ===== */}
      <section id="metodo" className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: "url(/brand/glass-hero.png)" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1017] via-[#0d1017]/80 to-[#0d1017]" />

        <div className="relative max-w-6xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-semibold tracking-[0.25em] mb-3" style={{ color: AZUL }}>NOSSO MÉTODO</p>
            <h2 className="text-3xl md:text-5xl font-bold leading-tight">
              Seis fases que não mudam de projeto para projeto.
              <br /><span className="text-white/40">O que muda é a aplicação.</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FASES.map((f, i) => (
              <motion.div key={f.n} {...stagger(i % 3)} className="relative rounded-2xl border border-white/8 bg-[#10141d]/80 backdrop-blur p-6">
                <p className="text-4xl font-bold text-transparent bg-clip-text mb-3"
                  style={{ backgroundImage: `linear-gradient(180deg, ${AZUL}, ${AZUL_PROFUNDO})` }}>{f.n}</p>
                <h3 className="font-semibold mb-1.5">{f.titulo}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.p {...fadeUp} className="mt-10 text-center text-sm text-white/40 max-w-2xl mx-auto">
            A escala ocorre pela padronização do processo — não pela padronização da solução final.
          </motion.p>
        </div>
      </section>

      {/* ===== DIAGNÓSTICO ===== */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <motion.div {...fadeUp}
          className="relative rounded-2xl border p-8 md:p-10 overflow-hidden"
          style={{ borderColor: AZUL + "55", background: `linear-gradient(135deg, ${AZUL_PROFUNDO}26, ${AZUL}0d)` }}>
          <div className="absolute left-0 inset-y-0 w-1" style={{ background: AZUL }} />
          <div className="grid md:grid-cols-[auto_1fr] gap-8 items-center">
            <img src="/brand/produtos/diag.png" alt="" className="w-28 md:w-36 mx-auto" />
            <div>
              <p className="text-xs font-semibold tracking-[0.25em] mb-3" style={{ color: AZUL }}>A PORTA DE ENTRADA</p>
              <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-4">
                Nenhum produto é vendido antes do diagnóstico.
              </h2>
              <p className="text-white/55 leading-relaxed mb-4">
                Antes de qualquer proposta: mercado, público, ticket médio, verba, capacidade
                operacional, tecnologia existente e o que já foi tentado. Só então definimos
                quais dos cinco produtos fazem sentido.
              </p>
              <p className="font-semibold" style={{ color: CIANO_CLARO }}>
                Nem toda organização precisa dos cinco. Vender todos para todo mundo seria catálogo, não diagnóstico.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ===== PRODUTOS ===== */}
      <section id="produtos" className="max-w-6xl mx-auto px-6 py-16">
        <motion.div {...fadeUp} className="max-w-2xl mb-14">
          <p className="text-xs font-semibold tracking-[0.25em] mb-3" style={{ color: AZUL }}>O QUE CONSTRUÍMOS</p>
          <h2 className="text-3xl md:text-5xl font-bold leading-tight">
            Cinco produtos, na ordem da jornada de{" "}
            <span className="text-white/40">quem procura você.</span>
          </h2>
          <p className="mt-5 text-white/55 leading-relaxed">
            Cada trecho perdido derruba todos os seguintes. Uma marca forte não salva um
            WhatsApp que ninguém responde.
          </p>
        </motion.div>

        <div className="space-y-5">
          {PRODUTOS.map((p, i) => (
            <motion.div
              key={p.nome}
              {...stagger(i % 3)}
              className="group grid md:grid-cols-[auto_1fr] gap-6 md:gap-9 items-center rounded-2xl border border-white/8 bg-white/[0.03] p-7 md:p-8 transition-colors hover:border-white/15"
            >
              <div className="relative w-24 md:w-32 mx-auto md:mx-0">
                <div className="absolute inset-2 rounded-full blur-2xl opacity-60"
                  style={{ background: AZUL + "44" }} />
                <img src={p.icone} alt="" loading="lazy"
                  className="relative w-full transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-2" style={{ color: AZUL }}>
                  {p.area}
                </p>
                <h3 className="text-xl md:text-2xl font-bold tracking-tight mb-2">{p.nome}</h3>
                <p className="text-base md:text-lg font-semibold mb-3" style={{ color: CIANO_CLARO }}>
                  &ldquo;{p.pergunta}&rdquo;
                </p>
                <p className="text-sm text-white/50 leading-relaxed max-w-2xl">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== SETORES ===== */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <motion.div {...fadeUp} className="max-w-2xl mb-12">
          <p className="text-xs font-semibold tracking-[0.25em] mb-3" style={{ color: AZUL }}>ESCALA SEM DILUIÇÃO</p>
          <h2 className="text-3xl md:text-4xl font-bold leading-tight">
            Nossa marca nasceu no ortopédico. <span className="text-white/40">O método não é do setor.</span>
          </h2>
          <p className="mt-5 text-white/55 leading-relaxed">
            O que muda de um segmento para outro são os indicadores e a linguagem — nunca o rigor do processo.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {SETORES.map((s, i) => (
            <motion.div key={s.titulo} {...stagger(i)}
              className="rounded-2xl border border-white/8 bg-white/[0.03] p-7">
              <h3 className="text-lg font-semibold mb-2" style={{ color: AZUL }}>{s.titulo}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== PORTAL ===== */}
      <section id="portal" className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div {...fadeUp}>
            <p className="text-xs font-semibold tracking-[0.25em] mb-3" style={{ color: AZUL }}>TECNOLOGIA PRÓPRIA</p>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-5">
              Construímos o nosso sistema — e você entra nele.
            </h2>
            <p className="text-white/55 leading-relaxed mb-7">
              Não operamos em planilhas soltas. Desenvolvemos o sistema que roda a agência, e cada
              cliente recebe um acesso próprio: vê o andamento real da produção e aprova o que vai ao ar.
            </p>
            <ul className="space-y-3">
              {[
                "Calendário editorial com o status de cada peça",
                "Aprovação e feedback direto no conteúdo",
                "Acervo de mídias com todo o material",
                "Painel de resultados atualizado",
              ].map(t => (
                <li key={t} className="flex items-center gap-3 text-sm text-white/70">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: AZUL }} /> {t}
                </li>
              ))}
            </ul>
          </motion.div>

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
                {[["59", "no plano"], ["5", "p/ aprovar"], ["32", "aprovados"]].map(([v, l]) => (
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
            Vamos começar pelo{" "}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(90deg, ${CIANO_CLARO}, ${AZUL})` }}>
              diagnóstico
            </span>.
          </h2>
          <p className="mt-5 text-white/60 text-lg">
            Uma conversa de cerca de uma hora, sem proposta e sem compromisso. Você sai dela
            com um retrato do seu momento.
          </p>
          <div className="mt-9 flex items-center justify-center gap-4 flex-wrap">
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-[#0d1017] transition-transform hover:scale-[1.04]"
              style={{ background: `linear-gradient(90deg, ${AZUL}, ${CIANO_CLARO})`, boxShadow: `0 8px 48px ${AZUL}66` }}>
              <Send className="w-4 h-4" />
              Falar no WhatsApp
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a href="/apresentacao/institucional.html"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-medium text-white/80 border border-white/15 hover:bg-white/5 transition-colors">
              <Presentation className="w-4 h-4" /> Ver a apresentação
            </a>
          </div>
          <p className="mt-6 text-sm text-white/40 tracking-wider">(46) 99942-4922</p>
        </motion.div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/5 py-10">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between flex-wrap gap-4">
          <img src="/brand/logo-yphe.svg" alt="YPHE" className="h-4 brightness-0 invert opacity-60" />
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} YPHE — Nosso sucesso é medido pela força da sua marca.
          </p>
          <div className="flex items-center gap-4 text-white/40">
            <MonitorSmartphone className="w-4 h-4" />
            <Instagram className="w-4 h-4" />
          </div>
        </div>
      </footer>
    </div>
  );
}
