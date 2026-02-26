import { useNavigate } from '@tanstack/react-router';
import { useGetAllPresetSongs } from '../hooks/useQueries';
import type { Song } from '../backend';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Music, Play, BookOpen } from 'lucide-react';

const GENRE_CONFIG: Record<string, { label: string; color: string; description: string }> = {
  folk: {
    label: 'Folk',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    description: 'Traditional melodies with a warm, acoustic feel',
  },
  rock: {
    label: 'Rock',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    description: 'Energetic rhythms and powerful chord progressions',
  },
  electronic: {
    label: 'Electronic',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    description: 'Synth-inspired sequences with pulsating patterns',
  },
  reggaeton: {
    label: 'Reggaeton',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    description: 'Vibrant dance rhythms with tropical flair',
  },
  reggae: {
    label: 'Reggae',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    description: 'Classic roots reggae with soulful backbeat emphasis',
  },
};

function getGenreKey(song: Song): string {
  const name = song.name.toLowerCase();
  const desc = song.description.toLowerCase();

  if (desc.includes('reggaeton') || name.includes('reggaeton')) return 'reggaeton';
  if (
    desc.includes('reggae') ||
    name.includes('reggae') ||
    desc.includes('roots') ||
    desc.includes('bob marley') ||
    name.includes('positive vibration') ||
    name.includes('roots melody')
  ) return 'reggae';
  if (
    desc.includes('folk') ||
    name.includes('folk') ||
    name.includes('meadow') ||
    name.includes('mountain') ||
    name.includes('wind') ||
    name.includes('sunrise waltz') ||
    name.includes('strolling') ||
    name.includes('streams') ||
    name.includes('pines')
  ) return 'folk';
  if (
    desc.includes('rock') ||
    name.includes('rock') ||
    name.includes('guitar') ||
    name.includes('electric') ||
    name.includes('power') ||
    name.includes('ballad') ||
    name.includes('drive') ||
    name.includes('groove')
  ) return 'rock';
  if (
    desc.includes('electronic') ||
    name.includes('electronic') ||
    name.includes('synth') ||
    name.includes('laser') ||
    name.includes('digital') ||
    name.includes('wave') ||
    name.includes('space')
  ) return 'electronic';

  return 'folk';
}

function SongCard({ song, genre }: { song: Song; genre: string }) {
  const navigate = useNavigate();
  const genreConfig = GENRE_CONFIG[genre] || GENRE_CONFIG.folk;

  const handleLoad = () => {
    // Use history state via the navigate function's state option
    navigate({
      to: '/song-editor',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    // Push state separately to avoid type issues with TanStack Router's strict state typing
    window.history.replaceState({ presetSong: song }, '');
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-border/60 hover:border-primary/40">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Music className="w-4 h-4 text-primary" />
            </div>
            <CardTitle className="text-base leading-tight">{song.name}</CardTitle>
          </div>
          <Badge className={`text-xs shrink-0 ${genreConfig.color}`} variant="outline">
            {genreConfig.label}
          </Badge>
        </div>
        <CardDescription className="text-sm leading-relaxed mt-1">
          {song.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {song.notes.length} notes
            </span>
            <span>{Number(song.bars)} bars</span>
          </div>
          <Button
            size="sm"
            onClick={handleLoad}
            className="gap-1.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
            variant="outline"
          >
            <Play className="w-3 h-3" />
            Load into Editor
          </Button>
        </div>
        {song.annotations && (
          <p className="mt-2 text-xs text-muted-foreground/70 italic line-clamp-2">
            {song.annotations}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function GenreSection({ genre, songs }: { genre: string; songs: Song[] }) {
  const config = GENRE_CONFIG[genre];
  if (!config || songs.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-foreground">{config.label}</h2>
        <div className="h-px flex-1 bg-border" />
        <span className="text-sm text-muted-foreground">{songs.length} songs</span>
      </div>
      <p className="text-sm text-muted-foreground -mt-2">{config.description}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {songs.map((song) => (
          <SongCard key={song.name} song={song} genre={genre} />
        ))}
      </div>
    </section>
  );
}

export default function PresetSongsPage() {
  const { data: presetSongs, isLoading, error } = useGetAllPresetSongs();

  const grouped = (presetSongs ?? []).reduce<Record<string, Song[]>>((acc, song) => {
    const genre = getGenreKey(song);
    if (!acc[genre]) acc[genre] = [];
    acc[genre].push(song);
    return acc;
  }, {});

  const genreOrder = ['folk', 'rock', 'electronic', 'reggaeton', 'reggae'];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Preset Songs</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Explore curated melodies across genres, all arranged for the 4-hole ocarina. Load any
            song into the editor to play or customize it.
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-7 w-32" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((j) => (
                    <Skeleton key={j} className="h-40 rounded-xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-12 text-destructive">
            <p>Failed to load preset songs. Please try again.</p>
          </div>
        )}

        {/* Genre Sections */}
        {!isLoading && !error && (
          <div className="space-y-10">
            {genreOrder.map((genre) =>
              grouped[genre] ? (
                <GenreSection key={genre} genre={genre} songs={grouped[genre]} />
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  );
}
