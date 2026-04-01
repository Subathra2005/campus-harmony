import React, { useCallback, useRef, useState } from 'react';
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { useData } from '@/contexts/DataContext';
import type { Book } from '@/types';
import { cn } from '@/lib/utils';

type BookCsvKey = 'title' | 'author' | 'isbn' | 'category' | 'shelf' | 'totalCopies' | 'availableCopies';

const CSV_COLUMNS: Array<{ key: BookCsvKey; label: string }> = [
  { key: 'title', label: 'Title' },
  { key: 'author', label: 'Author' },
  { key: 'isbn', label: 'ISBN' },
  { key: 'category', label: 'Category' },
  { key: 'shelf', label: 'Shelf' },
  { key: 'totalCopies', label: 'Total Copies' },
  { key: 'availableCopies', label: 'Available Copies' },
];

const TEMPLATE_HEADERS = CSV_COLUMNS.map(column => column.label);
const SAMPLE_ROW = 'Design Patterns,Erich Gamma,978-0201633610,Computer Science,CS-03,10,8';
const EXPECTED_COLUMNS_TEXT = CSV_COLUMNS.map(column => column.label).join(', ');

interface CsvRow {
  rowNumber: number;
  values: Record<BookCsvKey, string>;
}

interface UploadReport {
  fileName: string;
  processed: number;
  added: number;
  duplicates: string[];
  errors: string[];
}

const normalizeHeader = (value: string) => value.replace(/[^a-z0-9]/gi, '').toLowerCase();
const normalizedColumnMap = new Map(CSV_COLUMNS.map(column => [normalizeHeader(column.label), column.key]));

const splitCsvLine = (line: string): string[] => {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
};

const parseCsv = (content: string): CsvRow[] => {
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];

  const rawHeaders = splitCsvLine(lines[0]);
  if (rawHeaders.length !== CSV_COLUMNS.length) {
    throw new Error(`CSV must contain exactly ${CSV_COLUMNS.length} columns: ${EXPECTED_COLUMNS_TEXT}.`);
  }

  const mappedHeaders = rawHeaders.map(header => normalizedColumnMap.get(normalizeHeader(header)) ?? null);
  if (mappedHeaders.some(header => header === null)) {
    throw new Error(`CSV header mismatch. Expected columns (any order): ${EXPECTED_COLUMNS_TEXT}.`);
  }

  const duplicateCheck = new Set<BookCsvKey>();
  mappedHeaders.forEach(header => {
    if (!header) return;
    if (duplicateCheck.has(header)) {
      throw new Error('Duplicate columns detected. Please include each required column only once.');
    }
    duplicateCheck.add(header);
  });

  return lines.slice(1).map((line, index) => {
    const cells = splitCsvLine(line);
    if (cells.every(cell => cell.trim().length === 0)) return null;
    if (cells.length !== mappedHeaders.length) {
      throw new Error(`Row ${index + 2} has ${cells.length} column(s) but ${mappedHeaders.length} header(s).`);
    }
    const values = {} as Record<BookCsvKey, string>;
    mappedHeaders.forEach((key, cellIndex) => {
      if (!key) return;
      values[key] = cells[cellIndex] ?? '';
    });
    return { rowNumber: index + 2, values };
  }).filter((row): row is CsvRow => Boolean(row));
};

const buildBook = (row: CsvRow): Book => {
  const missing = CSV_COLUMNS.filter(column => !row.values[column.key]?.trim());
  if (missing.length > 0) {
    throw new Error(`Row ${row.rowNumber}: Missing field(s) ${missing.map(field => field.label).join(', ')}.`);
  }

  const totalCopies = Number(row.values.totalCopies);
  if (!Number.isFinite(totalCopies) || totalCopies <= 0) {
    throw new Error(`Row ${row.rowNumber}: Invalid total copies "${row.values.totalCopies}".`);
  }
  const availableCopies = Number(row.values.availableCopies);
  if (!Number.isFinite(availableCopies) || availableCopies < 0) {
    throw new Error(`Row ${row.rowNumber}: Invalid available copies "${row.values.availableCopies}".`);
  }
  const safeAvailable = Math.min(availableCopies, totalCopies);

  return {
    id: crypto.randomUUID(),
    title: row.values.title.trim(),
    author: row.values.author.trim(),
    isbn: row.values.isbn.trim(),
    category: row.values.category.trim(),
    shelf: row.values.shelf.trim(),
    totalCopies,
    availableCopies: safeAvailable,
  };
};

