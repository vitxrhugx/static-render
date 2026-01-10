import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { 
  Organization, 
  OrganizationLocation, 
  OrganizationConfig,
  OrganizationSector,
} from '@/types/organization';
import type { Json } from '@/integrations/supabase/types';

// Transform database row to Organization type
function transformOrganization(
  row: { 
    id: string; 
    user_id: string; 
    name: string; 
    cnpj: string | null; 
    sector: string; 
    logo: string | null; 
    config: Json; 
    created_at: string; 
    updated_at: string; 
  }, 
  locations: OrganizationLocation[]
): Organization {
  const config = row.config as unknown as OrganizationConfig;
  return {
    id: row.id,
    name: row.name,
    cnpj: row.cnpj || undefined,
    sector: row.sector as OrganizationSector,
    logo: row.logo || undefined,
    config,
    locations,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// Transform database row to OrganizationLocation type
function transformLocation(row: {
  id: string;
  organization_id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  type: string;
  active: boolean;
  created_at: string;
}): OrganizationLocation {
  return {
    id: row.id,
    name: row.name,
    address: row.address || undefined,
    latitude: row.latitude,
    longitude: row.longitude,
    type: row.type as 'headquarters' | 'branch' | 'operation_point',
    active: row.active,
    createdAt: new Date(row.created_at),
  };
}

export function useOrganization() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch organization data
  const fetchOrganization = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setOrganization(null);
        return;
      }

      // Fetch organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (orgError) throw orgError;

      if (!orgData) {
        setOrganization(null);
        return;
      }

      // Fetch locations
      const { data: locationsData, error: locError } = await supabase
        .from('organization_locations')
        .select('*')
        .eq('organization_id', orgData.id);

      const locations = (locationsData || []).map(transformLocation);
      setOrganization(transformOrganization(orgData, locations));
    } catch (err) {
      console.error('Error fetching organization:', err);
      setError('Erro ao carregar dados da organização');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create organization
  const createOrganization = useCallback(async (
    name: string, 
    sector: OrganizationSector, 
    cnpj?: string
  ): Promise<Organization | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Import sector presets dynamically
      const { sectorPresets } = await import('@/types/organization');
      const preset = sectorPresets[sector];

      const config: OrganizationConfig = {
        ...preset,
        customFields: [],
      };

      const { data, error } = await supabase
        .from('organizations')
        .insert({
          user_id: user.id,
          name,
          cnpj: cnpj || null,
          sector,
          config: config as unknown as Json,
        })
        .select()
        .single();

      if (error) throw error;

      const org = transformOrganization(data, []);
      setOrganization(org);
      
      toast({
        title: 'Organização criada',
        description: 'Sua organização foi criada com sucesso.',
      });

      return org;
    } catch (err) {
      console.error('Error creating organization:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a organização.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  // Update organization
  const updateOrganization = useCallback(async (
    updates: Partial<Pick<Organization, 'name' | 'cnpj' | 'sector' | 'config'>>
  ): Promise<boolean> => {
    if (!organization) return false;

    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: updates.name,
          cnpj: updates.cnpj || null,
          sector: updates.sector,
          config: updates.config as unknown as Json,
        })
        .eq('id', organization.id);

      if (error) throw error;

      await fetchOrganization();
      
      toast({
        title: 'Alterações salvas',
        description: 'As configurações foram atualizadas.',
      });

      return true;
    } catch (err) {
      console.error('Error updating organization:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as alterações.',
        variant: 'destructive',
      });
      return false;
    }
  }, [organization, fetchOrganization, toast]);

  // Add location
  const addLocation = useCallback(async (
    location: Omit<OrganizationLocation, 'id' | 'createdAt'>
  ): Promise<OrganizationLocation | null> => {
    if (!organization) return null;

    try {
      const { data, error } = await supabase
        .from('organization_locations')
        .insert({
          organization_id: organization.id,
          name: location.name,
          address: location.address || null,
          latitude: location.latitude,
          longitude: location.longitude,
          type: location.type,
          active: location.active,
        })
        .select()
        .single();

      if (error) throw error;

      const newLocation = transformLocation(data);
      setOrganization(prev => prev ? {
        ...prev,
        locations: [...prev.locations, newLocation],
      } : null);

      toast({
        title: 'Localidade adicionada',
        description: `${location.name} foi adicionada com sucesso.`,
      });

      return newLocation;
    } catch (err) {
      console.error('Error adding location:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar a localidade.',
        variant: 'destructive',
      });
      return null;
    }
  }, [organization, toast]);

  // Update location
  const updateLocation = useCallback(async (
    locationId: string,
    updates: Partial<Omit<OrganizationLocation, 'id' | 'createdAt'>>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('organization_locations')
        .update({
          name: updates.name,
          address: updates.address || null,
          latitude: updates.latitude,
          longitude: updates.longitude,
          type: updates.type,
          active: updates.active,
        })
        .eq('id', locationId);

      if (error) throw error;

      await fetchOrganization();
      return true;
    } catch (err) {
      console.error('Error updating location:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a localidade.',
        variant: 'destructive',
      });
      return false;
    }
  }, [fetchOrganization, toast]);

  // Delete location
  const deleteLocation = useCallback(async (locationId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('organization_locations')
        .delete()
        .eq('id', locationId);

      if (error) throw error;

      setOrganization(prev => prev ? {
        ...prev,
        locations: prev.locations.filter(l => l.id !== locationId),
      } : null);

      toast({
        title: 'Localidade removida',
        description: 'A localidade foi removida com sucesso.',
      });

      return true;
    } catch (err) {
      console.error('Error deleting location:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a localidade.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  // Initialize
  useEffect(() => {
    fetchOrganization();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchOrganization();
    });

    return () => subscription.unsubscribe();
  }, [fetchOrganization]);

  return {
    organization,
    isLoading,
    error,
    refetch: fetchOrganization,
    createOrganization,
    updateOrganization,
    addLocation,
    updateLocation,
    deleteLocation,
  };
}
