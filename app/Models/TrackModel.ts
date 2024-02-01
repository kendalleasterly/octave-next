import axios from "axios";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { currentPlaybackObjectAtom, queueAtom } from "../Global/atoms";
import { accountAtom } from "./AccountModel";
import { PlaybackObject } from "./typedefs";
import { Track } from "./typedefs";

export function useTrackModel() {
	const setCurrentPlaybackObject = useSetRecoilState(currentPlaybackObjectAtom);
	const account = useRecoilValue(accountAtom)

	const serverURL: string = process.env.NEXT_PUBLIC_SERVER_URL!
	// const serverURL = "http://localhost:4000"


	function getPlaybackObjectFromTrack(rawTrack: Track): Promise<PlaybackObject> {

		const track = JSON.parse(JSON.stringify(rawTrack))
		delete track.dateAdded

		return new Promise((resolve, reject) => {
			// const serverURL = "http://localhost:4000"

			const SSTrack = sessionStorage.getItem(track.id);

			function fetchNewDownloadURL(): Promise<PlaybackObject> {

				return new Promise((resolve, reject) => {
					const payload = JSON.stringify(track);
					axios
						.post(
							serverURL + "/metadata-link" + `?sender=${account.uid}`,
							payload,
							{
								headers: {
									"Content-Type": "application/json",
								},
							}
						)
						.then((response) => {
							sessionStorage.setItem(track.id, JSON.stringify(response.data));

							const playbackObject = new PlaybackObject(
								track, 
								response.data.url,
								response.data.expireTime
							);

							resolve(playbackObject);
						})
						.catch((err) => {
							console.log("error retrieving metadata-link:", err.response);

							if (err.response) {
								reject(err.response.statusText);
							} else {
								reject(err);
							}
						});
				});
			}

			if (SSTrack) {
				//yes

				const jsonSSTrack = JSON.parse(SSTrack);

				if (jsonSSTrack.expireTime > Date.now()) {
					//and it's not expired
					console.log("we had", track.title, "and it wasn't expired");
					const playbackObject = new PlaybackObject(
						track,
						jsonSSTrack.url,
						jsonSSTrack.expireTime
					);

					resolve(playbackObject);
				} else {
					//the url was expired
					console.log("the url was expired");

					fetchNewDownloadURL()
						.then((playbackObject) => {
							resolve(playbackObject);
						})
						.catch((err) => {
							console.log("error fetching download url:" + err);
							reject(err);
						});
				}
			} else {
				//i didn't have it
				console.log("i didn't have it");

				fetchNewDownloadURL()
					.then((playbackObject) => {
						resolve(playbackObject);
					})
					.catch((err) => {
						console.log("error fetching download url:" + err);
						reject(err);
					});
			}
		});
	}

	function giveObjectsPositions(objects: any[]): {object: any, position: number}[] { //object could be a track or a trackID (playlist implementation)
		let tracksWithPositions = [];
		
		for (let i = 0; i < objects.length; i++) {
			let trackWithPosition = {
				object: objects[i],
				position: i,
			};

			tracksWithPositions.push(trackWithPosition);
		}

		return tracksWithPositions
	}

	function playCollection(collection: {object: Track, position: number}[], isShuffled: boolean): Promise<PlaybackObject[]> {
		return new Promise((resolve, reject) => {

			let playbackObjectArray: PlaybackObject[] = [];

			let errors = 0;

			function updatePlaybackObjectArray(playbackObject?: PlaybackObject) {
				if (playbackObject) {
					playbackObjectArray.push(playbackObject);
				}

				if (playbackObjectArray.length === collection.length - errors) {

					if (!isShuffled) {
						playbackObjectArray = playbackObjectArray.sort((first, second) => {
							return first.position!- second.position!;
						});
					}

					resolve(playbackObjectArray);
				}
			}

			collection.forEach((trackWithPosition) => {
				getPlaybackObjectFromTrack(
					trackWithPosition.object
				)
					.then((playbackObject) => {

						playbackObject.position = trackWithPosition.position

						if (playbackObject.position === collection[0].position) {
							setCurrentPlaybackObject(playbackObject);
						}

						updatePlaybackObjectArray(playbackObject);
					})
					.catch((err) => {
						console.log("error getting the plaback object from track, " + err);
						errors++;
						updatePlaybackObjectArray();
						reject("error getting the plaback object from track, " + err);
					});
			});
		})
	}

	function convertSecondsToReadableTime(totalSeconds: number) {
		if (typeof totalSeconds === "number") {
			let minutes = totalSeconds / 60;
			minutes = Math.floor(minutes);

			let seconds = totalSeconds - minutes * 60;

			if (seconds < 10) {
				return minutes + ":0" + seconds;
			} else {
				return minutes + ":" + seconds;
			}
		} else {
			return "0:00";
		}
	}

	function addTrackToDatabase(track: Track): Promise<void> {

		let copy = JSON.parse(JSON.stringify(track))
		delete copy.dateAdded

		return new Promise((resolve, reject) => {
			axios.post(serverURL + "/metadata-add" + `?sender=${account.uid}`, copy)
			.then(() => {
				resolve()
			})
			.catch(error => {
				console.log("error adding track to database", error)
				reject()
			})
		})
	}

	return {
		getPlaybackObjectFromTrack,
		playCollection,
		convertSecondsToReadableTime,
		giveObjectsPositions,
		addTrackToDatabase
	};
}
