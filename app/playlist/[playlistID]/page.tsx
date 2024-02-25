import PlaylistView from "./PlaylistComponents";

function PlaylistViewWrapper({ params }: { params: { playlistID: string } }) {
	return (
		<div>
			<PlaylistView params={params}/>
		</div>
	);
}

export default PlaylistViewWrapper;