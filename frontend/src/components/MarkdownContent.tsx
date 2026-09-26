import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

const YT_RE = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;

function getYouTubeId(url: string): string | null {
  const m = url.match(YT_RE);
  return m ? m[1] : null;
}

type Segment = { type: 'md'; text: string } | { type: 'yt'; id: string };

function parseSegments(content: string): Segment[] {
  const segments: Segment[] = [];
  let mdLines: string[] = [];

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    const ytId = trimmed.startsWith('http') ? getYouTubeId(trimmed) : null;
    if (ytId) {
      if (mdLines.length) { segments.push({ type: 'md', text: mdLines.join('\n') }); mdLines = []; }
      segments.push({ type: 'yt', id: ytId });
    } else {
      mdLines.push(line);
    }
  }
  if (mdLines.join('').trim()) segments.push({ type: 'md', text: mdLines.join('\n') });
  return segments;
}

const mdComponents: Components = {
  a({ href, children }) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand-600 underline hover:text-brand-800">
        {children}
      </a>
    );
  },
  p({ children }) { return <p className="mb-3 last:mb-0">{children}</p>; },
  strong({ children }) { return <strong className="font-semibold">{children}</strong>; },
  ul({ children }) { return <ul className="list-disc pl-5 mb-3 space-y-0.5">{children}</ul>; },
  ol({ children }) { return <ol className="list-decimal pl-5 mb-3 space-y-0.5">{children}</ol>; },
};

export default function MarkdownContent({ content, className }: { content: string; className?: string }) {
  const segments = parseSegments(content);
  return (
    <div className={className}>
      {segments.map((seg, i) =>
        seg.type === 'yt' ? (
          <div key={i} className="relative w-full rounded-xl overflow-hidden bg-black shadow-md my-3" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={`https://www.youtube.com/embed/${seg.id}`}
              title="YouTube video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        ) : (
          <ReactMarkdown key={i} components={mdComponents}>{seg.text}</ReactMarkdown>
        )
      )}
    </div>
  );
}
