type Props = { data: unknown };

function serialize(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires raw JSON inside a script tag; input escapes < to block </script> injection.
      dangerouslySetInnerHTML={{ __html: serialize(data) }}
    />
  );
}
