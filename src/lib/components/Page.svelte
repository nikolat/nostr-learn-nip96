<script lang="ts">
	import { NostrFetcher } from 'nostr-fetch';
	import type { NostrEvent } from 'nostr-tools/pure';
	import type { RelayRecord } from 'nostr-tools/relay';
	import { normalizeURL } from 'nostr-tools/utils';
	import * as nip19 from 'nostr-tools/nip19';
	import { defaultUploaderURLs, defaultRelays, linkGitHub } from '$lib/config';
	import Upload from '$lib/components/Upload.svelte';
	import Delete from '$lib/components/Delete.svelte';
	import List from '$lib/components/List.svelte';

	let npub: string = $state('');
	let uploaderURLs = $state(defaultUploaderURLs);

	const setUploaderURLs = async (): Promise<void> => {
		const serverList = await getServerList();
		if (serverList.length > 0) {
			uploaderURLs = serverList;
		} else {
			uploaderURLs = defaultUploaderURLs;
		}
	};

	const getNpubWithNIP07 = async (): Promise<void> => {
		const nostr = window.nostr;
		let pubkey: string | undefined;
		if (nostr?.getPublicKey) {
			try {
				pubkey = await nostr.getPublicKey();
			} catch (error) {
				console.error(error);
				return;
			}
			npub = nip19.npubEncode(pubkey);
		}
		if (pubkey !== undefined && nostr?.getRelays) {
			let rr: RelayRecord;
			try {
				rr = await nostr.getRelays();
			} catch (error) {
				console.error(error);
				return;
			}
			const relays: string[] = [];
			for (const [k, v] of Object.entries(rr)) {
				if (v.read && URL.canParse(k)) relays.push(normalizeURL(k));
			}
			if (relays.length > 0) {
				npub = nip19.nprofileEncode({ pubkey, relays });
			}
		}
		await setUploaderURLs();
	};

	const getServerList = async (): Promise<string[]> => {
		if (npub.length === 0) return [];
		let dr;
		try {
			dr = nip19.decode(npub);
		} catch (error) {
			console.error(error);
			return [];
		}
		let pubkey: string;
		let relaySet = new Set<string>(defaultRelays);
		if (dr.type === 'npub') {
			pubkey = dr.data;
		} else if (dr.type === 'nprofile') {
			pubkey = dr.data.pubkey;
			if (dr.data.relays !== undefined) {
				for (const relay of dr.data.relays) relaySet.add(normalizeURL(relay));
			}
		} else {
			console.error(`${npub} is not npub/nprofile`);
			return [];
		}
		const targetPubkey = pubkey;
		const fetcher = NostrFetcher.init();
		const ev10002: NostrEvent | undefined = await fetcher.fetchLastEvent(Array.from(relaySet), {
			kinds: [10002],
			authors: [targetPubkey]
		});
		if (ev10002 !== undefined) {
			for (const tag of ev10002.tags.filter(
				(tag) => tag.length >= 2 && tag[0] === 'r' && URL.canParse(tag[1])
			)) {
				if (tag.length === 2 || tag[2] === 'read') {
					relaySet.add(normalizeURL(tag[1]));
				}
			}
		}
		const ev10096: NostrEvent | undefined = await fetcher.fetchLastEvent(Array.from(relaySet), {
			kinds: [10096],
			authors: [targetPubkey]
		});
		if (ev10096 === undefined) {
			console.warn('ev10096 is undefined');
			return [];
		}
		const serverList: string[] = [];
		for (const tag of ev10096.tags.filter(
			(tag) => tag.length >= 2 && tag[0] === 'server' && URL.canParse(tag[1])
		)) {
			serverList.push(tag[1]);
		}
		return serverList;
	};
</script>

<svelte:head>
	<title>Nostr Learn NIP-96</title>
</svelte:head>

<header>
	<h1>
		Nostr Learn <a
			href="https://github.com/nostr-protocol/nips/blob/master/96.md"
			target="_blank"
			rel="noopener noreferrer">NIP-96</a
		>
	</h1>
</header>
<main>
	<fieldset id="field-settings">
		<legend>Settings (optional)</legend>
		<button id="get-settings" onclick={getNpubWithNIP07}>NIP-07</button>
		<label for="get-settings">for the kind 10096 event</label>
		<input
			id="npub"
			type="text"
			placeholder="npub1... or nprofile1..."
			bind:value={npub}
			onchange={setUploaderURLs}
		/>
	</fieldset>
	<input type="radio" name="tab-item" id="tab-upload" checked />
	<label class="tab-item" for="tab-upload">Upload</label>
	<input type="radio" name="tab-item" id="tab-delete" />
	<label class="tab-item" for="tab-delete">Delete</label>
	<input type="radio" name="tab-item" id="tab-list" />
	<label class="tab-item" for="tab-list">List</label>
	<Upload {uploaderURLs} targetUrlToUpload={uploaderURLs[0]} />
	<Delete {uploaderURLs} targetUrlToDelete={uploaderURLs[0]} />
	<List {uploaderURLs} targetUrlToList={uploaderURLs[0]} />
</main>
<footer>
	<a href={linkGitHub} target="_blank" rel="noopener noreferrer">GitHub</a>
</footer>

<style>
	.tab-item {
		width: calc(100% / 3);
		height: 3em;
		background-color: rgba(255, 255, 255, 0.25);
		line-height: 3em;
		text-align: center;
		display: block;
		float: left;
		font-weight: bold;
		transition: all 0.2s ease;
		border-radius: 3em;
	}
	input:not(:checked) + .tab-item:hover {
		opacity: 0.5;
		cursor: pointer;
	}
	input[name='tab-item'] {
		display: none;
	}
	:global(.tab-content) {
		display: none;
		clear: both;
		overflow: hidden;
	}
	:global(
		#tab-upload:checked ~ #field-upload,
		#tab-delete:checked ~ #field-delete,
		#tab-list:checked ~ #field-list
	) {
		display: block;
	}
	input:checked + .tab-item {
		background-color: rgba(0, 0, 0, 0.25);
	}
	:global(fieldset) {
		min-width: 0;
	}
	:global(fieldset input[type='text']),
	#npub {
		width: calc(100% - 1.5em);
	}
	:global(fieldset input[type='file']) {
		max-width: calc(100% - 40px);
	}
	footer {
		text-align: center;
	}
</style>
