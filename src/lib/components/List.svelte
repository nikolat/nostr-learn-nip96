<script lang='ts'>
import type { EventTemplate } from 'nostr-tools/pure';
import { readServerConfig } from 'nostr-tools/nip96';
import { getToken } from 'nostr-tools/nip98';
import { uploaderURLs } from '$lib/config';
import { listFiles, type FileListResponse } from '$lib/nip96';

let targetUrlToList: string;
let fileListResponse: FileListResponse | undefined;
let listPage: number = 0;
let listCount: number = 10;

const listFilesExec = async () => {
	const nostr = window.nostr;
	if (nostr === undefined)
		return;
	const f = (e: EventTemplate) => nostr.signEvent(e);
	const c = await readServerConfig(targetUrlToList);
	const params = {
		page: String(listPage),
		count: String(listCount),
	};
	const p = new URLSearchParams(params).toString();
	const serverApiUrl = `${c.api_url}?${p}`;
	const s = await getToken(serverApiUrl, 'GET', f, true);
	try {
		fileListResponse = await listFiles(serverApiUrl, s);
	} catch (error) {
		console.error(error);
		fileListResponse = undefined;
	}
};
</script>

<fieldset class="tab-content" id="field-list">
	<legend>List</legend>
	<dl>
		<dt><label for="uploader-url-to-list">Target URL</label></dt>
		<dd><select id="uploader-url-to-list" bind:value={targetUrlToList}>
			{#each uploaderURLs as url}
				<option value={url}>{url}</option>
			{/each}
			</select>
		</dd>
		<dt><label for="show-list">Show List</label> (required <a href="https://github.com/nostr-protocol/nips/blob/master/07.md" target="_blank" rel="noopener noreferrer">NIP-07</a> extension)</dt>
		<dd>
			<label for="list-page">Page</label>
			<input id="list-page" type="number" bind:value={listPage} />
			<label for="list-count">Count</label>
			<input id="list-count" type="number" bind:value={listCount} />
			<button id="show-list" on:click={listFilesExec}>Show List</button>
		</dd>
		<dt>Result</dt>
		<dd class="list">
		{#if fileListResponse !== undefined}
			{#each fileListResponse.files as file}
				{@const url = file.tags.find(tag => tag[0] === 'url')?.at(1)}
				{@const m = file.tags.find(tag => tag[0] === 'm')?.at(1)}
				{#if url !== undefined && m !== undefined}
					{#if /^image/.test(m)}
						<a href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt="" /></a>
					{:else if /^video/.test(m)}
						<video controls preload="metadata">
							<track kind="captions">
							<source src={url}>
						</video>
					{:else if /^audio/.test(m)}
						<audio controls preload="metadata" src={url}></audio>
					{:else}
						<a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
					{/if}
				{/if}
			{/each}
		{/if}
			<details><summary>Result</summary><pre><code>{JSON.stringify(fileListResponse, undefined, 2) ?? ''}</code></pre></details>
		</dd>
	</dl>
</fieldset>

<style>
.list img {
	max-width: 25%;
	max-height: 300px;
}
</style>
