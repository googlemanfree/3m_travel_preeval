import { sql, type SQL } from "drizzle-orm";
import { NOT_ARCHIVED_EVALUATION_SQL } from "./evaluationArchive";
import { DOSSIER_STAGE_IDS, DOSSIER_STATUS_STAGE, dossierStageOf, dossierStatusLabel, isDossierStage, type DossierStage } from "../../shared/dossierStages";

/**
 * Liste des candidats : filtres, compteurs et pagination calculés PAR LA BASE.
 *
 * Avant : les 5 000 derniers dossiers de chaque source étaient rapatriés à chaque affichage, puis filtrés, triés et découpés en mémoire.
 * Conséquences : un dossier au-delà de la 5 000e ligne devenait invisible et introuvable par la recherche, et chaque rafraîchissement
 * transférait des milliers de lignes pour n'en montrer que 25.
 *
 * Maintenant : trois sources (dossiers en ligne, dossiers agence, comptes sans dossier), chacune filtrée et comptée en SQL.
 * Seules les lignes de la page demandée sont lues (par source, les `page × taille` premières, fusionnées puis découpées),
 * et les informations annexes (documents, portrait) ne sont cherchées que pour ces lignes.
 * Le résultat a exactement la forme de l'ancien (voir `candidateListQuery.db.test.ts`, qui compare les deux sur une base réelle).
 */

export type ListFilter = {
  search: string; status: string; paymentStatus: "all" | "paye" | "en_attente" | "non_paye"; scoreBand: "all" | "excellent" | "bon" | "moyen" | "faible";
  destination: string; portraitStatus: "all" | "missing" | "pending" | "verified" | "rejected"; cvStatus: "all" | "a_traiter" | "recu" | "sans";
  /** « evalue » : bilan envoyé ou évaluation validée par un conseiller ; « non_evalue » : ni l'un ni l'autre. */
  evaluationStatus: "all" | "evalue" | "non_evalue";
  sortBy: "createdAt" | "fullName" | "score" | "priorite"; sortDirection: "asc" | "desc"; page: number; pageSize: number;
};

export type ListedCandidate = {
  id: string; applicationNumber: string; fullName: string; email: string; phone: string; destination: string; visaType: string; scoringTotal: number;
  scoringBadge: "excellent" | "bon" | "moyen" | "faible"; status: string; stage: DossierStage; statusLabel: string; paymentStatus: "paye" | "en_attente" | "non_paye";
  createdAt: Date; documentsCount: number; source: "web" | "agence" | "compte" | "evaluation"; avatarUrl: string | null; avatarVerificationStatus: string;
  avatarVerificationReason: string | null; avatarFaceCount: number; cvReceived: boolean; bilanSent: boolean; evaluated: boolean;
};

export type ListResult = {
  candidates: ListedCandidate[];
  stats: { scopeTotal: number; stageCounts: Record<DossierStage, number>; paidCount: number; withoutDossierCount: number; evaluationOnlyCount: number; cvToProcessCount: number; cvReceivedCount: number; evaluatedCount: number; notEvaluatedCount: number };
  /** Effectifs des classements rapides : calculés avec la recherche et les filtres actifs, mais SANS le choix de classement lui-même (ils ne bougent pas quand on change d'onglet). */
  tabCounts: { all: number; cvToProcess: number; cvReceived: number; evaluated: number; notEvaluated: number };
  total: number; page: number; pageSize: number; totalPages: number;
};

type Db = { execute: (query: SQL) => Promise<unknown> };
type Source = "web" | "agence" | "compte" | "evaluation";
const ID_PREFIX: Record<Source, string> = { web: "online", agence: "agency", compte: "account", evaluation: "evaluation" };

/** Statuts connus par étape : les statuts inconnus ou vides retombent dans « nouveau », comme dans `dossierStageOf`. */
const KNOWN_STATUSES = Object.keys(DOSSIER_STATUS_STAGE);
const statusesOfStage = (stage: DossierStage) => KNOWN_STATUSES.filter((status) => DOSSIER_STATUS_STAGE[status] === stage);

const escapeLike = (value: string) => value.replace(/[\\%_]/g, (match) => `\\${match}`);
const inList = (values: string[]) => sql.join(values.map((value) => sql`${value}`), sql`, `);

