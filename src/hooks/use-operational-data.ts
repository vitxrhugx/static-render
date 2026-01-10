import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { OperationalData } from '@/types/organization';
import type { Json } from '@/integrations/supabase/types';

function transformOperationalData(row: {
  id: string;
  organization_id: string;
  location_id: string | null;
  date: string;
  scheduled_operations: number;
  completed_operations: number;
  cancelled_operations: number;
  cancellation_reason: string | null;
  weather_impact: boolean | null;
  custom_data: Json;
  created_at: string;
}): OperationalData {
  return {
    id: row.id,
    organizationId: row.organization_id,
    locationId: row.location_id || '',
    date: new Date(row.date),
    scheduledOperations: row.scheduled_operations,
    completedOperations: row.completed_operations,
    cancelledOperations: row.cancelled_operations,
    cancellationReason: row.cancellation_reason || undefined,
    weatherImpact: row.weather_impact || undefined,
    customData: (row.custom_data as Record<string, string | number | boolean | Date>) || {},
  };
}

export function useOperationalData(organizationId: string | undefined) {
  const [data, setData] = useState<OperationalData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch operational data
  const fetchData = useCallback(async (
    startDate?: Date,
    endDate?: Date,
    locationId?: string
  ) => {
    if (!organizationId) return;

    try {
      setIsLoading(true);

      let query = supabase
        .from('operational_data')
        .select('*')
        .eq('organization_id', organizationId)
        .order('date', { ascending: false });

      if (startDate) {
        query = query.gte('date', startDate.toISOString().split('T')[0]);
      }
      if (endDate) {
        query = query.lte('date', endDate.toISOString().split('T')[0]);
      }
      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data: rows, error } = await query;

      if (error) throw error;

      setData((rows || []).map(row => transformOperationalData(row)));
    } catch (err) {
      console.error('Error fetching operational data:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados operacionais.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, toast]);

  // Import batch data (from CSV)
  const importBatch = useCallback(async (
    records: Omit<OperationalData, 'id' | 'organizationId'>[]
  ): Promise<boolean> => {
    if (!organizationId) return false;

    try {
      setIsLoading(true);

      const rows = records.map(record => ({
        organization_id: organizationId,
        location_id: record.locationId || null,
        date: record.date instanceof Date 
          ? record.date.toISOString().split('T')[0] 
          : record.date,
        scheduled_operations: record.scheduledOperations,
        completed_operations: record.completedOperations,
        cancelled_operations: record.cancelledOperations,
        cancellation_reason: record.cancellationReason || null,
        weather_impact: record.weatherImpact || false,
        custom_data: (record.customData || {}) as unknown as Json,
      }));

      const { error } = await supabase
        .from('operational_data')
        .insert(rows);

      if (error) throw error;

      toast({
        title: 'Dados importados',
        description: `${records.length} registros foram importados com sucesso.`,
      });

      await fetchData();
      return true;
    } catch (err) {
      console.error('Error importing data:', err);
      toast({
        title: 'Erro na importação',
        description: 'Não foi possível importar os dados.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, fetchData, toast]);

  // Add single record
  const addRecord = useCallback(async (
    record: Omit<OperationalData, 'id' | 'organizationId'>
  ): Promise<OperationalData | null> => {
    if (!organizationId) return null;

    try {
      const { data, error } = await supabase
        .from('operational_data')
        .insert({
          organization_id: organizationId,
          location_id: record.locationId || null,
          date: record.date instanceof Date 
            ? record.date.toISOString().split('T')[0] 
            : record.date,
          scheduled_operations: record.scheduledOperations,
          completed_operations: record.completedOperations,
          cancelled_operations: record.cancelledOperations,
          cancellation_reason: record.cancellationReason || null,
          weather_impact: record.weatherImpact || false,
          custom_data: (record.customData || {}) as unknown as Json,
        })
        .select()
        .single();

      if (error) throw error;

      const newRecord = transformOperationalData(data);
      setData(prev => [newRecord, ...prev]);

      return newRecord;
    } catch (err) {
      console.error('Error adding record:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o registro.',
        variant: 'destructive',
      });
      return null;
    }
  }, [organizationId, toast]);

  // Delete record
  const deleteRecord = useCallback(async (recordId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('operational_data')
        .delete()
        .eq('id', recordId);

      if (error) throw error;

      setData(prev => prev.filter(r => r.id !== recordId));
      return true;
    } catch (err) {
      console.error('Error deleting record:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o registro.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  return {
    data,
    isLoading,
    fetchData,
    importBatch,
    addRecord,
    deleteRecord,
  };
}
