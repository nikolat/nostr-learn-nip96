<script lang="ts">
	import type { EventTemplate } from 'nostr-tools/pure';
	import { deleteFile, readServerConfig } from 'nostr-tools/nip96';
	import { getToken } from 'nostr-tools/nip98';

	let {
		uploaderURLs,
		targetUrlToDelete,
		fileHashToDelete
	}: { uploaderURLs: string[]; targetUrlToDelete: string; fileHashToDelete: string } = $props();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let fileDeleteResponse: any = $state();
	let isInProcess: boolean = $state(false);

	const deleteFileExec = async () => {
		isInProcess = true;
		const nostr = window.nostr;
		if (nostr === undefined) {
			isInProcess = false;
			return;
		}
		const sign = (e: EventTemplate) => nostr.signEvent(e);
		const config = await readServerConfig(targetUrlToDelete);
		let serverApiUrl = config.api_url;
		if (!serverApiUrl.endsWith('/')) {
			serverApiUrl += '/';
		}
		serverApiUrl += fileHashToDelete;
		try {
			const token = await getToken(serverApiUrl, 'DELETE', sign, true);
			fileDeleteResponse = await deleteFile(fileHashToDelete, serverApiUrl, token);
		} catch (error) {
			console.error(error);
		}
		isInProcess = false;
	};
</script>

<fieldset class="tab-content" id="field-delete">
	<legend>Delete</legend>
	<dl>
		<dt><label for="uploader-url-to-delete">Target URL</label></dt>
		<dd>
			<select id="uploader-url-to-delete" bind:value={targetUrlToDelete}>
				{#each uploaderURLs as url (url)}
					<option value={url}>{url}</option>
				{/each}
			</select>
		</dd>
		<dt>
			<label for="file-hash-to-delete">The SHA-256 hash of the original file</label>
		</dt>
		<dd>
			<input id="file-hash-to-delete" type="text" bind:value={fileHashToDelete} />
		</dd>
		<dt>
			<label for="delete">Delete</label> (required
			<a
				href="https://github.com/nostr-protocol/nips/blob/master/07.md"
				target="_blank"
				rel="noopener noreferrer">NIP-07</a
			> extension)
		</dt>
		<dd>
			<button
				id="delete"
				onclick={deleteFileExec}
				disabled={fileHashToDelete.length === 0 || isInProcess}>Delete</button
			>
		</dd>
		<dt>Result</dt>
		<dd>
			<details>
				<summary>Result</summary>
				<pre><code>{JSON.stringify(fileDeleteResponse, undefined, 2) ?? ''}</code></pre>
			</details>
		</dd>
	</dl>
</fieldset>
