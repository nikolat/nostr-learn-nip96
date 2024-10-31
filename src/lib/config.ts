import type { WindowNostr } from 'nostr-tools/nip07';

export const linkGitHub = 'https://github.com/nikolat/nostr-learn-nip96';

export const defaultUploaderURLs = [
  'https://yabu.me',
  'https://nostpic.com',
  'https://nostr.build',
  'https://nostrcheck.me',
  'https://nostr.download',
  'https://files.sovbit.host',
];

export const defaultRelays = [
  'wss://relay-jp.nostr.wirednet.jp/',
  'wss://yabu.me/',
  'wss://nos.lol/',
  'wss://relay.damus.io/',
];

declare global {
  interface Window {
    nostr?: WindowNostr;
  }
}
