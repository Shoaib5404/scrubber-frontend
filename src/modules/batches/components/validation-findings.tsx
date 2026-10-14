'use client';

import { useMemo, useState } from 'react';
import { AlertTriangleIcon, InfoIcon, XCircleIcon } from 'lucide-react';
import type { ValidationIssue } from '../types';
import type { ValidationModalName } from './validation-issue-modals';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type SeverityFilter = 'all' | 'error' | 'warning' | 'info';

type ValidationFindingsProps = {
  issues: ValidationIssue[];
  onOpenHelp: (modal: ValidationModalName) => void;
};

function severityOf(issue: ValidationIssue): 'error' | 'warning' | 'info' {
  const s = issue.severity ?? 'error';
  if (s === 'warning' || s === 'info') return s;
  return 'error';
}

export function ValidationFindings({ issues, onOpenHelp }: ValidationFindingsProps) {
  const [filter, setFilter] = useState<SeverityFilter>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return issues;
    return issues.filter((issue) => severityOf(issue) === filter);
  }, [filter, issues]);

  if (issues.length === 0) return null;

  return (
    <Card className="border-destructive/20">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-base">
          Validation findings ({issues.length})
        </CardTitle>
        <Select
          value={filter}
          onValueChange={(value) => setFilter((value as SeverityFilter) ?? 'all')}
        >
          <SelectTrigger className="w-[140px]" aria-label="Filter by severity">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="error">Errors</SelectItem>
            <SelectItem value="warning">Warnings</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No findings for this filter.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {filtered.map((issue, idx) => {
              const severity = severityOf(issue);
              const showNcciHelp = Boolean(issue.help_text);
              const showCerumen = issue.policy_modal === 'cerumen-plan-policy';
              return (
                <li
                  key={`${issue.field ?? 'f'}-${idx}`}
                  className="flex items-start gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
                >
                  <SeverityBadge severity={severity} />
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground">
                      <span className="font-medium">
                        {issue.field ?? 'Unknown'}
                        {issue.rule ? ` (${issue.rule})` : ''}:
                      </span>{' '}
                      {issue.message ?? 'Validation failed'}
                    </p>
                    {(showNcciHelp || showCerumen || issue.details_url) && (
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {showNcciHelp ? (
                          <Button
                            type="button"
                            variant="link"
                            size="xs"
                            className="h-auto px-0"
                            onClick={() => onOpenHelp('ncci-bypass-modifiers')}
                          >
                            NCCI modifier help
                          </Button>
                        ) : null}
                        {showCerumen ? (
                          <Button
                            type="button"
                            variant="link"
                            size="xs"
                            className="h-auto px-0"
                            onClick={() => onOpenHelp('cerumen-plan-policy')}
                          >
                            Cerumen policy
                          </Button>
                        ) : null}
                        {issue.details_url ? (
                          <a
                            href={issue.details_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                          >
                            Details
                          </a>
                        ) : null}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function SeverityBadge({ severity }: { severity: 'error' | 'warning' | 'info' }) {
  const className =
    severity === 'error'
      ? 'bg-destructive/10 text-destructive border-transparent'
      : severity === 'warning'
        ? 'bg-warning/10 text-warning border-transparent'
        : 'bg-info/10 text-info border-transparent';

  const icon =
    severity === 'error' ? (
      <XCircleIcon data-icon="inline-start" />
    ) : severity === 'warning' ? (
      <AlertTriangleIcon data-icon="inline-start" />
    ) : (
      <InfoIcon data-icon="inline-start" />
    );

  const label = severity === 'error' ? 'ERROR' : severity === 'warning' ? 'WARN' : 'INFO';

  return (
    <Badge variant="outline" className={cn('rounded-md shrink-0', className)}>
      {icon}
      {label}
    </Badge>
  );
}
