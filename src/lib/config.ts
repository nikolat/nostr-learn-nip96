import type { WindowNostr } from 'nostr-tools/nip07';

export const linkGitHub = 'https://github.com/nikolat/nostr-learn-nip96';

export const uploaderURLs = [
	'https://yabu.me',
	'https://nostpic.com',
	'https://nostr.build',
	'https://nostrcheck.me',
	'https://void.cat',
	'https://files.sovbit.host',
];

declare global {
	interface Window {
		nostr?: WindowNostr;
	}
}