/** Expressions SQL par source : mêmes règles que le chargement en mémoire (valeurs par défaut, états de paiement, bande de score). */
function definition(source: Source) {
  if (source === "web") {
    return {
      table: sql.raw("applications"), alias: sql.raw("s"),
      id: sql.raw("s.id"), createdAt: sql.raw("s.createdAt"), email: sql.raw("s.email"), name: sql.raw("s.fullName"), phone: sql.raw("s.whatsappNumber"),
      number: sql.raw("s.dossierNumber"), status: sql.raw("s.dossierStatus"),
      destination: sql.raw("COALESCE(NULLIF(s.destination, ''), 'Non spécifiée')"), visa: sql.raw("COALESCE(NULLIF(s.visaType, ''), 'Non spécifié')"),
      score: sql.raw("COALESCE(s.scoringTotal, s.evaluationScore, 0)"),
      band: sql.raw("CASE s.scoringBadge WHEN 'eligible' THEN 'excellent' WHEN 'admissible' THEN 'bon' ELSE 'faible' END"),
      payment: sql.raw("CASE s.paymentStatus WHEN 'SUCCESS' THEN 'paye' WHEN 'PENDING' THEN 'en_attente' ELSE 'non_paye' END"),
      ownCv: sql.raw("(s.cvUrl IS NOT NULL AND TRIM(s.cvUrl) <> '')"), ownBilan: sql.raw("(s.evaluationDeliveryStatus = 'sent')"),
      base: sql.raw("1 = 1"),
    };
  }
  if (source === "agence") {
    return {
      table: sql.raw("agency_dossiers"), alias: sql.raw("s"),
      id: sql.raw("s.id"), createdAt: sql.raw("s.createdAt"), email: sql.raw("s.email"), name: sql.raw("s.fullName"), phone: sql.raw("s.phone"),
      number: sql.raw("CONCAT('3M-AGN-', IF(s.id < 1000, LPAD(s.id, 4, '0'), CAST(s.id AS CHAR)))"), status: sql.raw("s.status"),
      destination: sql.raw("COALESCE(NULLIF(s.destination, ''), 'Non spécifiée')"), visa: sql.raw("COALESCE(NULLIF(s.visaType, ''), 'Non spécifié')"),
      score: sql.raw("0"), band: sql.raw("'faible'"), payment: sql.raw("'non_paye'"), ownCv: sql.raw("0"), ownBilan: sql.raw("0"),
      base: sql.raw("1 = 1"),
    };
  }
  if (source === "evaluation") {
    return {
      table: sql.raw("evaluations"), alias: sql.raw("s"),
      id: sql.raw("s.id"), createdAt: sql.raw("s.createdAt"), email: sql.raw("s.email"), name: sql.raw("s.fullName"), phone: sql.raw("s.phone"),
      number: sql.raw("COALESCE(NULLIF(s.referenceCode, ''), CONCAT('Évaluation n° ', CAST(s.id AS CHAR)))"), status: sql.raw("s.status"),
      // la colonne referenceCode a un interclassement différent (binaire) : la recherche porte séparément sur la colonne et sur la référence calculée, sans les mélanger
      searchNumbers: [sql.raw("s.referenceCode"), sql.raw("CONCAT('Évaluation n° ', CAST(s.id AS CHAR))")],
      destination: sql.raw("COALESCE(NULLIF(s.destinationCountry, ''), 'Non spécifiée')"), visa: sql.raw("COALESCE(NULLIF(s.projectType, ''), NULLIF(s.visaType, ''), 'Non spécifié')"),
      score: sql.raw("0"), band: sql.raw("'faible'"), payment: sql.raw("'non_paye'"),
      ownCv: sql.raw("(s.cvFileUrl IS NOT NULL AND TRIM(s.cvFileUrl) <> '')"), ownBilan: sql.raw("(s.finalResponseSentAt IS NOT NULL)"),
      // évaluation faite par une personne qui n'a NI compte, NI dossier en ligne, NI dossier agence (la dernière de chaque adresse) :
      // sans cette source, son CV et ses documents n'apparaissaient dans aucune liste de candidats. Les comptes supprimés comptent comme des comptes.
      base: sql.raw(NOT_ARCHIVED_EVALUATION_SQL + " AND s.id IN (SELECT MAX(xe.id) FROM evaluations xe GROUP BY LOWER(xe.email)) AND LOWER(s.email) NOT IN (SELECT LOWER(xa.email) FROM applications xa) AND LOWER(s.email) NOT IN (SELECT LOWER(xg.email) FROM agency_dossiers xg) AND LOWER(s.email) NOT IN (SELECT LOWER(xc.email) FROM candidates xc)"),
    };
  }
  return {
    table: sql.raw("candidates"), alias: sql.raw("s"),
    id: sql.raw("s.id"), createdAt: sql.raw("s.createdAt"), email: sql.raw("s.email"), name: sql.raw("s.fullName"), phone: sql.raw("COALESCE(s.phone, '')"),
    number: sql.raw("CONCAT('COMPTE-', IF(s.id < 10000, LPAD(s.id, 5, '0'), CAST(s.id AS CHAR)))"), status: sql.raw("s.dossierStatus"),
    destination: sql.raw("COALESCE(NULLIF(s.destination, ''), 'Non spécifiée')"), visa: sql.raw("COALESCE(NULLIF(s.visaType, ''), 'Non spécifié')"),
    score: sql.raw("0"), band: sql.raw("'faible'"), payment: sql.raw("'non_paye'"), ownCv: sql.raw("0"), ownBilan: sql.raw("0"),
    // compte sans dossier : ni en ligne ni agence, et non supprimé. « NOT IN (sous-requête) » est matérialisé une fois par la base :
    // mesuré 40 fois plus rapide que les formes « NOT EXISTS corrélé » ou « jointure sur sous-requête » (les adresses ne sont jamais nulles).
    base: sql.raw("s.deletedAt IS NULL AND LOWER(s.email) NOT IN (SELECT LOWER(xa.email) FROM applications xa) AND LOWER(s.email) NOT IN (SELECT LOWER(xg.email) FROM agency_dossiers xg)"),
  };
}

