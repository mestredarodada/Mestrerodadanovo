import { trpc } from '@/lib/trpc';

interface Team {
  id: number;
  name: string;
  crest?: string;
  shortName?: string;
}

interface Match {
  id: number;
  utcDate: string;
  status: string;
  matchday?: number;
  stage?: string;
  homeTeam: Team;
  awayTeam: Team;
  score: {
    fullTime: {
      home: number | null;
      away: number | null;
    };
    halfTime?: {
      home: number | null;
      away: number | null;
    };
  };
}

interface Standing {
  position: number;
  team: Team;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalDifference: number;
  goalsFor: number;
  goalsAgainst: number;
}

interface ApiResponse<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export const useStandings = (): ApiResponse<Standing[]> => {
  const { data, isLoading, error } = trpc.football.standings.useQuery();

  return {
    data: data || null,
    loading: isLoading,
    error: error?.message || null,
  };
};

export const useMatches = (status: 'SCHEDULED' | 'FINISHED' | 'IN_PLAY' = 'SCHEDULED'): ApiResponse<Match[]> => {
  const { data, isLoading, error } = trpc.football.matches.useQuery({ status });

  return {
    data: data || null,
    loading: isLoading,
    error: error?.message || null,
  };
};
