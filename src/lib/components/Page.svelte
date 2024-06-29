<script lang='ts'>
import type { EventTemplate } from 'nostr-tools/pure';
import { linkGitHub } from '$lib/config';
import * as nip96 from 'nostr-tools/nip96';
import * as nip98 from 'nostr-tools/nip98';

let imageFile: File;
const targetUrl = 'https://yabu.me';

const upload = async () => {
	const nostr = window.nostr;
	if (nostr === undefined)
		return;
	const f = (e: EventTemplate) => nostr.signEvent(e);
	const c = await nip96.readServerConfig(targetUrl);
	console.log(c);
	const s = await nip98.getToken(c.api_url, 'POST', f, true);
	console.log(s);
//	const r = await nip96.uploadFile(imageFile, c.api_url, s);
//	console.log(r);
	await myUploadFile(imageFile, c.api_url, s);
};

const myUploadFile = async (file: File, serverApiUrl: string, nip98AuthorizationHeader: string) => {
	const formData = new FormData();
	formData.append('file', file);
	const response = await fetch(serverApiUrl, {
		method: 'POST',
		headers: {
			Authorization: nip98AuthorizationHeader
		},
		body: formData
	});
	console.log(response);
}

</script>

<svelte:head>
	<title>Nostr Learn NIP-96</title>
</svelte:head>

<header><h1>Nostr Learn NIP-96</h1></header>
<main>
<input type="file" bind:value={imageFile} />
<button on:click={upload}>Upload</button>
</main>
<footer><a href={linkGitHub} target="_blank" rel="noopener noreferrer">GitHub</a></footer>

<style>
footer {
	text-align: center;
}
</style>