type Options = { withPublished: boolean };

function joins(options: Options, needPortrait: boolean): SQL {
  const parts: SQL[] = [
    sql` LEFT JOIN (SELECT LOWER(e.email) AS em FROM evaluations e WHERE e.cvFileUrl IS NOT NULL AND e.cvFileUrl <> '' UNION SELECT LOWER(c.email) FROM candidates c INNER JOIN candidate_files f ON f.candidateId = c.id WHERE f.fileType = 'cv' UNION SELECT LOWER(d.candidateEmail) FROM client_documents d WHERE d.documentType = 'cv') cvx ON cvx.em = LOWER(s.email)`,
  ];
  parts.push(options.withPublished
    ? sql` LEFT JOIN (SELECT DISTINCT LOWER(e.email) AS em FROM evaluation_validation_cases v INNER JOIN evaluations e ON e.id = v.evaluationId WHERE v.publishedAt IS NOT NULL) pubx ON pubx.em = LOWER(s.email)`
    : sql` LEFT JOIN (SELECT NULL AS em) pubx ON 1 = 0`);
  // évaluation validée par un conseiller (hors ligne : appel, agence, e-mail) sur le compte portant cette adresse
  parts.push(sql` LEFT JOIN (SELECT DISTINCT LOWER(c.email) AS em FROM candidates c WHERE c.evaluationDeclarationStatus = 'validated') valx ON valx.em = LOWER(s.email)`);
  if (needPortrait) parts.push(sql` LEFT JOIN (SELECT LOWER(c.email) AS em, MAX(c.avatarVerificationStatus) AS st FROM candidates c GROUP BY LOWER(c.email)) avx ON avx.em = LOWER(s.email)`);
  return sql.join(parts, sql``);
}

/** Déjà évalué : bilan envoyé (ou publié) au candidat, ou évaluation validée par un conseiller hors ligne. */
function evaluatedExpression(def: ReturnType<typeof definition>): SQL {
  return sql`(${def.ownBilan} OR pubx.em IS NOT NULL OR valx.em IS NOT NULL)`;
}

