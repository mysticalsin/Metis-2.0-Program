/** Offline configuration-policy checker. Does not deploy, approve a vendor or validate live retention. */
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
export function inspectProfile(p) {
  const tests = [];
  const add = (name, passed) => tests.push({ name, passed: !!passed });
  const e = p?.environment || {};
  add('private server, not a desktop sidecar', p?.placement === 'approved_private_service');
  add('reviewed immutable image digest', /^[^\s]+@sha256:[a-f0-9]{64}$/.test(p?.image || ''));
  add('managed Postgres, not pg0 or D1', p?.database === 'managed_postgresql_pgvector');
  add('explicit approved region', typeof p?.region === 'string' && p.region.length > 2 && p.region !== 'REQUIRED');
  add('verbatim document storage off', e.HINDSIGHT_API_STORE_DOCUMENT_TEXT === 'false');
  add('full model traces off', e.HINDSIGHT_API_LLM_TRACE_ENABLED === 'false');
  add('content-bearing OTLP export off', e.HINDSIGHT_API_OTEL_TRACES_ENABLED === 'false' && !e.HINDSIGHT_API_OTEL_EXPORTER_OTLP_ENDPOINT);
  add('raw file/import/export surfaces off', ['HINDSIGHT_API_ENABLE_FILE_UPLOAD_API','HINDSIGHT_API_ENABLE_DOCUMENT_EXPORT_API','HINDSIGHT_API_ENABLE_DOCUMENT_IMPORT_API'].every(k => e[k] === 'false'));
  add('non-verbatim extraction profile', e.HINDSIGHT_API_RETAIN_EXTRACTION_MODE === 'concise');
  add('raw MCP endpoint off', e.HINDSIGHT_API_MCP_ENABLED === 'false');
  add('authentication configured', e.HINDSIGHT_API_TENANT_EXTENSION === 'hindsight_api.extensions.builtin.tenant:ApiKeyTenantExtension' ||
    (typeof e.HINDSIGHT_API_TENANT_EXTENSION === 'string' && p.reviewedCustomTenantExtension === true));
  add('API secret reference, no literal', /^secret:\/\/[A-Za-z0-9/_-]+$/.test(p?.apiKeySecretRef || '') && !('HINDSIGHT_API_TENANT_API_KEY' in e));
  const retention = Number(e.HINDSIGHT_API_OPERATION_RETENTION_DAYS);
  add('finite terminal operation retention', Number.isFinite(retention) && retention > 0 && retention <= 7);
  add('no arbitrary forwarded identity headers', !e.HINDSIGHT_API_EXTENSION_PASSTHROUGH_HEADERS);
  add('no public API, DB or admin console', p?.publicIngress === false && p?.controlPlaneExposed === false && p?.databasePublic === false);
  add('all inference stages reviewed', ['extraction','embedding','reranking','reflection'].every(k => p?.approvedStages?.[k] === true));
  add('bank isolation and directives policy', p?.bankPolicy === 'homogeneous_acl_epoch' && p?.directives === 'operator_reviewed_only');
  add('derived content explicitly approved', p?.retainedContent === 'approved_summaries_preferences_verified_receipts');
  add('no silent cloud fallback', p?.fallbackPolicy === 'approved_routes_only');
  return { scope: 'OFFLINE_CONFIGURATION_ONLY', passed: tests.every(t => t.passed), checks: tests };
}
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  try {
    const p = JSON.parse(await readFile(process.argv[2], 'utf8'));
    const r = inspectProfile(p); console.log(JSON.stringify(r, null, 2)); process.exitCode = r.passed ? 0 : 1;
  } catch { console.error('A readable configuration JSON file is required. No secrets were printed.'); process.exitCode = 2; }
}
