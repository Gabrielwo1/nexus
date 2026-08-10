/**
 * Estrutura de pastas do acervo (espelha o Drive atual da equipe).
 * Por enquanto é o modelo visual — os arquivos virão do R2 quando o
 * upload for conectado.
 */

export type Node = {
  id: string;
  name: string;
  kind: "folder" | "video" | "image" | "doc" | "audio";
  children?: Node[];
  size?: string;
  updatedAt?: string;
  by?: string;
  /** duração para vídeo/áudio */
  duration?: string;
};

let seq = 0;
const uid = () => `n${++seq}`;

const f = (name: string, children: Node[] = []): Node =>
  ({ id: uid(), name, kind: "folder", children });

const file = (
  name: string,
  kind: Node["kind"],
  size: string,
  updatedAt: string,
  by: string,
  duration?: string
): Node => ({ id: uid(), name, kind, size, updatedAt, by, duration });

// ---------- arquivos de exemplo (só para dar volume visual) ----------
const takesReel = [
  file("take-01.mp4", "video", "1,2 GB", "há 2 dias", "Guto", "3:12"),
  file("take-02.mp4", "video", "890 MB", "há 2 dias", "Guto", "2:04"),
  file("take-03.mp4", "video", "1,7 GB", "há 2 dias", "Guto", "4:38"),
];
const finalReel = [
  file("final-v2.mp4", "video", "142 MB", "ontem", "Pet", "0:48"),
];

