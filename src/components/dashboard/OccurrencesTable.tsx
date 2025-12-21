import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  FileText, 
  Filter, 
  MoreHorizontal, 
  ArrowUpDown, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Eye,
  Download,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Occurrence {
  id: string;
  date: string;
  region: string;
  state: string;
  cancellations: number;
  precipitation: number;
  windSpeed: number;
  temperature: number;
  validation: number;
  status: "validated" | "partial" | "rejected";
  impactType: "rain" | "wind" | "temperature" | "mixed";
}

// Demo data based on document specs
const demoOccurrences: Occurrence[] = [
  {
    id: "occ-001",
    date: "2024-12-17",
    region: "São Paulo Centro",
    state: "SP",
    cancellations: 23,
    precipitation: 18.4,
    windSpeed: 28,
    temperature: 21,
    validation: 0.78,
    status: "validated",
    impactType: "rain",
  },
  {
    id: "occ-002",
    date: "2024-12-16",
    region: "Rio de Janeiro Sul",
    state: "RJ",
    cancellations: 15,
    precipitation: 12.2,
    windSpeed: 22,
    temperature: 26,
    validation: 0.67,
    status: "validated",
    impactType: "rain",
  },
  {
    id: "occ-003",
    date: "2024-12-15",
    region: "Belo Horizonte",
    state: "MG",
    cancellations: 8,
    precipitation: 2.1,
    windSpeed: 12,
    temperature: 24,
    validation: 0.25,
    status: "rejected",
    impactType: "mixed",
  },
  {
    id: "occ-004",
    date: "2024-12-14",
    region: "Porto Alegre",
    state: "RS",
    cancellations: 12,
    precipitation: 15.3,
    windSpeed: 42,
    temperature: 16,
    validation: 0.72,
    status: "validated",
    impactType: "wind",
  },
  {
    id: "occ-005",
    date: "2024-12-13",
    region: "Fortaleza",
    state: "CE",
    cancellations: 18,
    precipitation: 22.1,
    windSpeed: 38,
    temperature: 28,
    validation: 0.82,
    status: "validated",
    impactType: "rain",
  },
  {
    id: "occ-006",
    date: "2024-12-12",
    region: "Salvador",
    state: "BA",
    cancellations: 6,
    precipitation: 5.5,
    windSpeed: 15,
    temperature: 30,
    validation: 0.45,
    status: "partial",
    impactType: "mixed",
  },
  {
    id: "occ-007",
    date: "2024-12-11",
    region: "Curitiba",
    state: "PR",
    cancellations: 4,
    precipitation: 1.2,
    windSpeed: 10,
    temperature: 18,
    validation: 0.15,
    status: "rejected",
    impactType: "temperature",
  },
  {
    id: "occ-008",
    date: "2024-12-10",
    region: "Brasília",
    state: "DF",
    cancellations: 9,
    precipitation: 8.8,
    windSpeed: 25,
    temperature: 27,
    validation: 0.58,
    status: "partial",
    impactType: "rain",
  },
];

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
};

const getStatusIcon = (status: Occurrence["status"]) => {
  switch (status) {
    case "validated":
      return <CheckCircle2 className="w-4 h-4 text-success" />;
    case "partial":
      return <AlertCircle className="w-4 h-4 text-warning" />;
    case "rejected":
      return <XCircle className="w-4 h-4 text-destructive" />;
  }
};

const getStatusLabel = (status: Occurrence["status"]) => {
  switch (status) {
    case "validated":
      return "Validado";
    case "partial":
      return "Parcial";
    case "rejected":
      return "Rejeitado";
  }
};

const getImpactTypeLabel = (type: Occurrence["impactType"]) => {
  switch (type) {
    case "rain":
      return "Chuva";
    case "wind":
      return "Vento";
    case "temperature":
      return "Temperatura";
    case "mixed":
      return "Misto";
  }
};

const getValidationColor = (validation: number) => {
  if (validation >= 0.7) return "text-success";
  if (validation >= 0.4) return "text-warning";
  return "text-destructive";
};

type SortField = "date" | "cancellations" | "validation" | "precipitation";
type SortOrder = "asc" | "desc";

