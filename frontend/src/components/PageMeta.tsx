import { useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'Česká stopa';
const DEFAULT_TITLE = 'Česká stopa — Dárcovská platforma Nadačního fondu';
const DEFAULT_DESC = 'Podpořte vojenské jednotky působící na Ukrajině. Vyberte symbolický dárek, darujte a obdržíte darovací smlouvu.';

function siteUrl() {
  return typeof window !== 'undefined' ? window.location.origin : 'https://darek.fondceskestopy.eu';
}

interface Props {
  title?: string;
  description?: string;
  image?: string;
  path?: string;
  noindex?: boolean;
  type?: 'website' | 'article' | 'product';
}

export default function PageMeta({ title, description, image, path, noindex = false, type = 'website' }: Props) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const desc = description || DEFAULT_DESC;
  const img = image || `${siteUrl()}/og-image.jpg`;
  const canonical = path ? `${siteUrl()}${path}` : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      {canonical && <link rel="canonical" href={canonical} />}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={img} />
      <meta property="og:type" content={type} />
      {canonical && <meta property="og:url" content={canonical} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />
    </Helmet>
  );
}

export function JsonLd({ data }: { data: object }) {
  const ref = useRef<HTMLScriptElement | null>(null);
  const serialized = JSON.stringify(data);
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = serialized;
    document.head.appendChild(script);
    ref.current = script;
    return () => {
      if (ref.current && document.head.contains(ref.current)) {
        document.head.removeChild(ref.current);
        ref.current = null;
      }
    };
  }, [serialized]);
  return null;
}
