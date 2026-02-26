import React from 'react';
import { Link } from '@tanstack/react-router';
import { PenLine, Palette, Settings, BookOpen, Music2, Disc } from 'lucide-react';
import OcarinaVisual from '../components/OcarinaVisual';
import { getDefaultFingeringPattern } from '../hooks/useQueries';

const NOTE_DEMO = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

const FEATURES = [
  {
    path: '/song-editor' as const,
    icon: PenLine,
    title: 'Song Editor',
    description: 'Compose music with professional staff notation and ocarina tablature. Add timing, bars, and annotations.',
  },
  {
    path: '/design-editor' as const,
    icon: Palette,
    title: 'Design Editor',
    description: 'Upload your ocarina image and customize hole positions and sizes for accurate tablature.',
  },
  {
    path: '/settings' as const,
    icon: Settings,
    title: 'Settings',
    description: 'Configure fingering patterns for each note, sound settings, reverb, and pitch offset.',
  },
  {
    path: '/library' as const,
    icon: BookOpen,
    title: 'Song Library',
    description: 'Browse and play back all your saved compositions.',
  },
];

const HomePage: React.FC = () => {
  return (
    <div className="min-h-full">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border bg-card/40 px-6 py-12 text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex justify-center mb-4">
            <img
              src="/assets/generated/ocarina-logo.dim_128x128.png"
              alt="Ocarina Composer"
              className="w-20 h-20 object-contain"
            />
          </div>
          <h1 className="font-heading text-4xl font-bold text-foreground">
            Ocarina Tablature Composer
          </h1>
          <p className="font-body text-lg text-muted-foreground">
            Compose, notate, and play music for your ocarina. Professional staff notation
            with integrated tablature — for every octave, every instrument.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Link
              to="/song-editor"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-md font-ui text-sm font-semibold hover:opacity-90 transition-opacity shadow-parchment"
            >
              <PenLine className="w-4 h-4" />
              Start Composing
            </Link>
            <Link
              to="/library"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary text-secondary-foreground rounded-md font-ui text-sm font-semibold hover:opacity-90 transition-opacity border border-border"
            >
              <BookOpen className="w-4 h-4" />
              Song Library
            </Link>
          </div>
        </div>
      </div>

      {/* Fingering preview */}
      <div className="px-6 py-10 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Disc className="w-5 h-5 text-accent-foreground" />
          <h2 className="font-heading text-xl font-semibold text-foreground">Fingering Chart Preview</h2>
        </div>
        <div className="flex flex-wrap gap-4 p-4 parchment-card">
          {NOTE_DEMO.map(note => (
            <div key={note} className="flex flex-col items-center gap-1">
              <OcarinaVisual
                holeStates={getDefaultFingeringPattern(note)}
                size="sm"
              />
              <span className="text-sm font-heading font-semibold text-foreground">{note}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground font-body mt-2">
          Default 4-hole fingering patterns. Customize in Settings → Fingering Configuration.
        </p>
      </div>

      {/* Feature cards */}
      <div className="px-6 pb-10 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Music2 className="w-5 h-5 text-accent-foreground" />
          <h2 className="font-heading text-xl font-semibold text-foreground">Features</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map(({ path, icon: Icon, title, description }) => (
            <Link
              key={path}
              to={path}
              className="group p-5 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-foreground">{title}</h3>
              </div>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">{description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
