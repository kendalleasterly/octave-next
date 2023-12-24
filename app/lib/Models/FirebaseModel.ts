// import { Track } from "./Spotify"

// export function getSongs(ref) {
// 	return new Promise((resolve, reject) => {

// 		ref
// 			.limit(50)
// 			.get()
// 			.then((documentSnapshots) => {
// 				let trackArray = []

// 				documentSnapshots.forEach((doc) => {
// 					const data = doc.data()

// 					const track = new Track(
// 						data.title,
// 						data.artist,
// 						data.album,
// 						data.track,
// 						data.date,
// 						doc.id,
// 						data.artwork,
// 						data.thumbnail,
// 						data.duration
// 					)

// 					trackArray.push(track)
// 				})

// 				// const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1]

// 				resolve(trackArray)
// 			})
// 	})
// }

// getNextSongs(lastVisible)
