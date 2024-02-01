"use client"

import React, {useEffect, useState} from "react";
import {useSetRecoilState} from "recoil";
import {useSpotifyModel} from "../../Models/SpotifyModel";
import { FullAlbum } from "@/app/Models/typedefs";
import {headerTextAtom, queueAtom, shufflingAtom} from "../../Global/atoms";
import ButtonComponent from "../../Components/ButtonComponent";
import Song from "../../Components/Song";
import {usePlaybackModel} from "../../Models/PlaybackModel";
import {useTrackModel} from "../../Models/TrackModel";
import RemoteImage from "@/app/Components/RemoteImage";
import Image from "next/image";

function AlbumView({params}:{params:{albumID: string}}) {
	const setHeaderText = useSetRecoilState(headerTextAtom);
	const setShuffling = useSetRecoilState(shufflingAtom)
	const {prepareForNewSong, shuffleObjects} = usePlaybackModel();
	const spotifyModel = useSpotifyModel();
	const trackModel = useTrackModel();

	const [album, setAlbum] = useState<FullAlbum | undefined>(undefined);
	const setQueue = useSetRecoilState(queueAtom)

	useEffect(() => {

		if (params.albumID !== "") {
			setHeaderText("");

			spotifyModel.getAlbum(params.albumID).then((fetchedAlbum) => {

				setAlbum(fetchedAlbum);

			});
		}
	}, [params.albumID]);

	function getAlbumYear() {

        if (album?.date) {
            const date = new Date(album!.date);
		    return date.getFullYear();
        } else{
            return 0
        }
	}



	async function shuffleAlbum() {
		prepareForNewSong();

		const tracksWithPositions = trackModel.giveObjectsPositions(album!.tracks)

		const shuffledTracksWithPositions = shuffleObjects(tracksWithPositions);
		console.log({shuffledTracksWithPositions});

		trackModel.playCollection(shuffledTracksWithPositions, true)
		.then((newQueue) => {
			setQueue(newQueue);
			setShuffling(true)
		});
		
	}

	if (album) {
		return (
			<div id="album-view" className = "space-y-10">
				<div className="md:flex md:space-x-6 space-y-6 md:space-y-0 md:items-center">
                    
					<RemoteImage src={album.artwork!} className="w-full aspect-square max-w-sm md:w-60 md:h-60 rounded-xl mx-auto md:mx-0 md:max-w-none" imgClass="rounded-xl"/>
                    
					<div className="my-auto space-y-6">
						<div className = "space-y-3">
							<p className="text text-xl font-semibold text-center md:text-left">{album.title}</p>

							<p className="text-gray-400 font-semibold text-center md:text-left">
								{album.artist} • {getAlbumYear()}
							</p>
						</div>

						<div className="double-button">
							<ButtonComponent
								text="Play"
								action={() => {
									prepareForNewSong();

									spotifyModel.getAlbumTracks(album.id)
									.then((tracks) => {

										const tracksWithPositions = trackModel.giveObjectsPositions(tracks)

										trackModel.playCollection(tracksWithPositions, false);
									});
								}}
							/>
							<p></p>
							<ButtonComponent text="Shuffle" action={shuffleAlbum} />
						</div>
					</div>
				</div>

				<div className="space-y-8">
					{album.tracks.map((track, key) => {
						return <Song track={track} noImage={true} key={key} index={key} />; //TODO make sure the onClickFunction respects the context of being clicked from an album (adding the other songs to the queeue with their positions)
					})}
				</div>
			</div>
		);
	} else {
		return <p></p>;
	}
}

export default AlbumView;
