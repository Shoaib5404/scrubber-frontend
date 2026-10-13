import type { IcdCmNotes } from '../api';

const NOTE_BLOCKS: Array<{ key: keyof IcdCmNotes; title: string }> = [
  { key: 'include_notes', title: 'Includes' },
  { key: 'notes', title: 'Notes' },
  { key: 'code_first_notes', title: 'Code First' },
  { key: 'additional_code_notes', title: 'Use Additional Code' },
  { key: 'exclude1_notes', title: 'Excludes1' },
  { key: 'exclude2_notes', title: 'Excludes2' },
  { key: 'inclusion_terms', title: 'Inclusion Terms' },
  { key: 'code_also_notes', title: 'Code Also' },
  { key: 'short_descriptions', title: 'Short Description' },
];

export function Icd10CmNotes({ notes }: { notes: IcdCmNotes }) {
  const blocks = NOTE_BLOCKS.filter((b) => (notes[b.key] ?? []).length > 0);
  if (blocks.length === 0) return null;

  return (
    <div className="mt-4 space-y-3">
      {blocks.map((block) => (
        <div key={block.key} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {block.title}
          </h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {(notes[block.key] ?? []).map((line, idx) => (
              <li key={`${block.key}-${idx}`}>{line}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