export const ACERVO: Node = f("Mussi", [
  f("Banco de imagens", [
    f("11.06.2024 Fabio consultorio gravação Manguito Capsulite", [
      file("DSC_0142.JPG", "image", "8,4 MB", "11/06/2024", "Guto"),
      file("DSC_0143.JPG", "image", "8,1 MB", "11/06/2024", "Guto"),
      file("consultorio-01.mp4", "video", "2,1 GB", "11/06/2024", "Guto", "6:20"),
    ]),
    f("23.04.2024 Ultrassom Infiltração Fabio", [
      file("ultrassom-bruto.mp4", "video", "3,4 GB", "23/04/2024", "Guto", "12:05"),
    ]),
    f("29.07.2026 Entrevista Henrique consultorio", [
      file("entrevista-cam1.mp4", "video", "5,2 GB", "29/07/2026", "Guto", "24:11"),
      file("entrevista-cam2.mp4", "video", "4,9 GB", "29/07/2026", "Guto", "24:11"),
      file("audio-lapela.wav", "audio", "310 MB", "29/07/2026", "Guto", "24:11"),
    ]),
    f("Sem título", [
      f("Dra. Maria Lara", [
        f("filtradas", [
          file("lara-01.jpg", "image", "6,2 MB", "há 1 semana", "Pet"),
          file("lara-02.jpg", "image", "5,8 MB", "há 1 semana", "Pet"),
        ]),
      ]),
      f("Yphe", [
        file("bastidor-yphe.mp4", "video", "740 MB", "há 3 dias", "Algusto", "1:52"),
      ]),
    ]),
  ]),

  f("Logos instituto mussi / perfil / paleta de cores", [
    f("DESTAQUES INSTAGRAM", [
      f("MODELO 1", [
        file("destaque-01.png", "image", "1,1 MB", "12/06/2026", "Pet"),
        file("destaque-02.png", "image", "1,0 MB", "12/06/2026", "Pet"),
      ]),
      f("MODELO 2", [
        file("destaque-alt-01.png", "image", "980 KB", "12/06/2026", "Pet"),
      ]),
    ]),
    f("LOGO INSTITUTO MUSSI", [
      file("logo-principal.png", "image", "420 KB", "02/05/2026", "Fernando"),
      file("logo-fundo-escuro.png", "image", "410 KB", "02/05/2026", "Fernando"),
    ]),
    f("paleta de cor", [
      file("paleta-instituto.pdf", "doc", "1,8 MB", "02/05/2026", "Fernando"),
    ]),
    f("PERFIL INSTAGRAM", [
      file("foto-perfil.png", "image", "780 KB", "02/05/2026", "Pet"),
    ]),
    f("SVG SIMBOLO", [
      file("simbolo.svg", "image", "24 KB", "02/05/2026", "Fernando"),
    ]),
  ]),

  f("Primeiro mês", [
    f("Dr. Henrique", [
      f("LEGADO DR HENRIQUE", [
        file("legado-final.mp4", "video", "168 MB", "há 5 dias", "Pet", "0:52"),
      ]),
      f("robo tecnologia", [
        file("robo-take-01.mp4", "video", "1,9 GB", "há 6 dias", "Guto", "5:40"),
        file("robo-final.mp4", "video", "132 MB", "há 4 dias", "Pet", "0:44"),
      ]),
    ]),

    f("Dr. Mussi", [
      f("carrossel", [
        file("carrossel-vocacao.psd", "doc", "220 MB", "há 3 dias", "Pet"),
      ]),
      f("Estáticos", [
        file("estatico-trajetoria.png", "image", "3,2 MB", "há 3 dias", "Pet"),
      ]),
      f("Reels", [
        f("6 de agosto pq eu virei ortopedista", [
          ...takesReel,
          ...finalReel,
        ]),
        f("Entrevista", [
          f("Takes", [
            file("mussi-entrevista-p1.mp4", "video", "6,8 GB", "há 2 semanas", "Guto", "38:12"),
            file("mussi-entrevista-p2.mp4", "video", "5,4 GB", "há 2 semanas", "Guto", "29:47"),
          ]),
          f("Video final", [
            file("corte-03-medico-atendeu.mp4", "video", "156 MB", "há 4 dias", "Pet", "0:51"),
            file("corte-06-sonho-do-pai.mp4", "video", "148 MB", "há 4 dias", "Pet", "0:47"),
          ]),
        ]),
      ]),
      f("roteiros", [
        file("YPHE_Roteiros_Individuais_Dr_Mussi_Pessoal_2.pdf", "doc", "820 KB", "há 1 semana", "Eliab"),
      ]),
      f("Stories", [
        file("story-bastidor-01.mp4", "video", "62 MB", "ontem", "Karyne", "0:15"),
      ]),
    ]),

    f("Dr. Ricardo", [
      f("carrossel", [
        f("finalizados", [
          f("07 08", [file("carrossel-5-coisas.png", "image", "4,1 MB", "07/08/2026", "Pet")]),
          f("30 07", [file("carrossel-sinais.png", "image", "3,8 MB", "30/07/2026", "Pet")]),
        ]),
        f("Roteiros", [
          file("roteiro-carrosseis.docx", "doc", "68 KB", "há 1 semana", "Eliab"),
        ]),
      ]),
      f("reels", [
        f("03/08 - 10/08", [
          f("takes", takesReel),
          f("video final", finalReel),
        ]),
        f("17/08", [
          f("takes", [file("take-quadril-01.mp4", "video", "2,3 GB", "17/08/2026", "Guto", "7:02")]),
          f("video final", [file("final-quadril.mp4", "video", "138 MB", "17/08/2026", "Pet", "0:46")]),
        ]),
        f("24/07", [
          f("takes", [file("take-digimax.mp4", "video", "1,6 GB", "24/07/2026", "Guto", "4:55")]),
          f("video final", [file("final-digimax.mp4", "video", "144 MB", "24/07/2026", "Pet", "0:49")]),
        ]),
        f("28/07", [
          f("takes", [file("take-dor-dia-a-dia.mp4", "video", "2,0 GB", "28/07/2026", "Guto", "6:10")]),
          f("video final", [file("final-dor-dia-a-dia.mp4", "video", "151 MB", "28/07/2026", "Pet", "0:53")]),
        ]),
      ]),
      f("stories", [
        f("Roteiros", [file("stories-ricardo.docx", "doc", "42 KB", "há 5 dias", "Eliab")]),
        f("Videos finais", [
          file("story-ricardo-01.mp4", "video", "58 MB", "há 3 dias", "Karyne", "0:14"),
          file("story-ricardo-02.mp4", "video", "61 MB", "há 3 dias", "Karyne", "0:15"),
        ]),
      ]),
    ]),

    f("Dr. Viktor Nelson", [
      file("viktor-take-robo.mp4", "video", "2,4 GB", "há 1 semana", "Guto", "8:30"),
      file("viktor-final-robo.mp4", "video", "162 MB", "há 5 dias", "Pet", "0:55"),
      file("viktor-foto-perfil.jpg", "image", "7,1 MB", "há 1 semana", "Guto"),
    ]),

    f("Institucional", [
      f("Banco de Imagens", [
        f("Fotos", [
          file("fachada-01.jpg", "image", "9,2 MB", "há 2 semanas", "Guto"),
          file("recepcao-01.jpg", "image", "8,7 MB", "há 2 semanas", "Guto"),
          file("equipe-completa.jpg", "image", "11,4 MB", "há 2 semanas", "Guto"),
        ]),
        f("Takes", [
          f("Centro Cirúrgico", [file("cc-01.mp4", "video", "3,1 GB", "há 2 semanas", "Guto", "9:20")]),
          f("Dia a Dia", [file("diaadia-01.mp4", "video", "2,8 GB", "há 2 semanas", "Guto", "8:40")]),
          f("Fachada", [file("fachada-drone.mp4", "video", "1,4 GB", "há 2 semanas", "Guto", "3:15")]),
          f("Make Off", [file("makeoff-01.mp4", "video", "2,2 GB", "há 2 semanas", "Guto", "6:50")]),
          f("Médicos Interagindo", [file("medicos-01.mp4", "video", "2,6 GB", "há 2 semanas", "Guto", "7:30")]),
          f("Secretárias", [file("secretarias-01.mp4", "video", "1,8 GB", "há 2 semanas", "Guto", "5:12")]),
        ]),
      ]),
      f("Carrossel", [
        f("CARROSSÉIS PRIMEIRO MÊS", [
          file("carrossel-legado.png", "image", "4,4 MB", "há 1 semana", "Pet"),
        ]),
        f("estáticos", [
          file("estatico-dia-dos-pais.png", "image", "3,6 MB", "há 4 dias", "Pet"),
        ]),
        f("roteiros", [
          file("roteiros-carrossel.docx", "doc", "58 KB", "há 1 semana", "Eliab"),
        ]),
      ]),
      f("Reels", [
        ...["05/08", "11/08", "14/08", "17/08", "21/08", "24/08", "27/07", "28/08", "31/07"].map(d =>
          f(d, [
            f("Takes", [file(`take-${d.replace("/", "-")}.mp4`, "video", "2,1 GB", d + "/2026", "Guto", "6:05")]),
            f("Video final", [file(`final-${d.replace("/", "-")}.mp4`, "video", "147 MB", d + "/2026", "Pet", "0:50")]),
          ])
        ),
      ]),
      f("Roteiros", [
        file("roteiros-institucional.pdf", "doc", "1,1 MB", "há 1 semana", "Eliab"),
      ]),
      f("STORIES", [
        f("Augusto", [
          f("05 08", [file("story-05-08.mp4", "video", "54 MB", "05/08/2026", "Algusto", "0:14")]),
          f("Robo", [
            f("áudio", [file("narracao-robo.wav", "audio", "88 MB", "há 6 dias", "Algusto", "1:10")]),
            f("Finalizado", [file("robo-story-final.mp4", "video", "66 MB", "há 5 dias", "Algusto", "0:15")]),
            f("Takes", [file("robo-take.mp4", "video", "1,3 GB", "há 6 dias", "Guto", "4:02")]),
          ]),
        ]),
        f("Karyne", [
          f("07 08", [file("story-07-08.mp4", "video", "57 MB", "07/08/2026", "Karyne", "0:15")]),
          f("Make Off", [file("makeoff-story.mp4", "video", "72 MB", "há 4 dias", "Karyne", "0:18")]),
        ]),
        f("Roteiros", [
          file("roteiros-stories.docx", "doc", "51 KB", "há 1 semana", "Eliab"),
        ]),
      ]),
    ]),
  ]),
]);

/** Uso simulado do bucket */
export const USO = { usadoGB: 486, totalGB: 1024 };
