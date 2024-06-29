<script lang='ts'>
import type { EventTemplate } from 'nostr-tools/pure';
import { linkGitHub } from '$lib/config';
import * as nip96 from 'nostr-tools/nip96';
import * as nip98 from 'nostr-tools/nip98';

let filesToUpload: FileList;
let result: string;
const targetUrl = 'https://yabu.me';

const upload = async () => {
	const nostr = window.nostr;
	if (nostr === undefined)
		return;
	const f = (e: EventTemplate) => nostr.signEvent(e);
	const c = await nip96.readServerConfig(targetUrl);
	const s = await nip98.getToken(c.api_url, 'POST', f, true);
	let file: File | undefined;
	for (const f of filesToUpload) {
		file = f;
	}
	if (file === undefined)
		return;
	const r = await myUploadFile(file, c.api_url, s);
	result = JSON.stringify(r, undefined, 2);
};

const myUploadFile = async (
	file: File,
	serverApiUrl: string,
	nip98AuthorizationHeader: string,
	optionalFormDataFields?: nip96.OptionalFormDataFields,
): Promise<nip96.FileUploadResponse> => {
	// Create FormData object
	const formData = new FormData()

	// Append the authorization header to HTML Form Data
	formData.append('Authorization', nip98AuthorizationHeader)

	// Append optional fields to FormData
	optionalFormDataFields &&
		Object.entries(optionalFormDataFields).forEach(([key, value]) => {
		if (value) {
			formData.append(key, value)
		}
	})

	// Append the file to FormData as the last field
	formData.append('file', file)

	// Make the POST request to the server
	const response = await fetch(serverApiUrl, {
		method: 'POST',
		headers: {
			Authorization: nip98AuthorizationHeader,
			//'Content-Type': 'multipart/form-data',// <- これを入れると何故か400エラーになる
		},
		body: formData,
	})

	if (response.ok === false) {
		// 413 Payload Too Large
		if (response.status === 413) {
		throw new Error('File too large!')
		}

		// 400 Bad Request
		if (response.status === 400) {
			throw new Error('Bad request! Some fields are missing or invalid!')
		}

		// 403 Forbidden
		if (response.status === 403) {
		throw new Error('Forbidden! Payload tag does not match the requested file!')
		}

		// 402 Payment Required
		if (response.status === 402) {
		throw new Error('Payment required!')
		}

		// unknown error
		throw new Error('Unknown error in uploading file!')
	}

	const text = await response.text();// <- response.json()が何故か失敗する
	const parsedResponse = JSON.parse(text);
	if (!nip96.validateFileUploadResponse(parsedResponse)) {
		throw new Error('Invalid response from the server!')
	}
	return parsedResponse;
};

</script>

<svelte:head>
	<title>Nostr Learn NIP-96</title>
</svelte:head>

<header><h1>Nostr Learn NIP-96</h1></header>
<main>
<dl>
	<dt>Target URL</dt>
	<dd>{targetUrl}</dd>
</dl>
<input type="file" bind:files={filesToUpload} />
<button on:click={upload}>Upload</button>
<pre><code>{result ? result : '(result)'}</code></pre>
</main>
<footer><a href={linkGitHub} target="_blank" rel="noopener noreferrer">GitHub</a></footer>

<style>
footer {
	text-align: center;
}
</style>
