"use client"

import React, { useEffect, useRef, useState } from "react"
import { useRecoilValue, useSetRecoilState } from "recoil"
import {
	headerTextAtom,
	isDarkAtom,
	queueAtom,
	shufflingAtom,
} from "../../Global/atoms"
import ButtonComponent from "../../Components/ButtonComponent"
import Song from "../../Components/Song"
import { PlaybackObject, Track } from "@/app/Models/typedefs"
import { usePlaybackModel } from "../../Models/PlaybackModel"
import { useTrackModel } from "../../Models/TrackModel"
import { usePlaylistModel, Playlist } from "../../Models/PlaylistModel"
import PlaceholderLargeDark from "@/public/Images/placeholder-large-dark.svg"
import PlaceholderLargeLight from "@/public/Images/placeholder-large-light.svg"
import { db } from "../../Global/firebase"
import RemoteImage from "@/app/Components/RemoteImage"
import { usePlaceholder } from "@/app/Components/Placeholder"
import { doc, getDoc } from "firebase/firestore"

function PlaylistView({ params }: { params: { playlistID: string } }) {
	const setHeaderText = useSetRecoilState(headerTextAtom)
	const setQueue = useSetRecoilState(queueAtom)
	const setShuffling = useSetRecoilState(shufflingAtom)
	const isDark = useRecoilValue(isDarkAtom)
	const [playlist, setPlaylist] = useState<Playlist | undefined>(undefined)
	const [tracks, setTracks] = useState<Track[]>([])
	const bottomEl = useRef()
	const [offsets, setOffsets] = useState(0)

	const { playlistID } = params

	const trackModel = useTrackModel()
	const playlistModel = usePlaylistModel()
	const { prepareForNewSong, shuffleObjects } = usePlaybackModel()

	// const observer = useRef(
	// 	new IntersectionObserver((entries) => {
	// 		const first = entries[0]

	// 		if (first.isIntersecting) {
	// 			console.log("was intersecting")
	// 			setOffsets((num) => num + 1)
	// 		}
	// 	})
	// )

	// useEffect(() => {
	// 	const currentElement = bottomEl
	// 	const currentObserver = observer.current

	// 	if (currentElement) {
	// 		console.log("observing")
	// 		currentObserver.observe(currentElement)
	// 	}

	// 	return () => {
	// 		if (currentElement) {
	// 			console.log("unobserving")
	// 			currentObserver.unobserve(currentElement)
	// 		}
	// 	}
	// }, [bottomEl])

	useEffect(() => {
		loadMoreTracks()
	}, [offsets])

	function loadMoreTracks() {
		if (
			playlist &&
			playlist.trackIDs != null &&
			playlist.tracks.length !== Object.keys(playlist.trackIDs).length
		) {
			playlistModel
				.getNextTracks(playlist)
				.then((newPlaylist) => {
					setPlaylist(newPlaylist)
					setTracks(newPlaylist.tracks)
				})
				.catch((error) => {
					console.log("error getting next thirty tracks", error)
				})
		}
	}

	useEffect(() => {
		setHeaderText("")

		if (playlistID != "") {
			fetchAndSetPlaylist()
		}
	}, [playlistID])

	async function fetchAndSetPlaylist() {
		//get the playlist
		const fetchedPlaylist = await playlistModel.getPlaylist(playlistID)
		setPlaylist(fetchedPlaylist)
		setTracks(fetchedPlaylist.tracks)
	}

	function getRelativeDate(date: Date) {
		const now = new Date()
		const startOfToday = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate()
		).getTime()
		const startOfDate = new Date(
			date.getFullYear(),
			date.getMonth(),
			date.getDate()
		).getTime()

		const distance = startOfToday - startOfDate
		const distanceInDays = distance / (1000 * 60 * 60 * 24)

		if (distanceInDays <= 0) {
			return "Today"
		} else if (distanceInDays === 1) {
			return "Yesterday"
		} else if (distanceInDays <= 7) {
			const weekdays = [
				"Sunday",
				"Monday",
				"Tuesday",
				"Wednesday",
				"Thursday",
				"Friday",
				"Saturday",
			]

			return weekdays[date.getDay()]
		} else {
			return `${date.getMonth() + 1}/${date.getDate()}/${
				date.getFullYear() - 2000
			}`
		}
	}

	function getTrackFromIdsWithPositions(
		songIdWithPosition: { object: string; position: number },
		firstTwentyIDs: string[]
	): Promise<Track> {
		//use various sources of data (songs at the top of the file, local storage, and the firebase in that order)
		//firebase is the last resort since its the most expensive, using a variable being the first because it is the least expensive
		//this will be in the form of a promise because it might involve a network request

		//the nature of this will pretty much be in the form of an if if else else chain.
		//	if the id is in the array of keys for the playlist.songs
		//	else if the value we try to get from localstorage is nil
		//	else just get it from the playlist.collection("songs")

		return new Promise((resolve, reject) => {
			let LSTrack = localStorage.getItem(songIdWithPosition.object)

			if (firstTwentyIDs.includes(songIdWithPosition.object)) {
				const track = playlist!.tracks[songIdWithPosition.position]

				resolve(track)
			} else if (LSTrack) {
				const track = JSON.parse(LSTrack)

				resolve(track)
			} else {
				const docRef = doc(db, "songs", playlist!.id)
				getDoc(docRef).then((doc) => {
					if (doc.exists()) {
						const data = doc.data()
						const track = new Track(
							data.title,
							data.artist,
							data.album,
							data.track,
							data.date,
							data.id,
							data.artwork,
							data.thumbnail,
							data.duration,
							data.albumID,
                            data.artistObjects
						)

						localStorage.setItem(
							songIdWithPosition.object,
							JSON.stringify(track)
						)

						resolve(track)
					}
				})
			}
		})
	}

	function fabricatePlaybackObjects(
		tracksWithPositions: { object: Track; position: number }[]
	) {
		let playbackObjects: PlaybackObject[] = []

		tracksWithPositions.forEach((trackWithPosition) => {
			let playbackObject = new PlaybackObject(
				trackWithPosition.object,
				undefined,
				0, //this way the "fabricated" playback object will always be expired
				trackWithPosition.position
			)

			playbackObjects.push(playbackObject)
		})

		return playbackObjects
	}

	function playArrayOfIDsWithPositions(
		songIDsWithPositions: { object: string; position: number }[],
		isShuffled: boolean
	) {
		let errors = 0

		let songIDs: string[] = []

		songIDsWithPositions.forEach((songIDWithPosition) => {
			let songID = songIDWithPosition.object
			songIDs.push(songID)
		})

		const maxSongs = songIDs.length <= 50 ? songIDs.length : 50
		console.log({ maxSongs })

		//call getTrackFromID for every single id

		let tracksWithPositions: { object: Track; position: number }[] = []

		function checkForFinish() {
			if (tracksWithPositions.length === maxSongs - errors) {
				console.log("did finish the last one")

				//once you have an array of tracks, sort it using the songIDs.indexOf(first.id) - songIDs.indexOf(second.id)
				tracksWithPositions.sort(
					(firstTrackWithPosition, secondTrackWithPosition) => {
						return (
							songIDs.indexOf(firstTrackWithPosition.object.id) -
							songIDs.indexOf(secondTrackWithPosition.object.id)
						)
					}
				)

				//after assigning all of the tracks positions, get the first ten by splicing the sortedTracksWithPositionsArray.

				const firstTenTracksWithPositions = [...tracksWithPositions]
				firstTenTracksWithPositions.splice(10, tracksWithPositions.length)

				//put those first ten into trackModel.playCollection(sortedTracksWithPositionsArray)

				console.log({ firstTenTracksWithPositions })
				trackModel
					.playCollection(firstTenTracksWithPositions, isShuffled)
					.then((unsortedFirstTenPlaybackObjects) => {
						//once you get the queue of those first ten playbackObjects, get everything after the first ten in the sortedTracksWithPositionsArray

						let firstTenPlaybackObjects = [...unsortedFirstTenPlaybackObjects]
						firstTenPlaybackObjects.sort(
							(firstPlaybackObject, secondPlaybackObject) => {
								return (
									songIDs.indexOf(firstPlaybackObject.track!.id) -
									songIDs.indexOf(secondPlaybackObject.track!.id)
								)
							}
						)

						console.log({ firstTenPlaybackObjects })

						let remainingTracksWithPositions = [...tracksWithPositions]

						remainingTracksWithPositions.reverse()
						remainingTracksWithPositions.splice(tracksWithPositions.length - 10)
						remainingTracksWithPositions.reverse()

						//put those into fabricatePlaybackObjects(tracksWithPositions: sortedTracksWithPositionsArray)
						const fabricatedPlaybackObjects = fabricatePlaybackObjects(
							remainingTracksWithPositions
						)

						//append the fabricated playbackObjects to the end of a new array with the queue of the first ten at the beginning. set that to the queue.
						let newQueue = [
							...firstTenPlaybackObjects,
							...fabricatedPlaybackObjects,
						]

						setQueue(newQueue)
						console.log({ newQueue })
					})
			}
		}

		let retrievedIDs: string[] = []

		playlist!.tracks.forEach((track) => {
			retrievedIDs.push(track.id)
		})

		let i: number

		for (i = 0; i < maxSongs; i++) {
			getTrackFromIdsWithPositions(songIDsWithPositions[i], retrievedIDs)
				.then((track) => {
					//give the track a position

					const trackWithPosition = {
						object: track,
						position: songIDsWithPositions[i].position,
					}

					tracksWithPositions.push(trackWithPosition)

					checkForFinish()
				})
				.catch((error) => {
					errors++
					console.log("error getting track from id:", error)

					checkForFinish()
				})
		}
	}

	function deleteSong(track: Track) {
		playlistModel
			.deleteFromPlaylist(playlist!, track)
			.then(() => {
				fetchAndSetPlaylist()
			})
			.catch(() => {
				fetchAndSetPlaylist()
			})
	}

	if (playlist) {
		return (
			<div id="playlist-view" className="space-y-10">
				<div className="md:flex md:space-x-6 space-y-6 md:space-y-0 md:items-center">
					<div className="w-full max-w-sm md:w-60 md:h-60 mx-auto md:mx-0 md:max-w-none">
						<PlaylistArtwork playlist={playlist} isDark={isDark}/>
					</div>
					<div className="my-auto space-y-6">
						<div className="space-y-3">
							<p className="text text-xl font-semibold text-center md:text-left">
								{playlist.title}
							</p>

							<p className="text-gray-400 font-semibold text-center md:text-left">
								{playlist.description}
							</p>

							<p className="text-gray-400 font-semibold text-center md:text-left">
								{playlist.ownerName} • Last Updated{" "}
								{getRelativeDate(playlist.lastUpdatedTime)}
							</p>
						</div>

						<div className="double-button">
							<ButtonComponent
								text="Play"
								action={() => {
									prepareForNewSong()

									const trackIDsWithPositions = trackModel.giveObjectsPositions(
										Object.keys(playlist.trackIDs)
									)

									playArrayOfIDsWithPositions(trackIDsWithPositions, false)
								}}
							/>
							<p></p>
							<ButtonComponent
								text="Shuffle"
								action={() => {
									prepareForNewSong()

									setShuffling(true)

									const trackIDsWithPositions = trackModel.giveObjectsPositions(
										Object.keys(playlist.trackIDs) //gives the track ids to this function
									)
									const shuffledTrackIDsWithPositions = shuffleObjects(
										trackIDsWithPositions
									)

									console.log({ shuffledTrackIDsWithPositions })

									playArrayOfIDsWithPositions(
										shuffledTrackIDsWithPositions,
										true
									)
								}}
							/>
						</div>
					</div>
				</div>

				<div className="space-y-8">
					{playlist.tracks.map((track, key) => {
						let trackCopy = JSON.parse(JSON.stringify(track))

						return key === playlist.tracks.length - 1 ? (
							// <div ref={setBottomEl}>
								<Song
									track={trackCopy}
									key={key}
									index={key}
									deleteFromPlaylist={() => deleteSong(trackCopy)}
								/>
							//</div>
						) : (
							<Song
								track={trackCopy}
								key={key}
								index={key}
								deleteFromPlaylist={() => deleteSong(trackCopy)}
							/>
						)
					})}
					<p className="text-gray-400 font-semibold text-center text-sm md:text-left">
						Created {getRelativeDate(playlist.createTime)}
					</p>
				</div>
			</div>
		)
	} else {
		return null
	}
}