const hydrateBooks = async (rows: CsvRow[]) => {
  const valid: Book[] = [];
  const errors: string[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    try {
      valid.push(buildBook(rows[i]));
    } catch (error) {
      errors.push(error instanceof Error ? error.message : `Row ${rows[i].rowNumber}: Unable to parse.`);
    }
    if ((i + 1) % 400 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  return { valid, errors };
};

export default function LibraryBulkUpload() {
  const { addBooksBulk } = useData();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [report, setReport] = useState<UploadReport | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    try {
      const content = await file.text();
      const parsed = parseCsv(content);
      if (parsed.length === 0) throw new Error('No data rows detected in the file.');
      const { valid, errors } = await hydrateBooks(parsed);
      if (valid.length === 0) {
        setReport({ fileName: file.name, processed: parsed.length, added: 0, duplicates: [], errors });
        toast({ title: 'No books added', description: 'Every row in the file contains validation errors.', variant: 'destructive' });
        return;
      }
      const { inserted, duplicates } = addBooksBulk(valid);
      setReport({ fileName: file.name, processed: parsed.length, added: inserted.length, duplicates, errors });
      toast({
        title: `${inserted.length} book${inserted.length === 1 ? '' : 's'} added`,
        description: duplicates.length > 0 ? `${duplicates.length} duplicate entr${duplicates.length === 1 ? 'y was' : 'ies were'} skipped.` : undefined,
      });
    } catch (error) {
      toast({ title: 'Upload failed', description: error instanceof Error ? error.message : 'Unable to read the CSV file.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  }, [addBooksBulk, toast]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
    event.target.value = '';
  }, [processFile]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const downloadTemplate = useCallback(() => {
    const csv = `${TEMPLATE_HEADERS.join(',')}` + `\n${SAMPLE_ROW}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'campus-harmony-library-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Bulk Library Catalog Import</CardTitle>
        <CardDescription>CSV must include only these columns: {EXPECTED_COLUMNS_TEXT}. Available copies cannot exceed total copies.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition-colors',
            isDragging ? 'border-primary bg-primary/5' : 'border-muted'
          )}
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Drag & drop your CSV</p>
            <p className="text-xs text-muted-foreground">or</p>
          </div>
          <Button size="sm" disabled={isProcessing} onClick={() => fileInputRef.current?.click()}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Browse files
          </Button>
          <Input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
          <span className="text-[11px] text-muted-foreground">Max 25 MB per upload</span>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {CSV_COLUMNS.map(column => (
            <Badge key={column.key} variant="outline">{column.label}</Badge>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={downloadTemplate}>
            Download template
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Select CSV'}
          </Button>
        </div>

        {report && (
          <div className="rounded-xl border bg-muted/30 p-4 text-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Latest upload</p>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <div>
                  <p className="text-xs text-muted-foreground">Added</p>
                  <p className="text-base font-semibold">{report.added}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Processed rows</p>
                <p className="text-base font-semibold">{report.processed}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Duplicates skipped</p>
                <p className="text-base font-semibold">{report.duplicates.length}</p>
              </div>
            </div>
            {(report.errors.length > 0 || report.duplicates.length > 0) && (
              <ScrollArea className="mt-3 max-h-32">
                <ul className="space-y-2 text-xs">
                  {report.errors.map((err, idx) => (
                    <li key={`err-${idx}`} className="flex items-start gap-2 text-destructive">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5" />
                      <span>{err}</span>
                    </li>
                  ))}
                  {report.duplicates.map(id => (
                    <li key={id} className="flex items-start gap-2 text-amber-500">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5" />
                      <span>Skipped duplicate book: {id}</span>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
