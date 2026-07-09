import React from 'react';

type Segment =
  | { kind: 'text'; value: string }
  | { kind: 'bold'; value: string }
  | { kind: 'link'; href: string; label: string };

const TOKEN_RE = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
const LINK_RE = /^\[([^\]]+)\]\(([^)]+)\)$/;
const BOLD_RE = /^\*\*([^*]+)\*\*$/;

export function parseInlineSegments(text: string): Segment[] {
  const parts = text.split(TOKEN_RE).filter(Boolean);
  const segments: Segment[] = [];

  for (const part of parts) {
    const boldMatch = part.match(BOLD_RE);
    if (boldMatch) {
      segments.push({ kind: 'bold', value: boldMatch[1] });
      continue;
    }

    const linkMatch = part.match(LINK_RE);
    if (linkMatch) {
      segments.push({ kind: 'link', href: linkMatch[2], label: linkMatch[1] });
      continue;
    }

    segments.push({ kind: 'text', value: part });
  }

  return segments;
}

type WebLinkProps = {
  href: string;
  children: React.ReactNode;
};

type RenderWebOptions = {
  Link: React.ComponentType<WebLinkProps>;
};

export function renderInlineWeb(text: string, { Link }: RenderWebOptions): React.ReactNode[] {
  return parseInlineSegments(text).map((segment, index) => {
    if (segment.kind === 'text') return <React.Fragment key={index}>{segment.value}</React.Fragment>;
    if (segment.kind === 'bold') return <strong key={index}>{segment.value}</strong>;
  const href = segment.href.startsWith('mailto:') ? segment.href : segment.href;
    return (
      <Link key={index} href={href}>
        {segment.label}
      </Link>
    );
  });
}

type RenderNativeOptions = {
  onLinkPress: (href: string) => void;
  Text: React.ComponentType<{ style?: object; children: React.ReactNode }>;
  Bold: React.ComponentType<{ children: React.ReactNode }>;
  LinkText: React.ComponentType<{ onPress: () => void; children: React.ReactNode }>;
};

export function renderInlineNative(text: string, options: RenderNativeOptions): React.ReactNode[] {
  const { onLinkPress, Text, Bold, LinkText } = options;
  return parseInlineSegments(text).map((segment, index) => {
    if (segment.kind === 'text') return <Text key={index}>{segment.value}</Text>;
    if (segment.kind === 'bold') return <Bold key={index}>{segment.value}</Bold>;
    return (
      <LinkText key={index} onPress={() => onLinkPress(segment.href)}>
        {segment.label}
      </LinkText>
    );
  });
}
