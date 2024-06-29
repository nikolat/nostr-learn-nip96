import type { WindowNostr } from 'nostr-tools/nip07';

export const linkGitHub = 'https://github.com/nikolat/nostr-learn-nip96';

declare global {
	interface Window {
		nostr?: WindowNostr;
	}
}
