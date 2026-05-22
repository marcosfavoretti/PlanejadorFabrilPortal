#!/usr/bin/env bash

set -euo pipefail

audit_output=''
audit_status=0

if ! audit_output="$(npm audit --json 2>&1)"; then
  audit_status=$?
fi

if [[ $audit_status -ne 0 && $audit_output != \{* ]]; then
  printf '%s\n' "$audit_output" >&2
  exit "$audit_status"
fi

AUDIT_OUTPUT="$audit_output" node <<'EOF'
const report = JSON.parse(process.env.AUDIT_OUTPUT ?? '{}');
const vulnerabilities = Object.values(report.vulnerabilities ?? {});

const severityRank = {
  info: 0,
  low: 1,
  moderate: 2,
  high: 3,
  critical: 4,
};

const blocking = vulnerabilities.filter((entry) => severityRank[entry.severity] >= severityRank.high);

if (blocking.length > 0) {
  console.error('npm audit encontrou vulnerabilidades high/critical:');
  for (const entry of blocking) {
    console.error(`- ${entry.name} (${entry.severity})`);
    for (const issue of entry.via ?? []) {
      if (typeof issue === 'string') {
        console.error(`  via ${issue}`);
        continue;
      }

      console.error(`  via ${issue.name}: ${issue.title}`);
    }
  }

  process.exit(1);
}

const counts = report.metadata?.vulnerabilities ?? {};
console.log(
  `npm audit sem bloqueios high/critical. ` +
  `Info=${counts.info ?? 0}, low=${counts.low ?? 0}, moderate=${counts.moderate ?? 0}, ` +
  `high=${counts.high ?? 0}, critical=${counts.critical ?? 0}.`
);

const moderate = vulnerabilities.filter((entry) => entry.severity === 'moderate');
if (moderate.length > 0) {
  console.log('Vulnerabilidades moderadas registradas para acompanhamento:');
  for (const entry of moderate) {
    console.log(`- ${entry.name}`);
  }
}
EOF
