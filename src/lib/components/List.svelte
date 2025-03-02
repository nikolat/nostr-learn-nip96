<script lang="ts">
	import type { EventTemplate } from 'nostr-tools/pure';
	import { readServerConfig } from 'nostr-tools/nip96';
	import { getToken } from 'nostr-tools/nip98';
	import { listFiles, type FileListResponse } from '$lib/nip96';

	let {
		uploaderURLs,
		targetUrlToList,
		fileHashToDelete = $bindable()
	}: {
		uploaderURLs: string[];
		targetUrlToList: string;
		fileHashToDelete: string;
	} = $props();
	let fileListResponse: FileListResponse | undefined = $state();
	let listPage: number = $state(0);
	let listCount: number = $state(10);
	let isInProcess: boolean = $state(false);

	const listFilesExec = async () => {
		isInProcess = true;
		const nostr = window.nostr;
		if (nostr === undefined) {
			isInProcess = false;
			return;
		}
		const f = (e: EventTemplate) => nostr.signEvent(e);
		const c = await readServerConfig(targetUrlToList);
		const params = {
			page: String(listPage),
			count: String(listCount)
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
		isInProcess = false;
	};

	const goToDeleteTab = (ox: string | undefined): void => {
		if (ox === undefined) return;
		const tab = document.getElementById('tab-delete') as HTMLInputElement;
		tab.checked = true;
		tab.click();
		const uploader = document.getElementById('uploader-url-to-delete') as HTMLSelectElement;
		uploader.value = (document.getElementById('uploader-url-to-list') as HTMLSelectElement).value;
		fileHashToDelete = ox;
	};
</script>

<fieldset class="tab-content" id="field-list">
	<legend>List</legend>
	<dl>
		<dt><label for="uploader-url-to-list">Target URL</label></dt>
		<dd>
			<select id="uploader-url-to-list" bind:value={targetUrlToList}>
				{#each uploaderURLs as url (url)}
					<option value={url}>{url}</option>
				{/each}
			</select>
		</dd>
		<dt>
			<label for="show-list">Show List</label> (required
			<a
				href="https://github.com/nostr-protocol/nips/blob/master/07.md"
				target="_blank"
				rel="noopener noreferrer">NIP-07</a
			> extension)
		</dt>
		<dd>
			<label for="list-page">Page</label>
			<input id="list-page" type="number" bind:value={listPage} />
			<label for="list-count">Count</label>
			<input id="list-count" type="number" bind:value={listCount} />
			<button id="show-list" onclick={listFilesExec} disabled={isInProcess}>Show List</button>
		</dd>
		<dt>Result</dt>
		<dd class="list">
			{#if fileListResponse !== undefined}
				{#each fileListResponse.files as file, i (i)}
					{@const url = file.tags.find((tag) => tag[0] === 'url')?.at(1)}
					{@const m = file.tags.find((tag) => tag[0] === 'm')?.at(1)}
					{@const ox = file.tags.find((tag) => tag[0] === 'ox')?.at(1)}
					{#if url !== undefined && m !== undefined}
						<span class="file-container">
							{#if /^image/.test(m)}
								<a href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt="" /></a>
							{:else if /^video/.test(m)}
								<video controls preload="metadata">
									<track kind="captions" />
									<source src={url} />
								</video>
							{:else if /^audio/.test(m)}
								<audio controls preload="metadata" src={url}></audio>
							{:else}
								<a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
							{/if}
							<button
								class="delete"
								onclick={() => goToDeleteTab(ox)}
								title="Delete"
								aria-label="Delete"><svg><use xlink:href="./trash.svg#delete"></use></svg></button
							>
						</span>
					{/if}
				{/each}
			{/if}
			<details>
				<summary>Result</summary>
				<pre><code>{JSON.stringify(fileListResponse, undefined, 2) ?? ''}</code></pre>
			</details>
		</dd>
	</dl>
</fieldset>

<style>
	.list img {
		max-width: 24%;
		max-height: 300px;
		vertical-align: top;
	}
	button.delete {
		padding: 0;
		width: 24px;
		height: 24px;
		fill: white;
	}
	button.delete svg {
		width: 24px;
		height: 24px;
	}
	button.delete:active > svg {
		fill: yellow;
	}
	.file-container {
		position: relative;
	}
	.file-container > button.delete {
		position: absolute;
		top: 0;
		right: 0;
	}
</style>
