import React from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AuditPage() {
  const { auditLogs } = useData();

  return (
    <div className="space-y-6">
      <div><h1 className="module-header">Audit Logs</h1><p className="text-muted-foreground text-sm">{auditLogs.length} entries</p></div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Timestamp</TableHead><TableHead>User</TableHead><TableHead>Module</TableHead><TableHead>Action</TableHead><TableHead className="hidden md:table-cell">Details</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {auditLogs.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No audit logs yet. Actions will be recorded here.</TableCell></TableRow>}
                {auditLogs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs font-mono">{new Date(log.timestamp).toLocaleString()}</TableCell>
                    <TableCell className="text-sm">{log.userName}</TableCell>
                    <TableCell><span className="badge-info">{log.module}</span></TableCell>
                    <TableCell className="text-sm">{log.action}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{log.details}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
