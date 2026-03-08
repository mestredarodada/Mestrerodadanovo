import { trpc } from '@/lib/trpc';
import { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(status: string) {
  if (status === 'IN_PLAY' || status === 'PAUSED') return 'text-red-400';
  if (status === 'FINISHED') return 'text-slate-400';
  return 'text-emerald-400';
}

function statusLabel(status: string, utcDate: string) {
  if (status === 'IN_PLAY') return '🔴 AO VIVO';
  if (status === 'PAUSED') return '⏸ INTERVALO';
  if (status === 'FINISHED') return 'FIM';
  try {
    return format(new Date(utcDate), "dd/MM HH:mm", { locale: ptBR });
  } catch {
    return '--';
  }
}

// ─── Card individual do ticker ────────────────────────────────────────────────

function TickerCard({ match }: { match: any }) {
  const isLive = match.status === 'IN_PLAY' || match.status === 'PAUSED';
  const isFinished = match.status === 'FINISHED';
  const hasScore = match.score?.fullTime?.home != null;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border shrink-0 transition-all
      ${isLive
        ? 'bg-red-500/10 border-red-500/30'
        : isFinished
          ? 'bg-slate-800/60 border-white/10'
          : 'bg-slate-800/40 border-white/8'
      }`}
    >
      {/* Time casa */}
      <div className="flex items-center gap-1.5">
        {match.homeTeam?.crest && (
          <img src={match.homeTeam.crest} alt={match.homeTeam.shortName || match.homeTeam.name} className="w-4 h-4 object-contain" />
        )}
        <span className="text-[11px] font-semibold text-slate-200 whitespace-nowrap max-w-[70px] truncate">
          {match.homeTeam?.shortName || match.homeTeam?.name || '?'}
        </span>
      </div>

      {/* Placar ou horário */}
      <div className="flex flex-col items-center min-w-[44px]">
        {hasScore ? (
          <span className={`text-[12px] font-black tabular-nums ${isLive ? 'text-red-300' : 'text-white'}`}>
            {match.score.fullTime.home} - {match.score.fullTime.away}
          </span>
        ) : (
          <span className="text-[10px] font-bold text-slate-400">vs</span>
        )}
        <span className={`text-[9px] font-bold uppercase tracking-wide ${statusColor(match.status)}`}>
          {statusLabel(match.status, match.utcDate)}
        </span>
      </div>

      {/* Time visitante */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-semibold text-slate-200 whitespace-nowrap max-w-[70px] truncate">
          {match.awayTeam?.shortName || match.awayTeam?.name || '?'}
        </span>
        {match.awayTeam?.crest && (
          <img src={match.awayTeam.crest} alt={match.awayTeam.shortName || match.awayTeam.name} className="w-4 h-4 object-contain" />
        )}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function MatchTicker() {
  const { data: upcoming } = trpc.football.matches.useQuery({ status: 'SCHEDULED' }, {
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
  const { data: recent } = trpc.football.matches.useQuery({ status: 'FINISHED' }, {
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
  const { data: live } = trpc.football.live.useQuery(undefined, {
    refetchInterval: 30 * 1000,
    staleTime: 15 * 1000,
  });

  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const posRef = useRef(0);

  // Combina: ao vivo primeiro, depois recentes, depois próximos
  const allMatches = [
    ...(live ?? []),
    ...(recent ?? []).slice(0, 5),
    ...(upcoming ?? []).slice(0, 8),
  ];

  useEffect(() => {
    const track = trackRef.current;
    if (!track || allMatches.length === 0) return;

    const speed = 0.5; // px por frame

    const animate = () => {
      posRef.current -= speed;
      const halfWidth = track.scrollWidth / 2;
      if (Math.abs(posRef.current) >= halfWidth) {
        posRef.current = 0;
      }
      track.style.transform = `translateX(${posRef.current}px)`;
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [allMatches.length]);

  const pauseAnim = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
  };

  const resumeAnim = () => {
    const track = trackRef.current;
    if (!track) return;
    const speed = 0.5;
    const animate = () => {
      posRef.current -= speed;
      const halfWidth = track.scrollWidth / 2;
      if (Math.abs(posRef.current) >= halfWidth) {
        posRef.current = 0;
      }
      track.style.transform = `translateX(${posRef.current}px)`;
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
  };

  if (!allMatches.length) return null;

  // Duplica os cards para loop infinito
  const doubled = [...allMatches, ...allMatches];

  return (
    <div
      className="w-full overflow-hidden bg-[#0a1120] border-b border-white/8 py-2 px-0 relative"
      onMouseEnter={pauseAnim}
      onMouseLeave={resumeAnim}
      onTouchStart={pauseAnim}
      onTouchEnd={resumeAnim}
    >
      {/* Label lateral */}
      <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center px-3 bg-gradient-to-r from-[#0a1120] via-[#0a1120] to-transparent pr-6">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
          ⚽ Brasileirão
        </span>
      </div>

      {/* Fade direita */}
      <div className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-l from-[#0a1120] to-transparent pointer-events-none" />

      {/* Track animado */}
      <div className="pl-24">
        <div
          ref={trackRef}
          className="flex gap-2 will-change-transform"
          style={{ width: 'max-content' }}
        >
          {doubled.map((match, i) => (
            <TickerCard key={`${match.id}-${i}`} match={match} />
          ))}
        </div>
      </div>
    </div>
  );
}
