/**
 * Executa a suíte de avaliação do motor da S.A.M.I. e grava o resultado exibido na página.
 *
 *   npm run sami:eval
 *
 * O teste tests/sami.test.ts recalcula as métricas de qualidade e falha se o arquivo
 * gravado divergir — assim a página nunca mostra números de uma versão antiga do motor.
 */
import { writeFileSync } from "node:fs";
import { platform } from "node:os";
import { join } from "node:path";
import { measureLatency, runEval } from "../src/lib/sami/eval";

const report = runEval();
const latencyMs = measureLatency();
const out = {
  generatedAt: new Date().toISOString(),
  environment: `Node.js ${process.version} · ${platform()}`,
  ...report,
  latencyMs,
};

const file = join(process.cwd(), "src", "content", "sami-eval.json");
writeFileSync(file, `${JSON.stringify(out, null, 2)}\n`);

const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1)}%` : "—");
console.log(`Casos: ${report.cases}`);
console.log(`Mecanismo correto: ${report.mechanism.correct}/${report.mechanism.total} (${pct(report.mechanism.correct, report.mechanism.total)})`);
console.log(`Registros: recall ${pct(report.records.found, report.records.expected)} · precisão ${pct(report.records.relevant, report.records.returned)}`);
console.log(`Documentos: recall ${pct(report.docs.found, report.docs.expected)} · precisão ${pct(report.docs.relevant, report.docs.returned)}`);
console.log(`Recusas corretas: ${report.refusals.correct}/${report.refusals.total} · recusas indevidas: ${report.falseRefusals.count}/${report.falseRefusals.total}`);
console.log(`Referências válidas: ${report.references.valid}/${report.references.total}`);
console.log(`Latência do motor: p50 ${latencyMs.p50} ms · p95 ${latencyMs.p95} ms (${latencyMs.runs} execuções)`);
if (report.failures.length) {
  console.log(`\nDivergências (${report.failures.length}):`);
  for (const f of report.failures) console.log(JSON.stringify(f));
}
console.log(`\nGravado em ${file}`);
