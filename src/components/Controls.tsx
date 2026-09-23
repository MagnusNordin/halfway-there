import React from 'react';

interface DestinationInputProps {
  label: string;
  point: { latitude: number; longitude: number } | null;
  setPoint: (p: { latitude: number; longitude: number }) => void;
}

export function DestinationInput({ label, point, setPoint }: DestinationInputProps) {
  const [query, setQuery] = useState<string>('');
  const [options, setOptions] = useState<{ name: string; coordinates: [number, number] }[]>([]);
  const [loading, setLoading] = useState(false);

  const token = import.meta.env.VITE_MAPBOX_TOKEN;

  const fetchSuggestions = debounce((q: string) => {
    if (!token || q.length < 3) return;
    setLoading(true);
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${token}&autocomplete=true&limit=5`)
      .then(r => r.json())
      .then(json => {
        const coords = json.features?.map((f: any) => ({ name: f.place_name, coordinates: f.center })) || [];
        setOptions(coords);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, 300);

  useEffect(() => {
    if (query) fetchSuggestions(query);
  }, [query]);

  return (
    <div className="flex flex-col relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type="text"
        className="border border-gray-300 rounded-md p-2 w-full"
        placeholder="Search location"
        value={query}
        onChange={e => {
          setQuery(e.target.value);
          if (!e.target.value) {
            setOptions([]);
            setPoint(null as any);
          }
        }}
      />
      {loading && <div className="text-xs text-gray-500 mt-1">Loading...</div>}
      {options.length > 0 && (
        <ul className="absolute z-10 bg-white border border-gray-300 rounded-md w-full mt-1 max-h-40 overflow-y-auto">
          {options.map((opt, idx) => (
            <li key={idx} className="p-2 hover:bg-gray-200 cursor-pointer" onClick={() => {
              setQuery(opt.name);
              setOptions([]);
              setPoint({ latitude: opt.coordinates[1], longitude: opt.coordinates[0] });
            }}>{opt.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export interface ModeSelectorProps {
  mode: string;
  setMode: (m: string) => void;
}

export function ModeSelector({ mode, setMode }: ModeSelectorProps) {
  return (
    <div className="flex items-center space-x-4">
      {['Driving', 'Cycling', 'Walking'].map(m => (
        <label key={m} className="inline-flex items-center">
          <input
            type="radio"
            name="mode"
            value={m.toLowerCase()}
            checked={mode === m.toLowerCase()}
            onChange={() => setMode(m.toLowerCase())}
            className="form-radio"
          />
          <span className="ml-2">{m}</span>
        </label>
      ))}
    </div>
  );
}

export interface CalculationTypeSelectorProps {
  type: string;
  setType: (t: string) => void;
}
export function CalculationTypeSelector({ type, setType }: CalculationTypeSelectorProps) {
  return (
    <div className="flex items-center space-x-4">
      {['Distance', 'Time'].map(t => (
        <label key={t} className="inline-flex items-center">
          <input
            type="radio"
            name="calcType"
            value={t.toLowerCase()}
            checked={type === t.toLowerCase()}
            onChange={() => setType(t.toLowerCase())}
            className="form-radio"
          />
          <span className="ml-2">{t}</span>
        </label>
      ))}
    </div>
  );
}

export interface ControlsProps {
  start: { latitude: number; longitude: number } | null;
  setStart: (p: { latitude: number; longitude: number }) => void;
  end: { latitude: number; longitude: number } | null;
  setEnd: (p: { latitude: number; longitude: number }) => void;
  mode: string;
  setMode: (m: string) => void;
  calcType: string;
  setCalcType: (t: string) => void;
}

export function Controls({
  start,
  setStart,
  end,
  setEnd,
  mode,
  setMode,
  calcType,
  setCalcType,
}: ControlsProps) {
  return (
    <div className="p-4 bg-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
      <DestinationInput label="Start location" point={start} setPoint={setStart} />
      <DestinationInput label="End location" point={end} setPoint={setEnd} />
      <ModeSelector mode={mode} setMode={setMode} />
      <CalculationTypeSelector type={calcType} setType={setCalcType} />
    </div>
  );
}
