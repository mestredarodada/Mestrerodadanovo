import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';

export function usePredictions() {
  return useQuery({
    queryKey: ['predictions'],
    queryFn: async () => {
      try {
        const result = await trpc.football.predictions.query();
        return result;
      } catch (error) {
        console.error('Erro ao buscar palpites:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  });
}
