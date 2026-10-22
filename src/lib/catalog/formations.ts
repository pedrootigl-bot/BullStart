export type FormationTier = "trader" | "silver" | "gold";

export type FormationCatalogItem = {
  id: FormationTier;
  levelLabel: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  modulesLabel: string;
  hoursLabel: string;
  certificateLabel: string;
  href: string | null;
  requirements: string[];
};

/** Catálogo de formações exibido em /plataforma/cursos (referência visual BullStart). */
export const FORMATIONS: FormationCatalogItem[] = [
  {
    id: "trader",
    levelLabel: "Nível Inicial",
    title: "Formação Trader",
    description: "A base sólida para o seu desenvolvimento no mercado financeiro. Do zero ao operacional.",
    imageSrc: "/brand/formation-trader.jpg",
    imageAlt: "Formação Trader — trader com máscara de touro verde em ambiente de trading",
    modulesLabel: "20 módulos",
    hoursLabel: "25h",
    certificateLabel: "Certificado ao concluir",
    href: "/plataforma",
    requirements: [],
  },
  {
    id: "silver",
    levelLabel: "Nível Intermediário",
    title: "BullStart Silver",
    description: "Estratégias avançadas, ampliação de repertório e leitura de mercado profissional.",
    imageSrc: "/brand/formation-silver.jpg",
    imageAlt: "BullStart Silver — trader com máscara de touro em escritório com escultura prata",
    modulesLabel: "18 módulos",
    hoursLabel: "30h",
    certificateLabel: "Certificado ao concluir",
    href: null,
    requirements: ["Aprovação no curso Formação Trader", "Depósito mínimo de R$ 1.000,00"],
  },
  {
    id: "gold",
    levelLabel: "Nível Avançado",
    title: "BullStart Gold",
    description: "Alta performance, visão institucional e estratégias exclusivas para traders de elite.",
    imageSrc: "/brand/formation-gold.jpg",
    imageAlt: "BullStart Gold — trader com máscara de touro em escritório premium dourado",
    modulesLabel: "25 módulos",
    hoursLabel: "40h",
    certificateLabel: "Certificado ao concluir",
    href: null,
    requirements: [
      "Aprovação no curso BullStart Silver",
      "Depósito mínimo de R$ 5.000,00",
      "Convite da equipe BullStart",
    ],
  },
];
