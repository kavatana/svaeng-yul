/**
 * Source registry for the Svaeng-Yul seed QCM bank.
 *
 * IMPORTANT: The Gemini research pack referenced by the data-implementation
 * prompt was NOT pasted (the BEGIN/END block was empty). The entries below are
 * derived from the source *names* enumerated in the prompt itself. Where the
 * prompt provided no usable URL, `url` is left undefined and the note flags
 * that an exact citation needs instructor verification. We do not fabricate
 * links. A question's `sourceReference` string points back to a `Source.id`
 * (often with a year), and risky/unsourced facts are marked
 * `needs_instructor_verification` on the question itself.
 */

export type SourceReliability = "high" | "medium" | "low";

export interface Source {
  id: string;
  title: string;
  organization?: string;
  url?: string;
  reliability: SourceReliability;
  notes: string;
}

export const SOURCES: Source[] = [
  {
    id: "cdhs-2021-22",
    title: "Cambodia Demographic and Health Survey 2021–22",
    organization: "National Institute of Statistics / Ministry of Health, Cambodia",
    url: undefined,
    reliability: "high",
    notes:
      "Primary national source for fertility (TFR ~2.7), maternal mortality (MMR ~154), child mortality, and facility-delivery trends. Exact figures/pages need instructor verification against the published report.",
  },
  {
    id: "who-world-bank-mmr-2023",
    title: "WHO / World Bank modeled maternal mortality estimates (2023)",
    organization: "WHO, World Bank, UNICEF, UNFPA, UNDESA (MMEIG)",
    url: undefined,
    reliability: "high",
    notes:
      "Modeled MMR estimate (~137 for Cambodia by 2023). Differs from the survey-based CDHS figure — never mix the two in one answer key.",
  },
  {
    id: "who-hand-hygiene",
    title: "WHO Guidelines on Hand Hygiene in Health Care — 'My Five Moments for Hand Hygiene'",
    organization: "World Health Organization",
    url: "https://www.who.int/teams/integrated-health-services/infection-prevention-control/hand-hygiene",
    reliability: "high",
    notes:
      "Authoritative definition of the Five Moments and hand-hygiene best practice. Stable, widely taught concept.",
  },
  {
    id: "uhs-cambodia",
    title: "University of Health Sciences (UHS), Phnom Penh — institutional history & curricula",
    organization: "University of Health Sciences, Cambodia",
    url: undefined,
    reliability: "medium",
    notes:
      "Used for medical-education history and MD/BMedSc pathway framing. Exact dates and current curriculum structure need instructor verification.",
  },
  {
    id: "up-cambodia",
    title: "University of Puthisastra — health sciences programs",
    organization: "University of Puthisastra, Cambodia",
    url: undefined,
    reliability: "medium",
    notes:
      "Referenced for nursing/health-science education context. Program specifics need instructor verification.",
  },
  {
    id: "cambodia-med-education-history",
    title: "History of medical education in Cambodia (institutional milestones)",
    url: undefined,
    reliability: "medium",
    notes:
      "Covers the School for Medical Officers (1946), Royal School of Medicine (1953), Faculty of Medicine and Pharmacy (1962), the 1975–1979 disruption, and 1980 rebuilding. Dates are commonly cited but should be confirmed against course notes. Survival-number claims are deliberately framed qualitatively ('fewer than 50 doctors often cited').",
  },
  {
    id: "malaria-resistance-gms",
    title: "Artemisinin resistance & molecular markers in the Greater Mekong Subregion",
    url: undefined,
    reliability: "high",
    notes:
      "Basis for PfKelch13 / C580Y as a validated marker of artemisinin (and associated piperaquine) partial resistance in Plasmodium falciparum. Concept is well established; specific prevalence figures are intentionally avoided.",
  },
  {
    id: "schistosoma-mekongi",
    title: "Schistosoma mekongi epidemiology (Mekong basin)",
    url: undefined,
    reliability: "medium",
    notes:
      "Intermediate host Neotricula aperta snail; historically associated with Kratie/Stung Treng provinces along the Mekong. Used for vector/host distinction items.",
  },
  {
    id: "opisthorchis-viverrini",
    title: "Opisthorchis viverrini (Southeast Asian liver fluke) life cycle",
    url: undefined,
    reliability: "medium",
    notes:
      "Transmission via raw/undercooked cyprinid (carp-family) fish; intermediate snail host Bithynia. Used for parasite distinction items.",
  },
  {
    id: "basic-science-embryology",
    title: "Standard human embryology (foundational developmental biology)",
    url: undefined,
    reliability: "high",
    notes:
      "Universally taught concepts (gametogenesis, fertilization, cleavage, blastocyst, implantation, germ layers, neurulation, teratogen timing). Not Cambodia-specific; high confidence.",
  },
  {
    id: "basic-science-microbiology",
    title: "Standard microbiology & infectious-disease agents",
    url: undefined,
    reliability: "high",
    notes:
      "Foundational agent/vector facts (dengue virus–Aedes, Plasmodium–Anopheles, Mycobacterium tuberculosis, HIV). High confidence, globally taught.",
  },
  {
    id: "demography-foundations",
    title: "Standard public-health demography concepts",
    url: undefined,
    reliability: "high",
    notes:
      "Definitions of population structure, dependency ratio, demographic dividend, TFR, IMR. Concept-level facts are high confidence; country numbers are sourced separately (CDHS/WHO).",
  },
  {
    id: "svaeng-yul-editorial",
    title: "Svaeng-Yul editorial practice set",
    url: undefined,
    reliability: "medium",
    notes:
      "Original practice items written for study only, based on the concepts above. Not exam content; requires instructor review before production use.",
  },
];

export const SOURCE_BY_ID: Record<string, Source> = Object.fromEntries(
  SOURCES.map((s) => [s.id, s]),
);