export function PlaylistArtwork({playlist, isDark}:{playlist: Playlist, isDark: boolean}) {
	function getRoundingFromKey(key: number) {
		switch (key) {
			case 0:
				return "rounded-tl-xl"
			case 1:
				return "rounded-tr-xl"
			case 2:
				return "rounded-bl-xl"
			case 3:
				return "rounded-br-xl"
			default:
				return ""
		}
	}

	const firstUniqueArtworks = getFirstUniqueArtworks()

	console.log({firstUniqueArtworks})

	if (firstUniqueArtworks.length > 0) {
		if (firstUniqueArtworks.length == 4) {
			return (
				<div className="grid grid-cols-2 gap-0 h-full">
					{firstUniqueArtworks.map((artwork, key) => {
						return (
							<RemoteImage
								src={artwork}
								key={key}
								className=''
								imgClass={getRoundingFromKey(key)}
							/>
						)
					})}
				</div>
			)
		} else {

			return (
				<RemoteImage
					src={playlist!.tracks[0].artwork}
					imgClass="rounded-xl"
					className="h-full"
				/>
			)
		}
	} else {
		return isDark ? (
			<PlaceholderLargeLight className="rounded-xl" />
		) : (
			<PlaceholderLargeDark className="rounded-xl" />
		) //TODO: Test
	}

	function getFirstUniqueArtworks() {
		let artworks: string[] = []

		for (let track of playlist!.tracks) {
			if (!artworks.includes(track.artwork)) {
				artworks.push(track.artwork)
			}

			if (artworks.length == 4) {
				return artworks
			}
		}

		return artworks
	}
}

export default PlaylistView
