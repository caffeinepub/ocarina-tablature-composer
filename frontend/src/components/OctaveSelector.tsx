import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useSetCurrentOctave, OCTAVE_RANGES } from '../hooks/useQueries';

interface OctaveSelectorProps {
  value: number;
  onChange: (octave: number) => void;
  label?: string;
  className?: string;
}

export const OctaveSelector: React.FC<OctaveSelectorProps> = ({
  value,
  onChange,
  label = 'Octave',
  className = '',
}) => {
  const setOctave = useSetCurrentOctave();

  const handleChange = (v: string) => {
    const octave = Number(v);
    onChange(octave);
    setOctave.mutate(BigInt(octave));
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && <Label className="text-sm font-ui text-muted-foreground whitespace-nowrap">{label}:</Label>}
      <Select value={String(value)} onValueChange={handleChange}>
        <SelectTrigger className="w-36 font-ui h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OCTAVE_RANGES.map(range => (
            <SelectItem key={range.value} value={String(range.value)} className="font-ui text-sm">
              {range.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default OctaveSelector;
