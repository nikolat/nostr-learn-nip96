<script lang="ts">
	import type { EventTemplate } from 'nostr-tools/pure';
	import { getToken } from 'nostr-tools/nip98';
	import {
		readServerConfig,
		uploadFile,
		type DelayedProcessingResponse,
		type FileUploadResponse,
		type OptionalFormDataFields
	} from '$lib/nip96';
	import { browser } from '$app/environment';
	import imageCompression from 'browser-image-compression';

	let { uploaderURLs, targetUrlToUpload }: { uploaderURLs: string[]; targetUrlToUpload: string } =
		$props();
	let filesToUpload: FileList | undefined = $state();
	let fileUploadResponse: FileUploadResponse | undefined = $state();
	let errorMessage: string | undefined = $state();
	let isInProcess: boolean = $state(false);
	let uploadLog: string = $state('');

	const compressAndUpload = async () => {
		let file: File | null = getFile();
		if (file === null) {
			return;
		}
		isInProcess = true;
		errorMessage = undefined;
		try {
			file = await compressImage(file);
			await uploadFileExec(file);
		} catch (error) {
			console.error(error);
			errorMessage = (error as Error).message;
		}
		isInProcess = false;
	};

	const getFile = (): File | null => {
		if (filesToUpload === undefined || filesToUpload.length === 0) {
			return null;
		}
		let file: File | undefined;
		for (const f of filesToUpload) {
			file = f;
		}
		if (file === undefined) {
			return null;
		}
		return file;
	};

	const compressImage = async (file: File): Promise<File> => {
		uploadLog = '';
		const round = (n: number): number => Math.round(100 * n) / 100;
		uploadLog += `${round(file.size / 1024 / 1024)} MB`;
		const options = {
			maxSizeMB: 1,
			maxWidthOrHeight: 1920,
			useWebWorker: true
		};
		const compressedFile: File = await imageCompression(file, options);
		uploadLog += ` => ${round(compressedFile.size / 1024 / 1024)} MB`;
		return compressedFile;
	};

	const uploadFileExec = async (file: File) => {
		const nostr = window.nostr;
		if (nostr === undefined) {
			return;
		}
		const sign = (e: EventTemplate) => nostr.signEvent(e);
		const config = await readServerConfig(targetUrlToUpload);
		const token = await getToken(config.api_url, 'POST', sign, true);
		const option: OptionalFormDataFields = {
			size: String(file.size),
			content_type: file.type
		};
		console.info('file uploading...');
		fileUploadResponse = await uploadFile(file, config.api_url, token, option);
		if (fileUploadResponse.status === 'error') {
			throw Error(fileUploadResponse.message);
		}
		console.info($state.snapshot(fileUploadResponse));
		const processing_url = fileUploadResponse.processing_url;
		if (processing_url !== undefined && URL.canParse(processing_url)) {
			const sleep = (timeout: number) => new Promise((handler) => setTimeout(handler, timeout));
			let retry: number = 5;
			while (true) {
				const request = new Request(processing_url, {
					method: 'GET',
					headers: {
						Authorization: await getToken(processing_url, 'GET', sign, true)
					}
				});
				const response = await fetch(request);
				if (response.status === 201) {
					break;
				}
				const delayedProcessingResponse: DelayedProcessingResponse = await response.json();
				if (delayedProcessingResponse.status === 'error') {
					throw Error(delayedProcessingResponse.message);
				}
				console.info($state.snapshot(delayedProcessingResponse));
				retry--;
				if (retry < 0) {
					throw Error('timeout');
				}
				await sleep(1000);
			}
		}
		console.info('file uploading complete');
	};

	const uploadedFileUrl = $derived(
		fileUploadResponse?.nip94_event?.tags.find((tag) => tag[0] === 'url')?.at(1) ?? ''
	);
</script>

<fieldset class="tab-content" id="field-upload">
	<legend>Upload</legend>
	<dl>
		<dt><label for="uploader-url-to-upload">Target URL</label></dt>
		<dd>
			<select id="uploader-url-to-upload" bind:value={targetUrlToUpload}>
				{#each uploaderURLs as url (url)}
					<option value={url}>{url}</option>
				{/each}
			</select>
			<details>
				<summary>Server Config</summary>
				<pre>{#if targetUrlToUpload}{#await browser ? readServerConfig(targetUrlToUpload) : Promise.resolve()}connecting...{:then serverConfig}<code
								>{JSON.stringify(serverConfig, undefined, 2)}</code
							>{/await}{/if}</pre>
			</details>
		</dd>
		<dt><label for="select-file">Select file to upload</label></dt>
		<dd><input id="select-file" type="file" bind:files={filesToUpload} /></dd>
		<dt>
			<label for="upload">Upload</label> (required
			<a
				href="https://github.com/nostr-protocol/nips/blob/master/07.md"
				target="_blank"
				rel="noopener noreferrer">NIP-07</a
			>
			extension)
			<br /><span>{uploadLog}</span>
		</dt>
		<dd>
			<button
				id="upload"
				onclick={compressAndUpload}
				disabled={filesToUpload === undefined || filesToUpload.length === 0 || isInProcess}
				>Upload</button
			>
		</dd>
		<dt>
			<label for="uploaded-file-url">Uploaded file URL</label>
			<button
				class="copy"
				onclick={() => {
					navigator.clipboard.writeText(uploadedFileUrl);
				}}
				title="Copy to clipboard"
				aria-label="Copy to clipboard"><svg><use xlink:href="./copy.svg#copy"></use></svg></button
			>
		</dt>
		<dd>
			<input id="uploaded-file-url" type="text" value={uploadedFileUrl} readonly />
			{#if uploadedFileUrl}
				{@const m =
					fileUploadResponse?.nip94_event?.tags.find((tag) => tag[0] === 'm')?.at(1) ?? ''}
				{#if /^image/.test(m)}
					<a href={uploadedFileUrl} target="_blank" rel="noopener noreferrer"
						><img src={uploadedFileUrl} alt="" /></a
					>
				{:else if /^video/.test(m)}
					<video controls preload="metadata">
						<track kind="captions" />
						<source src={uploadedFileUrl} />
					</video>
				{:else if /^audio/.test(m)}
					<audio controls preload="metadata" src={uploadedFileUrl}></audio>
				{:else}
					<a href={uploadedFileUrl} target="_blank" rel="noopener noreferrer">{uploadedFileUrl}</a>
				{/if}
			{/if}
		</dd>
		<dt>Result</dt>
		<dd>
			<details>
				<summary>Result</summary>
				{#if errorMessage === undefined}
					<pre><code>{JSON.stringify(fileUploadResponse, undefined, 2) ?? ''}</code></pre>
				{:else}
					<pre class="error">{errorMessage}</pre>
				{/if}
			</details>
		</dd>
	</dl>
</fieldset>

<style>
	button.copy {
		padding: 0;
		width: 20px;
		height: 20px;
		fill: white;
	}
	button.copy svg {
		width: 16px;
		height: 16px;
	}
	button.copy:active > svg {
		fill: yellow;
	}
	.error {
		color: red;
	}
</style>