/** Conditions communes à tous les compteurs (le filtre d'étape en est exclu : les compteurs par étape l'ignorent). */
function scopeConditions(source: Source, filter: ListFilter): SQL[] {
  const def = definition(source);
  const conditions: SQL[] = [def.base];
  const query = filter.search.trim().toLowerCase();
  if (query) {
    const pattern = `%${escapeLike(query)}%`;
    const searched = [def.name, def.email, ...("searchNumbers" in def ? def.searchNumbers : [def.number]), def.destination, def.visa];
    conditions.push(sql`(${sql.join(searched.map((column) => sql`LOWER(${column}) LIKE ${pattern}`), sql` OR `)})`);
  }
  if (filter.paymentStatus !== "all") conditions.push(sql`${def.payment} = ${filter.paymentStatus}`);
  if (filter.scoreBand !== "all") conditions.push(sql`${def.band} = ${filter.scoreBand}`);
  if (filter.destination !== "all") conditions.push(sql`LOWER(${def.destination}) = ${filter.destination.toLowerCase()}`);
  if (filter.portraitStatus !== "all") conditions.push(sql`COALESCE(avx.st, 'missing') = ${filter.portraitStatus}`);
  const hasCv = sql`(${def.ownCv} OR cvx.em IS NOT NULL)`;
  const evaluated = evaluatedExpression(def);
  if (filter.cvStatus === "a_traiter") conditions.push(sql`(${hasCv} AND NOT ${evaluated})`);
  else if (filter.cvStatus === "recu") conditions.push(hasCv);
  else if (filter.cvStatus === "sans") conditions.push(sql`NOT ${hasCv}`);
  if (filter.evaluationStatus === "evalue") conditions.push(evaluated);
  else if (filter.evaluationStatus === "non_evalue") conditions.push(sql`NOT ${evaluated}`);
  return conditions;
}

function stageCondition(source: Source, status: string): SQL | null {
  if (status === "all") return null;
  const column = definition(source).status;
  if (!isDossierStage(status)) return sql`${column} = ${status}`;
  const known = statusesOfStage(status);
  if (status === "nouveau") return sql`(${column} IS NULL OR TRIM(${column}) = '' OR ${column} NOT IN (${inList(KNOWN_STATUSES)}) OR ${column} IN (${inList(known)}))`;
  return known.length ? sql`${column} IN (${inList(known)})` : sql`1 = 0`;
}

const rowsOf = (result: unknown): Array<Record<string, unknown>> => {
  const first = Array.isArray(result) ? result[0] : result;
  return Array.isArray(first) ? (first as Array<Record<string, unknown>>) : [];
};

function orderBy(source: Source, filter: ListFilter): SQL {
  const def = definition(source);
  // Priorité : CV reçu et bilan à faire d'abord (le plus ancien en tête), puis tous les autres du plus récent au plus ancien.
  if (filter.sortBy === "priorite") {
    const todo = sql`(${def.ownCv} OR cvx.em IS NOT NULL) AND NOT ${evaluatedExpression(def)}`;
    return sql` ORDER BY CASE WHEN ${todo} THEN 0 ELSE 1 END ASC, CASE WHEN ${todo} THEN ${def.createdAt} END ASC, ${def.createdAt} DESC, ${def.id} DESC`;
  }
  const direction = sql.raw(filter.sortDirection === "asc" ? "ASC" : "DESC");
  // un score constant (dossiers agence, comptes) ne se trie pas : « ORDER BY 0 » serait lu comme un numéro de colonne
  if (filter.sortBy === "score" && source !== "web") return sql` ORDER BY ${def.createdAt} DESC, ${def.id} DESC`;
  const column = filter.sortBy === "score" ? def.score : filter.sortBy === "fullName" ? def.name : def.createdAt;
  return sql` ORDER BY ${column} ${direction}, ${def.createdAt} DESC, ${def.id} DESC`;
}

