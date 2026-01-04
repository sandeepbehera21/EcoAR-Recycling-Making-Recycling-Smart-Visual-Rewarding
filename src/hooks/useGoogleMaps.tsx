import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useGoogleMapsApiKey = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-maps-key');
        
        if (error) {
          console.error('Error fetching Maps API key:', error);
          setError('Failed to load map');
          return;
        }
        
        if (data?.apiKey) {
          setApiKey(data.apiKey);
        } else {
          setError('API key not available');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load map');
      } finally {
        setLoading(false);
      }
    };

    fetchApiKey();
  }, []);

  return { apiKey, loading, error };
};
