import { prisma } from "@/lib/db";
import { NAAC_CRITERIA_SEED } from "@/lib/data/naac-metrics-seed";

export async function listNaacCriteria() {
  return prisma.naacCriterion.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      number: true,
      title: true,
      inputProcessOutcome: true,
    },
  });
}

export async function listMetrics(criterionId?: string) {
  return prisma.metric.findMany({
    where: {
      isActive: true,
      ...(criterionId ? { criterionId } : {}),
    },
    orderBy: [{ criterion: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    select: {
      id: true,
      code: true,
      title: true,
      description: true,
      criterionId: true,
      criterion: {
        select: {
          number: true,
          title: true,
          inputProcessOutcome: true,
        },
      },
    },
  });
}

/** Upsert all criteria and metrics from seed data (safe to re-run). */
export async function syncNaacMetricsFromSeed() {
  for (const criterion of NAAC_CRITERIA_SEED) {
    const row = await prisma.naacCriterion.upsert({
      where: { number: criterion.number },
      create: {
        number: criterion.number,
        title: criterion.title,
        inputProcessOutcome: criterion.inputProcessOutcome,
        sortOrder: criterion.number,
      },
      update: {
        title: criterion.title,
        inputProcessOutcome: criterion.inputProcessOutcome,
        sortOrder: criterion.number,
        isActive: true,
      },
    });

    for (const [index, metric] of criterion.metrics.entries()) {
      await prisma.metric.upsert({
        where: { code: metric.code },
        create: {
          code: metric.code,
          title: metric.title,
          description: metric.description,
          criterionId: row.id,
          sortOrder: index,
        },
        update: {
          title: metric.title,
          description: metric.description,
          criterionId: row.id,
          sortOrder: index,
          isActive: true,
        },
      });
    }
  }
}
