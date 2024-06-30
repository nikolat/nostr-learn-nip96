<script lang='ts'>
import type { EventTemplate } from 'nostr-tools/pure';
import { readServerConfig, type FileUploadResponse } from 'nostr-tools/nip96';
import { getToken } from 'nostr-tools/nip98';
import { uploaderURLs, linkGitHub } from '$lib/config';
import { uploadFile } from '$lib/nip96';

let targetUrl: string;
let filesToUpload: FileList;
let uploadedFileUrl: string;
let fileUploadResponse: FileUploadResponse;

const upload = async () => {
	const nostr = window.nostr;
	if (nostr === undefined)
		return;
	const f = (e: EventTemplate) => nostr.signEvent(e);
	const c = await readServerConfig(targetUrl);
	const s = await getToken(c.api_url, 'POST', f, true);
	let file: File | undefined;
	for (const f of filesToUpload) {
		file = f;
	}
	if (file === undefined)
		return;
	fileUploadResponse = await uploadFile(file, c.api_url, s);
};

$: uploadedFileUrl = fileUploadResponse?.nip94_event?.tags.find(tag => tag[0] === 'url')?.at(1) ?? '';
$: result = JSON.stringify(fileUploadResponse, undefined, 2);

</script>

<svelte:head>
	<title>Nostr Learn NIP-96</title>
</svelte:head>

<header><h1>Nostr Learn <a href="https://github.com/nostr-protocol/nips/blob/master/96.md" target="_blank" rel="noopener noreferrer">NIP-96</a></h1></header>
<main>
<fieldset>
<legend>Upload</legend>
<dl>
	<dt><label for="uploader-url">Target URL</label></dt>
	<dd><select id="uploader-url" bind:value={targetUrl}>
		{#each uploaderURLs as url}
		<option value={url}>{url}</option>
		{/each}
		</select>
		<details>
			<summary>Server Config</summary>
			<pre>{#if targetUrl}{#await readServerConfig(targetUrl)}{'connecting...'}{:then serverConfig}<code>{JSON.stringify(serverConfig, undefined, 2)}</code>{/await}{/if}</pre>
		</details>
	</dd>
	<dt><label for="select-file">Select file to upload</label></dt>
	<dd><input id="select-file" type="file" bind:files={filesToUpload} /></dd>
	<dt><label for="upload">Upload</label> (required <a href="https://github.com/nostr-protocol/nips/blob/master/07.md" target="_blank" rel="noopener noreferrer">NIP-07</a> extension)</dt>
	<dd><button id="upload" on:click={upload} disabled={filesToUpload === undefined || filesToUpload.length === 0 }>Upload</button></dd>
	<dt><label for="uploaded-file-url">Uploaded file URL</label></dt>
	<dd>
		<input id="uploaded-file-url" bind:value={uploadedFileUrl} />
		{#if uploadedFileUrl}
			{@const m = fileUploadResponse?.nip94_event?.tags.find(tag => tag[0] === 'm')?.at(1) ?? ''}
			{#if /^image/.test(m)}
				<a href={uploadedFileUrl} target="_blank" rel="noopener noreferrer"><img src={uploadedFileUrl} alt="" /></a>
			{:else if /^video/.test(m)}
				<video controls preload="metadata">
					<track kind="captions">
					<source src={uploadedFileUrl}>
				</video>
			{:else if /^audio/.test(m)}
				<audio controls preload="metadata" src={uploadedFileUrl}></audio>
			{:else}
				<a href={uploadedFileUrl} target="_blank" rel="noopener noreferrer">{uploadedFileUrl}</a>
			{/if}
		{/if}
	</dd>
	<dt>Result</dt>
	<dd><details><summary>Result</summary><pre><code>{result ?? ''}</code></pre></details></dd>
</dl>
</fieldset>
</main>
<footer><a href={linkGitHub} target="_blank" rel="noopener noreferrer">GitHub</a></footer>

<style>
fieldset {
	min-width: 0;
}
#uploaded-file-url {
	width: calc(100% - 1.5em);
}
footer {
	text-align: center;
}
</style>