async function counts(db: Db, source: Source, filter: ListFilter, options: Options) {
  const def = definition(source);
  const needPortrait = filter.portraitStatus !== "all";
  const where = sql.join(scopeConditions(source, filter), sql` AND `);
  const hasCv = sql`(${def.ownCv} OR cvx.em IS NOT NULL)`;
  const evaluated = evaluatedExpression(def);
  const query = sql`SELECT ${def.status} AS st, ${def.payment} AS pay, COUNT(*) AS n, SUM(CASE WHEN ${hasCv} THEN 1 ELSE 0 END) AS cv, SUM(CASE WHEN ${hasCv} AND NOT ${evaluated} THEN 1 ELSE 0 END) AS todo, SUM(CASE WHEN ${evaluated} THEN 1 ELSE 0 END) AS ev FROM ${def.table} s${joins(options, needPortrait)} WHERE ${where} GROUP BY ${def.status}, ${def.payment}`;
  return rowsOf(await db.execute(query)).map((row) => ({ status: (row.st as string | null) ?? null, payment: String(row.pay), n: Number(row.n), cv: Number(row.cv), todo: Number(row.todo), ev: Number(row.ev) }));
}

/** Effectifs des onglets de classement rapide (sans le choix de classement ni l'étape). */
async function tabCountsFor(db: Db, source: Source, filter: ListFilter, options: Options) {
  const def = definition(source);
  const neutral: ListFilter = { ...filter, cvStatus: "all", evaluationStatus: "all" };
  const where = sql.join(scopeConditions(source, neutral), sql` AND `);
  const hasCv = sql`(${def.ownCv} OR cvx.em IS NOT NULL)`;
  const evaluated = evaluatedExpression(def);
  const query = sql`SELECT COUNT(*) AS n, SUM(CASE WHEN ${hasCv} AND NOT ${evaluated} THEN 1 ELSE 0 END) AS todo, SUM(CASE WHEN ${hasCv} THEN 1 ELSE 0 END) AS cv, SUM(CASE WHEN ${evaluated} THEN 1 ELSE 0 END) AS ev FROM ${def.table} s${joins(options, neutral.portraitStatus !== "all")} WHERE ${where}`;
  const [row] = rowsOf(await db.execute(query));
  return { n: Number(row?.n ?? 0), todo: Number(row?.todo ?? 0), cv: Number(row?.cv ?? 0), ev: Number(row?.ev ?? 0) };
}

async function pageRows(db: Db, source: Source, filter: ListFilter, options: Options, limit: number) {
  const def = definition(source);
  const needPortrait = filter.portraitStatus !== "all";
  const conditions = scopeConditions(source, filter);
  const stage = stageCondition(source, filter.status);
  if (stage) conditions.push(stage);
  const where = sql.join(conditions, sql` AND `);
  const query = sql`SELECT ${def.id} AS id, ${def.number} AS number, ${def.name} AS name, ${def.email} AS email, ${def.phone} AS phone, ${def.destination} AS destination, ${def.visa} AS visa, ${def.score} AS score, ${def.band} AS band, ${def.status} AS st, ${def.payment} AS pay, ${def.createdAt} AS createdAt, (${def.ownCv} OR cvx.em IS NOT NULL) AS cv, (${def.ownBilan} OR pubx.em IS NOT NULL) AS bilan, ${evaluatedExpression(def)} AS evaluated, (((${def.ownCv}) OR cvx.em IS NOT NULL) AND NOT ${evaluatedExpression(def)}) AS todo FROM ${def.table} s${joins(options, needPortrait)} WHERE ${where}${orderBy(source, filter)} LIMIT ${limit}`;
  return rowsOf(await db.execute(query));
}

let publishedTableMissingUntil = 0;

