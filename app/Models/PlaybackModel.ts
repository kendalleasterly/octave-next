import {
	currentPlaybackObjectAtom,
	isPlayingAtom,
	queueAtom,
	shouldPlayAtom,
	shufflingAtom,
} from "../Global/atoms";
import {useRecoilState, useRecoilValue, useSetRecoilState} from "recoil";
import {PlaybackObject, Track} from "./typedefs";
import {useNotificationModel, NotificationObject} from "./NotificationModel";
import {useTrackModel} from "./TrackModel";

import {useState} from "react";
import {usePlaceholder} from "../Components/Placeholder";
import { useReferences } from "../Global/references";

export function usePlaybackModel() {
	const [queue, setQueue] = useRecoilState(queueAtom);
	const [shouldPlay, setShouldPlay] = useRecoilState(shouldPlayAtom);
	const [shuffling, setShuffling] = useRecoilState(shufflingAtom);

	const setIsPlaying = useSetRecoilState(isPlayingAtom);

	const notificationModel = useNotificationModel();
	const trackModel = useTrackModel();
	const placeholder = usePlaceholder();

	const [currentPlaybackObject, setCurrentPlaybackObject] = useRecoilState(currentPlaybackObjectAtom);
	const player: {current: HTMLAudioElement | null} = useReferences().audioReference!

	//MARK: Event listeners

	async function handlePlaying() {
		if (currentPlaybackObject.track) {
			if (shouldPlay) {
				setIsPlaying(true);

				const readableTime = trackModel.convertSecondsToReadableTime(
					currentPlaybackObject.track.duration
				);

				updateElementWithClass("time-total", (element: HTMLElement) => {
					element.innerHTML = readableTime;
				});

				document.title =
					currentPlaybackObject.track.title +
					" - " +
					currentPlaybackObject.track.artist;
				//get the current time and update it
			} else {
				player.current!.pause();
				setShouldPlay(true);
			}
		}
	}

	function handlePause() {
		setIsPlaying(false);
	}

	function handleEnded() {
		//TODO: make sure the song hasn't epired
		console.log("song did end");
		console.log({queue});

		const nextSongIndex = getCurrentQueuePosition() + 1;

		const nextPlaybackObject = queue[nextSongIndex];
		console.log({nextPlaybackObject});
		if (nextPlaybackObject) {
			checkAndSetCurrentPlaybackObject(nextPlaybackObject);
		} else {
			goToFirstSong();
		}
	}

	function handleUpdate() {
		const timeProgressed = player.current!.currentTime;
		const readableTime = trackModel.convertSecondsToReadableTime(
			Math.floor(timeProgressed)
		);

		updateElementWithClass("time-progressed", (element: HTMLElement) => {
			element.innerHTML = readableTime;
		});
	}

	//MARK: Playback Functions

	function playPause() {
		if (player.current!.paused) {
			player.current!.play();
		} else {
			player.current!.pause();
		}
	}

	function skipBack() {
		if (currentPlaybackObject.track) {
			if (player.current!.currentTime > 3) {
				player.current!.currentTime = 0;
			} else {
				const previousSongIndex = getCurrentQueuePosition() - 1;

				const previousPlaybackObject = queue[previousSongIndex];

				if (previousPlaybackObject) {
					checkAndSetCurrentPlaybackObject(previousPlaybackObject);
				} else {
					player.current!.currentTime = 0;
				}
			}
		}
	}

	function skip() {
		if (currentPlaybackObject.track) {
			
			const nextSongIndex = getCurrentQueuePosition() + 1;

			if (queue.length < nextSongIndex) {

				const nextPlaybackObject = queue[nextSongIndex];

				checkAndSetCurrentPlaybackObject(nextPlaybackObject);
			} else {
				goToFirstSong();
			}
		}
	}

	function goToFirstSong() {
		document.title = "Octave";
		setShouldPlay(false);
		console.log("go to first song ran and should play set to false");
		checkAndSetCurrentPlaybackObject(queue[0]);
		player.current!.currentTime = 0;
	}

	function addToQueue(track: Track) {
		notificationModel.add(
			new NotificationObject(`Adding "${track.title}" to queue...`)
		);

		trackModel
			.getPlaybackObjectFromTrack(track) //has no position
			.then((playbackObject) => {
				let newQueue = [...queue];
				newQueue.splice(getCurrentQueuePosition() + 1, 0, playbackObject); //TODO set new playbackobject positoion

				setQueue(newQueue);
				console.log({newQueue});

				notificationModel.add(
					new NotificationObject(
						`"${track.title}" added to queue`,
						"This song will play next",
						"collection success"
					)
				);
			})
			.catch((err) => {
				console.log("error adding to queue:" + err);
				notificationModel.add(
					new NotificationObject(
						`Couldn't add "${track.title}" to queue`,
						err,
						"collection error"
					)
				);
			});
	}

	function toggleShuffling() {
		console.log({queue});

		if (shuffling === true) {
			console.log("turning off shuffle");

			//sort the array using the positions of all the songs
			//a position property on a playback object is the position in it's context (the order in the playlist or album)

			let sortedQueue = [...queue];

			sortedQueue.sort((firstPlaybackObject, secondPlaybackObject) => {
				return firstPlaybackObject.position! - secondPlaybackObject.position!;
			});

			console.log({sortedQueue})

			setQueue(sortedQueue);
			setShuffling(false);
		} else {
			console.log("turning on shuffle");

			//shuffle the objects in the queue and then set it to the shuffled queue

			let currentQueuePosition = getCurrentQueuePosition()
			const revervsedCurrentQueuePosition = (queue.length - 1) - currentQueuePosition
			console.log({currentQueuePosition})
			

			let objectsAfterCurrent = [...queue]
			objectsAfterCurrent.reverse()
			console.log({objectsAfterCurrent})
			objectsAfterCurrent.splice(revervsedCurrentQueuePosition, queue.length)
			console.log({objectsAfterCurrent})
			objectsAfterCurrent.reverse()
			console.log({objectsAfterCurrent})

			const shuffledObjectsAfterCurrent = shuffleObjects(objectsAfterCurrent)

			let currentAndObjectsBeforeCurrent = [...queue]
			currentAndObjectsBeforeCurrent.splice(currentQueuePosition + 1, queue.length)

			let shuffledQueue = [
				...currentAndObjectsBeforeCurrent,
				...shuffledObjectsAfterCurrent
			]

			console.log({shuffledQueue})

			setQueue(shuffledQueue);
			setShuffling(true);
		}
	}

	//MARK: Misc

	function getPositionInQueue(playbackObject: PlaybackObject) {
		let i;
		for (i = 0; i < queue.length; i++) {
			let loopPlaybackOjbect = queue[i];

			if (playbackObject.guid === loopPlaybackOjbect.guid) {
				return i;
			}
		}

		return -1;
	}

	function checkAndSetCurrentPlaybackObject(playbackObject: PlaybackObject) {

		if (playbackObject.isExpired) {

			prepareForNewSong()

			playTrack(playbackObject.track!, playbackObject.position, playbackObject.guid)
			.then(newPlaybackObject => {
				//update the queue to reflect the change

				console.log({queue});

				let positionInQueue = getPositionInQueue(playbackObject)
				let newQueue = [...queue]

				newQueue[positionInQueue] = newPlaybackObject

				setQueue(newQueue)

				console.log({newQueue})

			})
		} else {
			setCurrentPlaybackObject(playbackObject)
		}
	}

	function getCurrentQueuePosition(): number {
		for (let i = 0; i < queue.length; i++) {
			const playbackObject = queue[i];

			if (playbackObject.guid === currentPlaybackObject.guid) {
				return i;
			}
		}

		console.error("couldn't find the current playback object")
		return queue.length - 1


	}

	function prepareForNewSong(shouldEmptyQueue: boolean = false) {
		console.log("prepare for new song and was set to true");
		document.title = "Octave"; //FIXME i'm pretty sure next.js has like a custom metadata thing you can do instead

		if (shouldEmptyQueue === true) {
			setQueue([]);
		}
		
		player.current!.pause();

		setShouldPlay(true);

		checkAndSetCurrentPlaybackObject(
			new PlaybackObject(
				new Track(
					"Loading...",
					"",
					"",
					"",
					"",
					"",
					"",
					placeholder.getPlaceholder(),
					0,
					"",
					[]
					
				)
			)
		);
	}

	function getTotalTime() {
		if (currentPlaybackObject.track) {
			const readableTime = trackModel.convertSecondsToReadableTime(
				currentPlaybackObject.track.duration
			);

			return readableTime;
		} else {
			return "0:00";
		}
	}

	//MARK: Helper functions

	function updateElementWithClass(className:string, updaterFunction: (arg0:any) => (any)) {
		const elements = document.getElementsByClassName(className);

		for (let i = 0; i < elements.length; i++) {
			updaterFunction(elements[i]);
		}
	}

	function playTrack(track: Track, position?: number, guid?: string): Promise<PlaybackObject> {

		return new Promise((resolve, reject) =>  {

			if (currentPlaybackObject) {
				if (currentPlaybackObject?.track?.id !== track.id) {
					prepareForNewSong();
				}
			} else {
				prepareForNewSong();
			}

			trackModel
				.getPlaybackObjectFromTrack(track)
				.then((playbackObject) => {
					
					if (currentPlaybackObject.track?.id === playbackObject.track?.id) {
						setShouldPlay(false);
						player.current!.currentTime = 0;
					}
					 //TODO check if this is what you acutally wnant

					if (position) {playbackObject.position = position}
					if (guid) {playbackObject.guid = guid}

					setCurrentPlaybackObject(playbackObject);

					resolve(playbackObject)
					
				})
				.catch((err) => {
					console.log("error playing song:", err);

					if (err === "Not Found") {
						notificationModel.add(
							new NotificationObject(
								"Not Found",
								`Sorry, ${track.title} could not be found on our servers (404)`,
								"error"
							)
						);
					}

					reject("error playing song: " + err);
				});
		})
	}

	function shuffleObjects(unshuffledObjects: any[]): any[] {
		let shuffledObjects = [...unshuffledObjects];

		let lastIndex = shuffledObjects.length - 1;

		while (lastIndex > 0) {
			const randomIndex = Math.floor(Math.random() * lastIndex);

			const temp = shuffledObjects[lastIndex];
			shuffledObjects[lastIndex] = shuffledObjects[randomIndex];
			shuffledObjects[randomIndex] = temp;

			lastIndex--;
		}

		return shuffledObjects;
	}

	return {
		prepareForNewSong,
		addToQueue,
		handlePlaying,
		skip,
		skipBack,
		playPause,
		handleUpdate,
		handleEnded,
		handlePause,
		getTotalTime,
		playTrack,
		shuffleObjects,
		toggleShuffling,
		getCurrentQueuePosition,
		checkAndSetCurrentPlaybackObject,
		getPositionInQueue,
	};
}
//TODO: make sure that when a playbackObject expires and it is given a new one, it has the same guid.
//	you can test this by seeing if it shows up as it's position in timelineView
