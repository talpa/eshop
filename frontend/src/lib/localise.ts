type Translatable = {
  name: string;
  nameEn?: string | null;
  nameUk?: string | null;
  nameDe?: string | null;
};

type TranslatableWithDesc = Translatable & {
  description?: string | null;
  descriptionEn?: string | null;
  descriptionUk?: string | null;
  descriptionDe?: string | null;
};

export function localName(item: Translatable, lang: string): string {
  if (lang.startsWith('uk') && item.nameUk) return item.nameUk;
  if (lang.startsWith('en') && item.nameEn) return item.nameEn;
  if (lang.startsWith('de') && item.nameDe) return item.nameDe;
  return item.name;
}

export function localDesc(item: TranslatableWithDesc, lang: string): string | undefined {
  if (lang.startsWith('uk') && item.descriptionUk) return item.descriptionUk;
  if (lang.startsWith('en') && item.descriptionEn) return item.descriptionEn;
  if (lang.startsWith('de') && item.descriptionDe) return item.descriptionDe;
  return item.description || undefined;
}
