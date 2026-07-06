export type SharePlatform =
  | 'whatsapp'
  | 'facebook'
  | 'twitter'
  | 'telegram'
  | 'linkedin'
  | 'email'
  | 'reddit';

export type ShareLink = {
  id: SharePlatform;
  label: string;
  href: string;
  color: string;
};

export function buildShareLinks(url: string, title: string): ShareLink[] {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const text = encodeURIComponent(`${title} - ${url}`);

  return [
    { id: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/?text=${text}`, color: '#25D366' },
    { id: 'facebook', label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, color: '#1877F2' },
    { id: 'twitter', label: 'X', href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`, color: '#000000' },
    { id: 'telegram', label: 'Telegram', href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`, color: '#0088cc' },
    { id: 'linkedin', label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, color: '#0A66C2' },
    { id: 'reddit', label: 'Reddit', href: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`, color: '#FF4500' },
    { id: 'email', label: 'Email', href: `mailto:?subject=${encodedTitle}&body=${text}`, color: '#6B7280' },
  ];
}
