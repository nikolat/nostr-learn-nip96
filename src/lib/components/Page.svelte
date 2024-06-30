<script lang='ts'>
import type { EventTemplate } from 'nostr-tools/pure';
import { deleteFile, readServerConfig, type FileUploadResponse } from 'nostr-tools/nip96';
import { getToken } from 'nostr-tools/nip98';
import { uploaderURLs, linkGitHub } from '$lib/config';
import { uploadFile } from '$lib/nip96';

let targetUrlToUpload: string;
let filesToUpload: FileList;
let uploadedFileUrl: string;
let fileUploadResponse: FileUploadResponse;
let targetUrlToDelete: string;
let fileHashToDelete: string;
let fileDeleteResponse: any;

const uploadFileExec = async () => {
	const nostr = window.nostr;
	if (nostr === undefined)
		return;
	const f = (e: EventTemplate) => nostr.signEvent(e);
	const c = await readServerConfig(targetUrlToUpload);
	const s = await getToken(c.api_url, 'POST', f, true);
	let file: File | undefined;
	for (const f of filesToUpload) {
		file = f;
	}
	if (file === undefined)
		return;
	fileUploadResponse = await uploadFile(file, c.api_url, s);
};

const deleteFileExec = async () => {
	const nostr = window.nostr;
	if (nostr === undefined)
		return;
	const f = (e: EventTemplate) => nostr.signEvent(e);
	const c = await readServerConfig(targetUrlToDelete);
	let serverApiUrl = c.api_url;
	if (!serverApiUrl.endsWith('/')) {
		serverApiUrl += '/';
	}
	serverApiUrl += fileHashToDelete;
	const s = await getToken(serverApiUrl, 'DELETE', f, true);
	fileDeleteResponse = await deleteFile(fileHashToDelete, c.api_url, s);
};

$: uploadedFileUrl = fileUploadResponse?.nip94_event?.tags.find(tag => tag[0] === 'url')?.at(1) ?? '';

</script>

<svelte:head>
	<title>Nostr Learn NIP-96</title>
</svelte:head>

<header><h1>Nostr Learn <a href="https://github.com/nostr-protocol/nips/blob/master/96.md" target="_blank" rel="noopener noreferrer">NIP-96</a></h1></header>
<main>
<fieldset>
<legend>Upload</legend>
<dl>
	<dt><label for="uploader-url-to-upload">Target URL</label></dt>
	<dd><select id="uploader-url-to-upload" bind:value={targetUrlToUpload}>
		{#each uploaderURLs as url}
		<option value={url}>{url}</option>
		{/each}
		</select>
		<details>
			<summary>Server Config</summary>
			<pre>{#if targetUrlToUpload}{#await readServerConfig(targetUrlToUpload)}{'connecting...'}{:then serverConfig}<code>{JSON.stringify(serverConfig, undefined, 2)}</code>{/await}{/if}</pre>
		</details>
	</dd>
	<dt><label for="select-file">Select file to upload</label></dt>
	<dd><input id="select-file" type="file" bind:files={filesToUpload} /></dd>
	<dt><label for="upload">Upload</label> (required <a href="https://github.com/nostr-protocol/nips/blob/master/07.md" target="_blank" rel="noopener noreferrer">NIP-07</a> extension)</dt>
	<dd><button id="upload" on:click={uploadFileExec} disabled={filesToUpload === undefined || filesToUpload.length === 0 }>Upload</button></dd>
	<dt><label for="uploaded-file-url">Uploaded file URL</label></dt>
	<dd>
		<input id="uploaded-file-url" value={uploadedFileUrl} readonly />
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
	<dd><details><summary>Result</summary><pre><code>{JSON.stringify(fileUploadResponse, undefined, 2) ?? ''}</code></pre></details></dd>
</dl>
</fieldset>
<fieldset>
<legend>Delete</legend>
<dl>
	<dt><label for="uploader-url-to-delete">Target URL</label></dt>
	<dd><select id="uploader-url-to-delete" bind:value={targetUrlToDelete}>
		{#each uploaderURLs as url}
		<option value={url}>{url}</option>
		{/each}
		</select>
	</dd>
	<dt><label for="file-hash-to-delete">The SHA-256 hash of the original file</label></dt>
	<dd><input id="file-hash-to-delete" bind:value={fileHashToDelete} /></dd>
	<dt><label for="delete">Delete</label> (required <a href="https://github.com/nostr-protocol/nips/blob/master/07.md" target="_blank" rel="noopener noreferrer">NIP-07</a> extension)</dt>
	<dd><button id="delete" on:click={deleteFileExec} disabled={!fileHashToDelete}>Delete</button></dd>
	<dt>Result</dt>
	<dd><details><summary>Result</summary><pre><code>{JSON.stringify(fileDeleteResponse, undefined, 2) ?? ''}</code></pre></details></dd>
</dl>
</fieldset>
</main>
<footer><a href={linkGitHub} target="_blank" rel="noopener noreferrer">GitHub</a></footer>

<style>
fieldset {
	min-width: 0;
}
#select-file {
	max-width: calc(100% - 40px);
}
#uploaded-file-url, #file-hash-to-delete {
	width: calc(100% - 1.5em);
}
footer {
	text-align: center;
}
</style>