export function OccurrencesTable() {
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [impactFilter, setImpactFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const states = useMemo(() => {
    const uniqueStates = [...new Set(demoOccurrences.map((o) => o.state))];
    return uniqueStates.sort();
  }, []);

  const filteredAndSortedData = useMemo(() => {
    let data = [...demoOccurrences];

    // Apply filters
    if (stateFilter !== "all") {
      data = data.filter((o) => o.state === stateFilter);
    }
    if (impactFilter !== "all") {
      data = data.filter((o) => o.impactType === impactFilter);
    }

    // Apply sorting
    data.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "cancellations":
          comparison = a.cancellations - b.cancellations;
          break;
        case "validation":
          comparison = a.validation - b.validation;
          break;
        case "precipitation":
          comparison = a.precipitation - b.precipitation;
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return data;
  }, [stateFilter, impactFilter, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => toggleSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-2 h-3 w-3" />
    </Button>
  );

  // Summary stats
  const totalCancellations = filteredAndSortedData.reduce((sum, o) => sum + o.cancellations, 0);
  const validatedCount = filteredAndSortedData.filter((o) => o.status === "validated").length;
  const avgValidation = filteredAndSortedData.reduce((sum, o) => sum + o.validation, 0) / filteredAndSortedData.length;

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <FileText className="w-5 h-5 text-primary" />
            Ocorrências Validadas
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="w-[100px] h-8">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {states.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={impactFilter} onValueChange={setImpactFilter}>
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue placeholder="Impacto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="rain">Chuva</SelectItem>
                <SelectItem value="wind">Vento</SelectItem>
                <SelectItem value="temperature">Temperatura</SelectItem>
                <SelectItem value="mixed">Misto</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm" className="h-8">
              <Download className="w-4 h-4 mr-1" />
              CSV
            </Button>
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="flex items-center gap-6 mt-4 text-sm">
          <div>
            <span className="text-muted-foreground">Cancelamentos:</span>{" "}
            <span className="font-semibold">{totalCancellations}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Validados:</span>{" "}
            <span className="font-semibold text-success">{validatedCount}/{filteredAndSortedData.length}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Média Validação:</span>{" "}
            <span className={cn("font-semibold", getValidationColor(avgValidation))}>
              {Math.round(avgValidation * 100)}%
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[80px]">
                  <SortableHeader field="date">Data</SortableHeader>
                </TableHead>
                <TableHead>Região</TableHead>
                <TableHead className="w-[60px]">Estado</TableHead>
                <TableHead className="w-[120px]">
                  <SortableHeader field="cancellations">Cancelamentos</SortableHeader>
                </TableHead>
                <TableHead className="w-[100px]">
                  <SortableHeader field="precipitation">Chuva</SortableHeader>
                </TableHead>
                <TableHead className="w-[80px]">Vento</TableHead>
                <TableHead className="w-[100px]">
                  <SortableHeader field="validation">Validação</SortableHeader>
                </TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedData.map((occurrence) => (
                <TableRow 
                  key={occurrence.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="font-medium">
                    {formatDate(occurrence.date)}
                  </TableCell>
                  <TableCell>{occurrence.region}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {occurrence.state}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">{occurrence.cancellations}</TableCell>
                  <TableCell>
                    <span className={cn(
                      occurrence.precipitation > 10 ? "text-primary font-medium" : ""
                    )}>
                      {occurrence.precipitation}mm
                    </span>
                  </TableCell>
                  <TableCell>{occurrence.windSpeed}km/h</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            occurrence.validation >= 0.7
                              ? "bg-success"
                              : occurrence.validation >= 0.4
                              ? "bg-warning"
                              : "bg-destructive"
                          )}
                          style={{ width: `${occurrence.validation * 100}%` }}
                        />
                      </div>
                      <span className={cn("text-sm font-medium", getValidationColor(occurrence.validation))}>
                        {Math.round(occurrence.validation * 100)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {getStatusIcon(occurrence.status)}
                      <span className="text-sm">{getStatusLabel(occurrence.status)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Analisar Correlação
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Exportar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
