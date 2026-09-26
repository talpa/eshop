import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

const components: Components = {
  p({ children }) {
    const text = typeof children === 'string' ? children : (Array.isArray(children) && children.length === 1 && typeof children[0] === 'string' ? children[0] : null);
    if (text) {
      const ytId = getYouTubeId(text.trim());
      if (ytId) {
        return (
          <div className="relative w-full rounded-xl overflow-hidden bg-black shadow-md my-3" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={`https://www.youtube.com/embed/${ytId}`}
              title="YouTube video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        );
      }
    }
    return <p className="mb-3 last:mb-0">{children}</p>;
  },
  a({ href, children }) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand-600 underline hover:text-brand-800">
        {children}
      </a>
    );
  },
  strong({ children }) {
    return <strong className="font-semibold">{children}</strong>;
  },
  ul({ children }) {
    return <ul className="list-disc pl-5 mb-3 space-y-0.5">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="list-decimal pl-5 mb-3 space-y-0.5">{children}</ol>;
  },
};

export default function MarkdownContent({ content, className }: { content: string; className?: string }) {
  return (
    <div className={className}>
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}
