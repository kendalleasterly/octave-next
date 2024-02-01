import { useRecoilValue } from "recoil"
import { db } from "../Global/firebase"
import { accountAtom } from "./AccountModel"
import { NotificationObject, useNotificationModel } from "./NotificationModel"
import { useSpotifyModel } from "./SpotifyModel"
import { useTrackModel } from "../Models/TrackModel"
import { PlaylistTrack, SimplePlaylist, Track } from "../Models/typedefs"
import { Timestamp, addDoc, arrayRemove, arrayUnion, collection, deleteField, doc, getDoc, runTransaction, serverTimestamp, writeBatch } from "firebase/firestore"

export class Playlist {
	constructor(
		public createTime: Date,
		public description: string,
		public tracks: Track[],
		public isVisible: boolean,
		public lastUpdatedTime: Date,
		public ownerName: string,
		public ownerUID: string,
		public trackIDs: {[key: string]:Date},
		public title: string,
		public id: string
	) {}
}

export function usePlaylistModel() {
	const account = useRecoilValue(accountAtom)
	const notificationModel = useNotificationModel()
	const trackModel = useTrackModel()
	const spotifyModel = useSpotifyModel()

	function getPlaylist(id: string): Promise<Playlist> {
		return new Promise((resolve, reject) => {
			getDoc(doc(db, "playlists", id))
				.then((doc) => {
					const data = doc.data() as any

					const createTime = data.createTime.toDate()
					const lastUpdatedTime = data.lastUpdatedTime.toDate()

					let tracks: PlaylistTrack[] = []

					Object.values(data.firstTwentySongs).map((value) => {
						const track = value as PlaylistTrack //doesn't have dateAdded until the next statement

						tracks.push({
							...track,
							dateAdded: data.trackIDs[track.id].toDate(),
						})
					})

					tracks.sort((a, b) => {
						return a.dateAdded.getTime() - b.dateAdded.getTime()
					})

					const playlist = new Playlist(
						createTime,
						data.description,
						tracks,
						data.isVisible,
						lastUpdatedTime,
						data.ownerName,
						data.ownerUID,
						data.trackIDs,
						data.title,
						doc.id
					)

					resolve(playlist)
				})
				.catch((error) => {
					console.log(error)

					if (error.code === "permission-denied") {
						notificationModel.add(
							new NotificationObject(
								"Permission Denied",
								"You don't have access to this playlist",
								"error"
							)
						)

						reject(error.message)
					} else {
						notificationModel.add(
							new NotificationObject(
								"Error Getting Playlist",
								"Sorry, there was an error getting this playlist",
								"error"
							)
						)
						reject(error.message)
					}
				})
		})
	}

	function createPlaylist(description: string, isVisible: boolean, title: string) {
		if (title === "") {
			notificationModel.add(
				new NotificationObject(
					"Please add a title",
					"Playlists must have titles",
					"error"
				)
			)
		}

		const batch = writeBatch(db)

		const newPlaylistRef = doc(collection(db, "playlists"))

		batch.set(newPlaylistRef, {
			createTime: serverTimestamp(),
			description: description,
			firstTwentySongs: [],
			isVisible: isVisible,
			lastUpdatedTime: serverTimestamp(),
			ownerName: account.name,
			ownerUID: account.uid,
			trackIDs: {},
			title: title,
		})

		const accountRef = doc(db, "playlists", account.uid)

		batch.update(accountRef, {
			simplePlaylists: arrayUnion({
				id: newPlaylistRef.id,
				title: title,
			}),
		}) //TEST

		batch
			.commit()
			.then(() => {
				notificationModel.add(
					new NotificationObject(
						`"${title}" added`,
						`Your new playlist "${title}" was created"`,
						"success"
					)
				)
			})
			.catch((err) => {
				console.log("error creating playlist:", err)

				notificationModel.add(
					new NotificationObject(
						`"${title}" not added`,
						`Sorry, there was an error creating "${title}"`,
						"error"
					)
				)
			})
	}

	function addToPlaylist(rawTrack: Track, playlist: SimplePlaylist) {
		const track = JSON.parse(JSON.stringify(rawTrack))
		delete track.dateAdded

		console.log("adding", track.title, "to", playlist.id, track)

		notificationModel.add(
			new NotificationObject(
				`Adding ${track.title}`,
				`Adding ${track.title} to playlist "${playlist.title}"`
			)
		)

		const playlistRef = doc(db, "playlists", playlist.id)


		
		// use transaction because we need to updated based off firstTwentySongs
		return runTransaction(db, (transaction) => {
				
				return transaction.get(playlistRef).then((playlistDoc) => {
					const docData: any = playlistDoc.data()

					const timeStamp = serverTimestamp()

					let updatedPlaylistData:any = {}

					updatedPlaylistData["lastUpdatedTime"] = timeStamp
					updatedPlaylistData["trackIDs." + track.id] = timeStamp
					

					if (Object.values(docData.firstTwentySongs).length < 20) {
						updatedPlaylistData["firstTwentySongs"] = arrayUnion(track)
					}

					transaction.update(playlistRef, updatedPlaylistData)
				})
			})
			.then(() => {
				notificationModel.add(
					new NotificationObject(
						`${track.title} added`,
						`${track.title} was added to playlist "${playlist.title}"`,
						"success"
					)
				)

				trackModel.addTrackToDatabase(track).catch((error:any) => {
					if (error.response) {
						if (error.response.status !== 409) {
							console.log("error adding song file to database", error)
						}
					} else {
						console.log("error adding song file to database", error)
					}
				})
			})
			.catch((error) => {
				console.log("error adding song to playlist:", error)
				notificationModel.add(
					new NotificationObject(
						`${track.title} couldn't be added`,
						`there was an issue adding ${track.title} to the playlist "${playlist.title}"`,
						"error"
					)
				)
			})
	}

	function deleteFromPlaylist(playlist: Playlist, rawTrack: Track) {
		const track = JSON.parse(JSON.stringify(rawTrack))
		delete track.dateAdded

		const playlistRef = doc(db, "playlists", playlist.id)


		return runTransaction(db, (transaction) => {
				return transaction.get(playlistRef).then((playlistDoc) => {
					const data:any = playlistDoc.data()

					let isInFirstTwenty = false

					data.firstTwentySongs.map((firstTrack: any) => {
						if (firstTrack.id === track.id) isInFirstTwenty = true
					})

					console.log({ isInFirstTwenty })

					let updateData:any = {}

					if (isInFirstTwenty) {
						updateData["firstTwentySongs"] = arrayRemove(track)
					}

					updateData["trackIDs." + track.id] = deleteField()
					updateData["lastUpdatedTime"] = serverTimestamp()

					transaction.update(playlistRef, updateData)
				})
			})
			.then(() => {
				new NotificationObject(
					`${track.title} removed`,
					`${track.title} was removed from playlist "${playlist.title}"`,
					"success"
				)
			})
			.catch((error) => {
				console.log(error.message, error.code)

				if (error.code === "permission-denied") {
					notificationModel.add(
						new NotificationObject(
							`${track.title} couldn't be removed`,
							`You don't have permission to edit the playlist "${playlist.title}"`,
							"error"
						)
					)
				} else {
					notificationModel.add(
						new NotificationObject(
							`${track.title} couldn't be removed`,
							`there was an issue removing ${track.title} from the playlist "${playlist.title}"`,
							"error"
						)
					)
				}
			})
	}

	function getNextTracks(playlist: Playlist): Promise<Playlist> {
		console.log({ playlist })

		return new Promise((resolve, reject) => {
			//get a list of the song ids that haven't been retrieved

			let retrievedTrackIDs:string[] = playlist.tracks.map((track) => {
				return track.id
			}) //TEST

			let remainingTrackIDs: string[] = []

			Object.keys(playlist.trackIDs).map((trackID) => {
				if (!retrievedTrackIDs.includes(trackID)) {remainingTrackIDs.push(trackID)}
			})

			remainingTrackIDs.sort((a, b) => {
				return playlist.trackIDs[a].getTime() - playlist.trackIDs[b].getTime()
			})

			remainingTrackIDs = remainingTrackIDs.slice(0, 30)

			spotifyModel
				.getTracksFromSongIDs(remainingTrackIDs, true)
				.then((newTracks) => {
					let tracks = [...playlist.tracks, ...newTracks]

					tracks.sort((a, b) => {
						return (
							playlist.trackIDs[a.id].getTime() -
							playlist.trackIDs[b.id].getTime()
						)
					})

					const newPlaylist = {
						...playlist,
						tracks,
					}

					resolve(newPlaylist)
				})
				.catch()
		})
	}

	// function getNextThirtyTracks(playlist) {
	// 	return new Promise((resolve, reject) => {
	// 		const tracks = playlist.tracks

	// 		if (tracks.length != playlist.songIDs.length) {
	// 			let retrievedTrackIDs = [] //in order
	// 			tracks.forEach((track) => {
	// 				retrievedTrackIDs.push(track.id)
	// 			})

	// 			db
	// 				.collection("playlists")
	// 				.doc(playlist.id)
	// 				.collection("songs")
	// 				.orderBy("dateAdded")
	// 				.startAfter(tracks[tracks.length - 1].dateAdded)
	// 				.limit(30)
	// 				.get()
	// 				.then((trackDocs) => {
	// 					let newTracks = []

	// 					trackDocs.forEach((trackDoc) => {
	// 						const data = trackDoc.data()

	// 						newTracks.push({
	// 							...data,
	// 							dateAdded: data.dateAdded.toDate(),
	// 						})
	// 					})

	// 					newTracks.sort((a, b) => {
	// 						return a.dateAdded - b.dateAdded
	// 					})

	// 					playlist.tracks = [...tracks, ...newTracks]

	// 					resolve(playlist)
	// 				})
	// 				.catch((err) => {
	// 					console.log("error getting paginated tracks", err)
	// 				})
	// 		}
	// 	})
	// }

	return {
		getPlaylist,
		addToPlaylist,
		createPlaylist,
		deleteFromPlaylist,
		getNextTracks,
	}
}
