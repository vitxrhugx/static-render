import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  FileSpreadsheet, 
  Check, 
  X, 
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Download,
  Link,
  Loader2,
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";

interface DataImportWizardProps {
  onImport: (data: Record<string, string | number>[]) => void;
  onClose?: () => void;
}

type Step = 'source' | 'upload' | 'mapping' | 'preview' | 'complete';
type Source = 'csv' | 'excel' | 'google-sheets';

const standardFields = [
  { id: 'date', label: 'Data', required: true },
  { id: 'scheduled', label: 'Operações Agendadas', required: false },
  { id: 'completed', label: 'Operações Concluídas', required: false },
  { id: 'cancelled', label: 'Operações Canceladas', required: false },
  { id: 'reason', label: 'Motivo Cancelamento', required: false },
  { id: 'location', label: 'Localidade', required: false },
  { id: 'ignore', label: '-- Ignorar Coluna --', required: false },
];

export function DataImportWizard({ onImport, onClose }: DataImportWizardProps) {
  const [step, setStep] = useState<Step>('source');
  const [source, setSource] = useState<Source>('csv');
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('');
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);

  const autoDetectMapping = (headers: string[]) => {
    const autoMapping: Record<string, string> = {};
    headers.forEach((header, index) => {
      const headerLower = header.toLowerCase();
      if (headerLower.includes('data') || headerLower.includes('date')) {
        autoMapping[index.toString()] = 'date';
      } else if (headerLower.includes('agendad') || headerLower.includes('schedule')) {
        autoMapping[index.toString()] = 'scheduled';
      } else if (headerLower.includes('conclu') || headerLower.includes('complete')) {
        autoMapping[index.toString()] = 'completed';
      } else if (headerLower.includes('cancel')) {
        autoMapping[index.toString()] = 'cancelled';
      } else if (headerLower.includes('motivo') || headerLower.includes('reason')) {
        autoMapping[index.toString()] = 'reason';
      } else if (headerLower.includes('local') || headerLower.includes('location')) {
        autoMapping[index.toString()] = 'location';
      }
    });
    return autoMapping;
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    const ext = uploadedFile.name.split('.').pop()?.toLowerCase();
    
    if (source === 'csv' && ext !== 'csv') {
      setErrors(['Por favor, selecione um arquivo CSV']);
      return;
    }

    if (source === 'excel' && !['xlsx', 'xls'].includes(ext || '')) {
      setErrors(['Por favor, selecione um arquivo Excel (.xlsx ou .xls)']);
      return;
    }

    setFile(uploadedFile);
    setErrors([]);

    if (source === 'csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        parseCSVText(text);
      };
      reader.readAsText(uploadedFile);
    } else if (source === 'excel') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Use first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to array of arrays
          const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
          
          if (jsonData.length < 2) {
            setErrors(['O arquivo deve conter pelo menos um cabeçalho e uma linha de dados']);
            return;
          }

          const headers = (jsonData[0] as string[]).map(h => String(h || '').trim());
          const rows = jsonData.slice(1).map(row => 
            (row as string[]).map(cell => String(cell || '').trim())
          ).filter(row => row.some(cell => cell !== ''));

          setCsvHeaders(headers);
          setCsvData(rows);
          setColumnMapping(autoDetectMapping(headers));
          setStep('mapping');
        } catch (err) {
          console.error('Excel parse error:', err);
          setErrors(['Erro ao ler o arquivo Excel. Verifique se o arquivo não está corrompido.']);
        }
      };
      reader.readAsArrayBuffer(uploadedFile);
    }
  }, [source]);

  const parseCSVText = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      setErrors(['O arquivo deve conter pelo menos um cabeçalho e uma linha de dados']);
      return;
    }

    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0]);
    const data = lines.slice(1).map(line => parseCSVLine(line));

    setCsvHeaders(headers);
    setCsvData(data);
    setColumnMapping(autoDetectMapping(headers));
    setStep('mapping');
  };

  const handleGoogleSheetsImport = async () => {
    if (!googleSheetsUrl.trim()) {
      setErrors(['Insira o link da planilha do Google Sheets']);
      return;
    }

    setIsLoadingSheets(true);
    setErrors([]);

    try {
      const { data, error } = await supabase.functions.invoke('google-sheets-import', {
        body: { url: googleSheetsUrl },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const headers = data.headers as string[];
      const rows = (data.data as Record<string, string>[]).map(row => 
        headers.map(h => row[h] || '')
      );

      setCsvHeaders(headers);
      setCsvData(rows);
      setColumnMapping(autoDetectMapping(headers));
      setStep('mapping');
    } catch (err) {
      console.error('Google Sheets error:', err);
      const msg = err instanceof Error ? err.message : 'Erro ao importar Google Sheets';
      setErrors([msg]);
    } finally {
      setIsLoadingSheets(false);
    }
  };

  const handleMappingChange = (columnIndex: string, fieldId: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [columnIndex]: fieldId,
    }));
  };

  const validateMapping = (): boolean => {
    const mappedFields = Object.values(columnMapping);
    if (!mappedFields.includes('date')) {
      setErrors(['A coluna "Data" é obrigatória']);
      return false;
    }
    setErrors([]);
    return true;
  };

  const handleProceedToPreview = () => {
    if (validateMapping()) {
      setStep('preview');
    }
  };

  const getMappedData = (): Record<string, string | number>[] => {
    return csvData.map(row => {
      const mappedRow: Record<string, string | number> = {};
      Object.entries(columnMapping).forEach(([colIndex, fieldId]) => {
        if (fieldId !== 'ignore') {
          const value = row[parseInt(colIndex)] || '';
          const numValue = parseFloat(value);
          mappedRow[fieldId] = isNaN(numValue) ? value : numValue;
        }
      });
      return mappedRow;
    });
  };

  const handleImport = () => {
    const data = getMappedData();
    onImport(data);
    setStep('complete');
  };

  const downloadTemplate = () => {
    const headers = ['Data', 'Operações Agendadas', 'Operações Concluídas', 'Operações Canceladas', 'Motivo', 'Localidade'];
    const sampleData = [
      ['2024-01-15', '50', '45', '5', 'Chuva forte', 'São Paulo'],
      ['2024-01-16', '48', '48', '0', '', 'São Paulo'],
      ['2024-01-17', '52', '40', '12', 'Tempestade', 'São Paulo'],
    ];
    
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_dados_operacionais.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStepProgress = () => {
    switch (step) {
      case 'source': return 10;
      case 'upload': return 30;
      case 'mapping': return 55;
      case 'preview': return 80;
      case 'complete': return 100;
    }
  };

  const sourceLabels: Record<Source, string> = {
    csv: 'CSV',
    excel: 'Excel',
    'google-sheets': 'Google Sheets',
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-primary" />
          Importar Dados Operacionais
        </CardTitle>
        <CardDescription>
          Importe dados do seu sistema para correlacionar com informações climáticas
        </CardDescription>
        <Progress value={getStepProgress()} className="h-2 mt-4" />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span className={cn(step === 'source' && "text-primary font-medium")}>1. Fonte</span>
          <span className={cn(step === 'upload' && "text-primary font-medium")}>2. Dados</span>
          <span className={cn(step === 'mapping' && "text-primary font-medium")}>3. Mapeamento</span>
          <span className={cn(step === 'preview' && "text-primary font-medium")}>4. Preview</span>
          <span className={cn(step === 'complete' && "text-primary font-medium")}>5. Concluído</span>
        </div>
      </CardHeader>

      <CardContent>
        {/* Step 1: Source Selection */}
        {step === 'source' && (
          <div className="space-y-6">
            <p className="text-sm font-medium">Escolha a fonte dos dados:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => { setSource('csv'); setStep('upload'); }}
                className={cn(
                  "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all hover:border-primary/50 hover:bg-secondary/30",
                  "cursor-pointer text-center"
                )}
              >
                <FileSpreadsheet className="w-10 h-10 text-green-600" />
                <div>
                  <p className="font-medium">CSV</p>
                  <p className="text-xs text-muted-foreground">Arquivo .csv</p>
                </div>
              </button>
              
              <button
                onClick={() => { setSource('excel'); setStep('upload'); }}
                className={cn(
                  "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all hover:border-primary/50 hover:bg-secondary/30",
                  "cursor-pointer text-center"
                )}
              >
                <FileSpreadsheet className="w-10 h-10 text-emerald-700" />
                <div>
                  <p className="font-medium">Excel</p>
                  <p className="text-xs text-muted-foreground">.xlsx, .xls</p>
                </div>
              </button>
              
              <button
                onClick={() => { setSource('google-sheets'); setStep('upload'); }}
                className={cn(
                  "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all hover:border-primary/50 hover:bg-secondary/30",
                  "cursor-pointer text-center"
                )}
              >
                <Globe className="w-10 h-10 text-blue-600" />
                <div>
                  <p className="font-medium">Google Sheets</p>
                  <p className="text-xs text-muted-foreground">Link público</p>
                </div>
              </button>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Baixar Template
              </Button>
              <p className="text-sm text-muted-foreground">
                CSV, Excel ou Google Sheets
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Upload / Input */}
        {step === 'upload' && (
          <div className="space-y-6">
            {source === 'google-sheets' ? (
              <div className="space-y-4">
                <p className="text-sm font-medium">Cole o link da planilha do Google Sheets:</p>
                <p className="text-xs text-muted-foreground">
                  A planilha precisa estar compartilhada como "Qualquer pessoa com o link pode visualizar"
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={googleSheetsUrl}
                    onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleGoogleSheetsImport} disabled={isLoadingSheets}>
                    {isLoadingSheets ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Link className="w-4 h-4" />
                    )}
                    <span className="ml-2">Importar</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept={source === 'csv' ? '.csv' : '.xlsx,.xls'}
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="font-medium">
                    Clique para selecionar um arquivo {sourceLabels[source]}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {source === 'csv' ? 'Formato: .csv' : 'Formatos: .xlsx, .xls'}
                  </p>
                </label>
              </div>
            )}

            {errors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                {errors.map((error, i) => (
                  <p key={i} className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </p>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setStep('source')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <p className="text-sm text-muted-foreground">
                Fonte: {sourceLabels[source]}
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Mapping */}
        {step === 'mapping' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {source === 'google-sheets' ? 'Google Sheets' : file?.name} • {csvData.length} linhas
              </span>
              <Badge variant="outline">{sourceLabels[source]}</Badge>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Mapeie as colunas do seu arquivo:</p>
              
              <div className="space-y-2">
                {csvHeaders.map((header, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-secondary/30 rounded-lg">
                    <div className="flex-1">
                      <span className="font-medium text-sm">{header}</span>
                      <p className="text-xs text-muted-foreground">
                        Ex: {csvData[0]?.[index] || '-'}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <Select
                      value={columnMapping[index.toString()] || ''}
                      onValueChange={(value) => handleMappingChange(index.toString(), value)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {standardFields.map((field) => (
                          <SelectItem key={field.id} value={field.id}>
                            {field.label}
                            {field.required && <span className="text-destructive ml-1">*</span>}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {errors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                {errors.map((error, i) => (
                  <p key={i} className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </p>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setStep('upload')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button onClick={handleProceedToPreview}>
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Preview */}
        {step === 'preview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Preview dos dados mapeados:</p>
              <Badge variant="outline">{csvData.length} registros</Badge>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-64 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {standardFields
                        .filter(f => Object.values(columnMapping).includes(f.id) && f.id !== 'ignore')
                        .map((field) => (
                          <TableHead key={field.id}>{field.label}</TableHead>
                        ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getMappedData().slice(0, 5).map((row, i) => (
                      <TableRow key={i}>
                        {standardFields
                          .filter(f => Object.values(columnMapping).includes(f.id) && f.id !== 'ignore')
                          .map((field) => (
                            <TableCell key={field.id}>
                              {row[field.id]?.toString() || '-'}
                            </TableCell>
                          ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {csvData.length > 5 && (
                <div className="p-2 text-center text-sm text-muted-foreground bg-secondary/30">
                  ... e mais {csvData.length - 5} registros
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setStep('mapping')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button onClick={handleImport}>
                <Check className="w-4 h-4 mr-2" />
                Importar Dados
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Complete */}
        {step === 'complete' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Importação Concluída!</h3>
            <p className="text-muted-foreground mb-6">
              {csvData.length} registros foram importados com sucesso via {sourceLabels[source]}
            </p>
            <Button onClick={onClose}>
              Fechar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