export async function queryCandidateList(db: Db, filter: ListFilter): Promise<ListResult> {
  const run = async (options: Options): Promise<ListResult> => {
    const sources: Source[] = ["web", "agence", "compte", "evaluation"];
    // Compteurs et lignes de la page demandée partent ensemble (un seul aller-retour) ; si la page demandée dépasse la dernière, on relit la bonne.
    const fetchWindow = (page: number) => Promise.all(sources.map(async (source) => (await pageRows(db, source, filter, options, page * filter.pageSize)).map((row) => ({ source, row }))));
    const speculative = filter.page <= 20; // une page très lointaine n'est pas lue avant de savoir qu'elle existe
    const [groups, firstTry, tabs] = await Promise.all([Promise.all(sources.map((source) => counts(db, source, filter, options))), speculative ? fetchWindow(filter.page) : Promise.resolve(null), Promise.all(sources.map((source) => tabCountsFor(db, source, filter, options)))]);
    const stageCounts = Object.fromEntries(DOSSIER_STAGE_IDS.map((stage) => [stage, 0])) as Record<DossierStage, number>;
    let scopeTotal = 0, paid = 0, cvReceived = 0, cvToProcess = 0, evaluatedTotal = 0, total = 0;
    const matches = (status: string | null) => filter.status === "all" || (isDossierStage(filter.status) ? dossierStageOf(status) === filter.status : (status ?? "") === filter.status);
    for (const rows of groups) {
      for (const row of rows) {
        scopeTotal += row.n; stageCounts[dossierStageOf(row.status)] += row.n; cvReceived += row.cv; cvToProcess += row.todo; evaluatedTotal += row.ev;
        if (row.payment === "paye") paid += row.n;
        if (matches(row.status)) total += row.n;
      }
    }
    const withoutDossierCount = groups[2].reduce((sum, row) => sum + row.n, 0);
    const evaluationOnlyCount = groups[3].reduce((sum, row) => sum + row.n, 0);

    const totalPages = Math.max(1, Math.ceil(total / filter.pageSize));
    const page = Math.min(filter.page, totalPages);
    const offset = (page - 1) * filter.pageSize;
    const perSource = firstTry && page === filter.page ? firstTry : await fetchWindow(page);
    const direction = filter.sortDirection === "asc" ? 1 : -1;
    const merged = perSource.flat().sort((a, b) => {
      if (filter.sortBy === "priorite") {
        const todoA = Number(a.row.todo) > 0, todoB = Number(b.row.todo) > 0;
        const timeDiff = new Date(a.row.createdAt as string).getTime() - new Date(b.row.createdAt as string).getTime();
        if (todoA !== todoB) return todoA ? -1 : 1;
        return todoA ? timeDiff : -timeDiff;
      }
      let diff = 0;
      if (filter.sortBy === "score") diff = Number(a.row.score) - Number(b.row.score);
      else if (filter.sortBy === "fullName") diff = String(a.row.name).localeCompare(String(b.row.name), "fr");
      if (diff === 0) diff = new Date(a.row.createdAt as string).getTime() - new Date(b.row.createdAt as string).getTime();
      return direction * diff;
    }).slice(offset, offset + filter.pageSize);

    const emails: string[] = Array.from(new Set<string>(merged.map(({ row }) => String(row.email).toLowerCase())));
    const [documents, portraits] = emails.length === 0 ? [[], []] : await Promise.all([
      db.execute(sql`SELECT LOWER(candidateEmail) AS em, COUNT(*) AS n FROM client_documents WHERE LOWER(candidateEmail) IN (${inList(emails)}) GROUP BY LOWER(candidateEmail)`).then(rowsOf),
      db.execute(sql`SELECT LOWER(email) AS em, avatarUrl, avatarVerificationStatus AS st, avatarVerificationReason AS reason, avatarFaceCount AS faces FROM candidates WHERE LOWER(email) IN (${inList(emails)}) ORDER BY id ASC`).then(rowsOf),
    ]);
    const documentCounts = new Map(documents.map((row) => [String(row.em), Number(row.n)] as const));
    const avatars = new Map<string, Record<string, unknown>>();
    for (const row of portraits) avatars.set(String(row.em), row); // plusieurs comptes de même adresse : le dernier l'emporte, comme avant

    const candidates: ListedCandidate[] = merged.map(({ source, row }) => {
      const email = String(row.email);
      const avatar = avatars.get(email.toLowerCase());
      const status = (row.st as string | null) ?? null;
      return {
        id: `${ID_PREFIX[source]}_${row.id}`,
        applicationNumber: String(row.number), fullName: String(row.name), email, phone: String(row.phone ?? ""), destination: String(row.destination), visaType: String(row.visa),
        scoringTotal: Number(row.score), scoringBadge: row.band as ListedCandidate["scoringBadge"], status: status as string, stage: dossierStageOf(status), statusLabel: dossierStatusLabel(status),
        paymentStatus: row.pay as ListedCandidate["paymentStatus"], createdAt: new Date(row.createdAt as string), documentsCount: documentCounts.get(email.toLowerCase()) ?? 0, source,
        avatarUrl: (avatar?.avatarUrl as string | null | undefined) ?? null, avatarVerificationStatus: (avatar?.st as string | null | undefined) ?? "missing",
        avatarVerificationReason: (avatar?.reason as string | null | undefined) ?? null, avatarFaceCount: Number(avatar?.faces ?? 0),
        cvReceived: Number(row.cv) > 0, bilanSent: Number(row.bilan) > 0, evaluated: Number(row.evaluated) > 0,
      };
    });
    return { candidates, stats: { scopeTotal, stageCounts, paidCount: paid, withoutDossierCount, evaluationOnlyCount, cvToProcessCount: cvToProcess, cvReceivedCount: cvReceived, evaluatedCount: evaluatedTotal, notEvaluatedCount: scopeTotal - evaluatedTotal }, tabCounts: { all: tabs.reduce((sum, t) => sum + t.n, 0), cvToProcess: tabs.reduce((sum, t) => sum + t.todo, 0), cvReceived: tabs.reduce((sum, t) => sum + t.cv, 0), evaluated: tabs.reduce((sum, t) => sum + t.ev, 0), notEvaluated: tabs.reduce((sum, t) => sum + t.n - t.ev, 0) }, total, page, pageSize: filter.pageSize, totalPages };
  };

  // La table du parcours de validation peut manquer sur une base non migrée : la liste continue de fonctionner sans « bilan publié ».
  if (Date.now() < publishedTableMissingUntil) return run({ withPublished: false });
  try {
    return await run({ withPublished: true });
  } catch (error) {
    const text = String((error as { cause?: { message?: string }; message?: string })?.cause?.message ?? (error as Error)?.message ?? "");
    if (!/evaluation_validation_cases|doesn't exist|no such table/i.test(text)) throw error;
    publishedTableMissingUntil = Date.now() + 60_000;
    return run({ withPublished: false });
  }
}

export function resetCandidateListQueryForTests() { publishedTableMissingUntil = 0; }

/**
 * Adresses (en minuscules) des personnes dont le CV est reçu et le bilan pas encore fait : même règle que le classement « CV reçu à traiter ».
 * CV reçu = CV de l'évaluation, CV du compte, CV déposé à l'évaluation (documents) ou CV du dossier en ligne.
 * Déjà évalué = bilan publié, bilan envoyé, ou évaluation validée par un conseiller.
 */
export async function loadCvToProcessEmails(db: Db): Promise<Set<string>> {
  const build = (withPublished: boolean) => sql`
    SELECT DISTINCT cvx.em AS em FROM (
      SELECT LOWER(e.email) AS em FROM evaluations e WHERE e.cvFileUrl IS NOT NULL AND e.cvFileUrl <> ''
      UNION SELECT LOWER(c.email) FROM candidates c INNER JOIN candidate_files f ON f.candidateId = c.id WHERE f.fileType = 'cv'
      UNION SELECT LOWER(d.candidateEmail) FROM client_documents d WHERE d.documentType = 'cv'
      UNION SELECT LOWER(a.email) FROM applications a WHERE a.deletedAt IS NULL AND a.cvUrl IS NOT NULL AND TRIM(a.cvUrl) <> ''
    ) cvx
    WHERE cvx.em NOT IN (SELECT LOWER(c.email) FROM candidates c WHERE c.evaluationDeclarationStatus = 'validated')
      AND cvx.em NOT IN (SELECT LOWER(a.email) FROM applications a WHERE a.evaluationDeliveryStatus = 'sent')
      ${withPublished ? sql`AND cvx.em NOT IN (SELECT LOWER(e.email) FROM evaluation_validation_cases v INNER JOIN evaluations e ON e.id = v.evaluationId WHERE v.publishedAt IS NOT NULL)` : sql``}`;
  let rows: Array<Record<string, unknown>>;
  try {
    rows = rowsOf(await db.execute(build(Date.now() >= publishedTableMissingUntil)));
  } catch (error) {
    const text = String((error as { cause?: { message?: string }; message?: string })?.cause?.message ?? (error as Error)?.message ?? "");
    if (!/evaluation_validation_cases|doesn't exist|no such table/i.test(text)) throw error;
    publishedTableMissingUntil = Date.now() + 60_000;
    rows = rowsOf(await db.execute(build(false)));
  }
  return new Set(rows.map((row) => String(row.em)));
}
