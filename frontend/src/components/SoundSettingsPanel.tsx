import { useState } from 'react';
import { useGetSoundSettings, useUpdateSoundSettings, useGetAllSoundPresets, useSaveSoundPreset } from '../hooks/useQueries';
import type { SoundSettings, SoundPreset } from '../backend';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Trash2, Download, Music2 } from 'lucide-react';
import { toast } from 'sonner';

interface SoundSettingsPanelProps {
  onPresetLoaded?: (preset: SoundPreset) => void;
  currentOcarinaImage?: string | null;
}

export default function SoundSettingsPanel({ onPresetLoaded, currentOcarinaImage }: SoundSettingsPanelProps) {
  const { data: soundSettings, isLoading } = useGetSoundSettings();
  const updateSoundSettings = useUpdateSoundSettings();
  const { data: presets, isLoading: presetsLoading } = useGetAllSoundPresets();
  const saveSoundPreset = useSaveSoundPreset();

  const [presetName, setPresetName] = useState('');
  const [localSettings, setLocalSettings] = useState<SoundSettings | null>(null);

  const settings = localSettings ?? soundSettings ?? {
    tone: { character: 0.5, warmth: 0.5 },
    reverb: { amount: 0.5, reverbType: 'standard', delay: 0.2, mix: 0.5 },
    pitchOffset: { cents: BigInt(0), semitones: BigInt(0), frequencyRatio: 1.0 },
  };

  const handleToneChange = (key: 'character' | 'warmth', value: number) => {
    const updated: SoundSettings = {
      ...settings,
      tone: { ...settings.tone, [key]: value },
    };
    setLocalSettings(updated);
    updateSoundSettings.mutate(updated);
  };

  const handleReverbChange = (key: keyof SoundSettings['reverb'], value: number | string) => {
    const updated: SoundSettings = {
      ...settings,
      reverb: { ...settings.reverb, [key]: value },
    };
    setLocalSettings(updated);
    updateSoundSettings.mutate(updated);
  };

  const handlePitchChange = (key: 'semitones' | 'cents', value: number) => {
    const semitones = key === 'semitones' ? BigInt(Math.round(value)) : settings.pitchOffset.semitones;
    const cents = key === 'cents' ? BigInt(Math.round(value)) : settings.pitchOffset.cents;
    const frequencyRatio = Math.pow(2, (Number(semitones) + Number(cents) / 100) / 12);
    const updated: SoundSettings = {
      ...settings,
      pitchOffset: { semitones, cents, frequencyRatio },
    };
    setLocalSettings(updated);
    updateSoundSettings.mutate(updated);
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }
    try {
      await saveSoundPreset.mutateAsync({
        name: presetName.trim(),
        ocarinaImage: currentOcarinaImage ?? null,
      });
      toast.success(`Preset "${presetName.trim()}" saved!`);
      setPresetName('');
    } catch {
      toast.error('Failed to save preset');
    }
  };

  const handleLoadPreset = (preset: SoundPreset) => {
    setLocalSettings(preset.soundSettings);
    updateSoundSettings.mutate(preset.soundSettings);
    if (onPresetLoaded) {
      onPresetLoaded(preset);
    }
    toast.success(`Loaded preset "${preset.name}"`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Tone Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Tone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-sm">Character</Label>
              <span className="text-xs text-muted-foreground">{settings.tone.character.toFixed(2)}</span>
            </div>
            <Slider
              min={0} max={1} step={0.01}
              value={[settings.tone.character]}
              onValueChange={([v]) => handleToneChange('character', v)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-sm">Warmth</Label>
              <span className="text-xs text-muted-foreground">{settings.tone.warmth.toFixed(2)}</span>
            </div>
            <Slider
              min={0} max={1} step={0.01}
              value={[settings.tone.warmth]}
              onValueChange={([v]) => handleToneChange('warmth', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reverb Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Reverb
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-sm">Mix</Label>
              <span className="text-xs text-muted-foreground">{settings.reverb.mix.toFixed(2)}</span>
            </div>
            <Slider
              min={0} max={1} step={0.01}
              value={[settings.reverb.mix]}
              onValueChange={([v]) => handleReverbChange('mix', v)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-sm">Amount</Label>
              <span className="text-xs text-muted-foreground">{settings.reverb.amount.toFixed(2)}</span>
            </div>
            <Slider
              min={0} max={1} step={0.01}
              value={[settings.reverb.amount]}
              onValueChange={([v]) => handleReverbChange('amount', v)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-sm">Delay</Label>
              <span className="text-xs text-muted-foreground">{settings.reverb.delay.toFixed(2)}s</span>
            </div>
            <Slider
              min={0} max={1} step={0.01}
              value={[settings.reverb.delay]}
              onValueChange={([v]) => handleReverbChange('delay', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pitch Offset */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Pitch Offset
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-sm">Semitones</Label>
              <span className="text-xs text-muted-foreground">{Number(settings.pitchOffset.semitones)}</span>
            </div>
            <Slider
              min={-12} max={12} step={1}
              value={[Number(settings.pitchOffset.semitones)]}
              onValueChange={([v]) => handlePitchChange('semitones', v)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-sm">Cents</Label>
              <span className="text-xs text-muted-foreground">{Number(settings.pitchOffset.cents)}</span>
            </div>
            <Slider
              min={-100} max={100} step={1}
              value={[Number(settings.pitchOffset.cents)]}
              onValueChange={([v]) => handlePitchChange('cents', v)}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Sound Presets */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Music2 className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Sound Presets</h3>
        </div>

        {/* Save Preset */}
        <div className="flex gap-2">
          <Input
            placeholder="Preset name..."
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
            className="flex-1 text-sm"
          />
          <Button
            size="sm"
            onClick={handleSavePreset}
            disabled={saveSoundPreset.isPending || !presetName.trim()}
            className="gap-1.5 shrink-0"
          >
            {saveSoundPreset.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Save className="w-3 h-3" />
            )}
            Save
          </Button>
        </div>

        {/* Preset List */}
        {presetsLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : presets && presets.length > 0 ? (
          <div className="space-y-2">
            {presets.map((preset) => (
              <div
                key={preset.name}
                className="flex items-center gap-2 p-3 rounded-lg border border-border/60 bg-muted/30 hover:bg-muted/60 transition-colors"
              >
                {preset.ocarinaImage && (
                  <img
                    src={`/assets/generated/${preset.ocarinaImage}`}
                    alt={preset.name}
                    className="w-8 h-8 rounded object-cover shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{preset.name}</p>
                  {preset.ocarinaImage && (
                    <Badge variant="outline" className="text-xs mt-0.5">
                      Has image
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleLoadPreset(preset)}
                    className="h-7 px-2 gap-1 text-xs"
                  >
                    <Download className="w-3 h-3" />
                    Load
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4">
            No saved presets yet. Adjust the settings above and save a preset.
          </p>
        )}
      </div>
    </div>
  );
}
