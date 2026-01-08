import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { 
  Upload, 
  FileSpreadsheet, 
  Check, 
  X, 
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DataImportWizardProps {
  onImport: (data: Record<string, string | number>[]) => void;
  onClose?: () => void;
}

type Step = 'upload' | 'mapping' | 'preview' | 'complete';

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
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<string[]>([]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.endsWith('.csv')) {
      setErrors(['Por favor, selecione um arquivo CSV']);
      return;
    }

    setFile(uploadedFile);
    setErrors([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setErrors(['O arquivo deve conter pelo menos um cabeçalho e uma linha de dados']);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const data = lines.slice(1).map(line => 
        line.split(',').map(cell => cell.trim().replace(/"/g, ''))
      );

      setCsvHeaders(headers);
      setCsvData(data);

      // Auto-detect mapping based on header names
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

      setColumnMapping(autoMapping);
      setStep('mapping');
    };

    reader.readAsText(uploadedFile);
  }, []);

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
          // Try to parse numbers
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
      case 'upload': return 25;
      case 'mapping': return 50;
      case 'preview': return 75;
      case 'complete': return 100;
    }
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
          <span className={cn(step === 'upload' && "text-primary font-medium")}>1. Upload</span>
          <span className={cn(step === 'mapping' && "text-primary font-medium")}>2. Mapeamento</span>
          <span className={cn(step === 'preview' && "text-primary font-medium")}>3. Preview</span>
          <span className={cn(step === 'complete' && "text-primary font-medium")}>4. Concluído</span>
        </div>
      </CardHeader>

      <CardContent>
        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-6">
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="font-medium">Clique para selecionar um arquivo CSV</p>
                <p className="text-sm text-muted-foreground mt-1">
                  ou arraste e solte aqui
                </p>
              </label>
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

            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Baixar Template
              </Button>
              <p className="text-sm text-muted-foreground">
                Formatos suportados: CSV
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Mapping */}
        {step === 'mapping' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {file?.name} • {csvData.length} linhas
              </span>
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

        {/* Step 3: Preview */}
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

        {/* Step 4: Complete */}
        {step === 'complete' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Importação Concluída!</h3>
            <p className="text-muted-foreground mb-6">
              {csvData.length} registros foram importados com sucesso
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
