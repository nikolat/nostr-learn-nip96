<script lang='ts'>
import { linkGitHub } from '$lib/config';
import Upload from '$lib/components/Upload.svelte';
import Delete from '$lib/components/Delete.svelte';
import List from '$lib/components/List.svelte';
</script>

<svelte:head>
	<title>Nostr Learn NIP-96</title>
</svelte:head>

<header><h1>Nostr Learn <a href="https://github.com/nostr-protocol/nips/blob/master/96.md" target="_blank" rel="noopener noreferrer">NIP-96</a></h1></header>
<main>
	<input type="radio" name="tab-item" id="tab-upload" checked>
	<label class="tab-item" for="tab-upload">Upload</label>
	<input type="radio" name="tab-item" id="tab-delete">
	<label class="tab-item" for="tab-delete">Delete</label>
	<input type="radio" name="tab-item" id="tab-list">
	<label class="tab-item" for="tab-list">List</label>
	<Upload />
	<Delete />
	<List />
</main>
<footer><a href={linkGitHub} target="_blank" rel="noopener noreferrer">GitHub</a></footer>

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
}
input[name="tab-item"] {
	display: none;
}
:global(.tab-content) {
	display: none;
	clear: both;
	overflow: hidden;
}
:global(#tab-upload:checked ~ #field-upload,
#tab-delete:checked ~ #field-delete,
#tab-list:checked ~ #field-list) {
	display: block;
}
input:checked + .tab-item {
	background-color: rgba(0, 0, 0, 0.25);
}
:global(fieldset) {
	min-width: 0;
}
:global(fieldset input[type="text"]) {
	width: calc(100% - 1.5em);
}
:global(fieldset input[type="file"]) {
	max-width: calc(100% - 40px);
}
footer {
	text-align: center;
}
</style>
