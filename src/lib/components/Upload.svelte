<script lang='ts'>
import type { EventTemplate } from 'nostr-tools/pure';
import { readServerConfig, type FileUploadResponse, type OptionalFormDataFields } from 'nostr-tools/nip96';
import { getToken } from 'nostr-tools/nip98';
import { uploadFile } from '$lib/nip96';

export let uploaderURLs: string[];
export let targetUrlToUpload: string;
let filesToUpload: FileList;
let fileUploadResponse: FileUploadResponse;
let isInProcess: boolean = false;

const uploadFileExec = async () => {
	isInProcess = true;
	const nostr = window.nostr;
	if (nostr === undefined) {
		isInProcess = false;
		return;
	}
	const f = (e: EventTemplate) => nostr.signEvent(e);
	const c = await readServerConfig(targetUrlToUpload);
	const s = await getToken(c.api_url, 'POST', f, true);
	let file: File | undefined;
	for (const f of filesToUpload) {
		file = f;
	}
	if (file === undefined) {
		isInProcess = false;
		return;
	}
	const option: OptionalFormDataFields = {
		size: String(file.size),
		content_type: file.type,
	};
	fileUploadResponse = await uploadFile(file, c.api_url, s, option);
	isInProcess = false;
};

$: uploadedFileUrl = fileUploadResponse?.nip94_event?.tags.find(tag => tag[0] === 'url')?.at(1) ?? '';
</script>

<fieldset class="tab-content" id="field-upload">
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
		<dd><button id="upload" on:click={uploadFileExec} disabled={filesToUpload === undefined || filesToUpload.length === 0 || isInProcess }>Upload</button></dd>
		<dt><label for="uploaded-file-url">Uploaded file URL</label></dt>
		<dd>
			<input id="uploaded-file-url" type="text" value={uploadedFileUrl} readonly />
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
