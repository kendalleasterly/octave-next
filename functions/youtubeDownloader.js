const path = require("path")
const ytdl = require("ytdl-core")
const ffmpeg = require("fluent-ffmpeg")
const ffmetadata = require("ffmetadata")
const ytsr = require("ytsr")
const fs = require("fs")
const request = require("request")

const firebase = require("./firebase")
const heroku = require("./heroku")
const { logger } = require("firebase-functions/v1")

function searchForVideo(term) {
	return new Promise((resolve, reject) => {
		ytsr(term, {
			limit: 10,
		})
			.then((results) => {
				resolve(results.items)
			})
			.catch((err) => {
				console.log("error getting serach results", err)
				reject(err)
			})
	})
}

function downloadPicture(link) {
	const fileName = String(Date.now() + ".jpeg")

	return new Promise((resolve, reject) => {
		request.head(link, (err, res, body) => {
			if (err) {
				console.log("error getting ready to download artowrk:", err)
				reject("error downloading artwork" + err)
				return
			}

			request(link)
				.pipe(fs.createWriteStream(fileName))
				.on("close", () => {
					resolve(path.resolve(fileName))
				})
				.on("error", (error) => {
					console.log("error downloading artwork", error)
					reject("error downloading artwork" + error)
				})
		})
	})
}

// function downloadVideoOld(id, didFail) {
// 	return new Promise((resolve, reject) => {
// 		const url = `http://www.youtube.com/watch?v=${id}`

// 		const fileName = Date.now() + ".m4a"

// 		let stream

// 		if (didFail === true) {
// 			console.log("i've already failed so I am choosing a itag 140")

// 			stream = ytdl(url, {
// 				filter: (format) => format.itag === 140,
// 			})
// 		} else {
// 			stream = ytdl(url, {
// 				format: "audio",
// 				quality: "highest",
// 			})
// 		}

// 		ffmpeg({ source: stream })
// 			.format("mp4")
// 			.saveToFile(fileName)
// 			.on("error", (err, stdout, stderr) => {
// 				if (didFail === true) {
// 					console.log("we've already failed so imma just reject")
// 					reject(err)
// 				} else {
// 					downloadVideo(id, true).then((filePath) => {
// 						resolve(filePath)
// 					})
// 				}
// 			})
// 			.on("end", () => {
// 				resolve(path.resolve(fileName))
// 			})
// 	})
// }

function downloadVideo(id, didFail) {
	return new Promise((resolve, reject) => {

		logger.log("downloading video with", id, didFail)

		const url = `http://www.youtube.com/watch?v=${id}`

		logger.log("url", url)

		const fileName = Date.now() + ".m4a"

		logger.log("file name", fileName)

		let stream

		if (didFail === true) {
			logger.log("i've already failed so I am choosing a itag 140")

			stream = ytdl(url, {
				filter: (format) => format.itag === 140,
			})
			//ffmpeg convert you should try 251
		} else {

			logger.log("initialized stream")

			stream = ytdl(url, { quality: 140 })

			logger.log("created stream!")
		}

		if (!stream) {
			reject("the stream could not be defined, so I'm going to restart")
			heroku.restartDyno("the stream could not be defined, so I'm going to restart")
			return
		} 


		// ffmpeg(stream)
		// .saveToFile(fileName)
		// .on("error", (err) => {
		// 	if (didFail === true) {
		// 		console.log("we've already failed so imma just reject")
		// 		reject(err)

		// 	} else {

		// 		downloadVideo(id, true)
		// 		.then((filePath) => {
		// 			resolve(filePath)
		// 		})
		// 		.catch(err => {
		// 			console.log("error downloading video the second time:", err)
		// 		})
		// 	}
		// })
		// .on("end", () => {
		// 	resolve(path.resolve(fileName))
		// })

		logger.log("about to pipe")

		stream.pipe(
			fs
				.createWriteStream(fileName)
				.on("error", () => {
					logger.log("we got an error writing the stream")
					if (didFail === true) {
						logger.log("we've already failed so imma just reject")
						reject(err)
					} else {

						logger.log("first time failing, trying again!")

						downloadVideo(id, true)
							.then((filePath) => {
								logger.log("resolved the second time")
								resolve(filePath)
							})
							.catch((err) => {
								logger.log("error downloading video the second time:", err)
								heroku.restartDyno("there was an error downloading " + id + " the second time: " + err)
							})
					}
				})
				.on("finish", () => {
					// logger.log("finished, tyring to resolve with fileName", fileName)

					//TODO: check if the file just is somewhere else

					const resolved = path.resolve(fileName)

					logger.log("resolved filePath:", resolved)

					resolve(path.resolve(fileName))
				})
		)
	})
}

// function downloadVideoWithMetadataOld(songInfo) {
// 	return new Promise(async (resolve, reject) => {
// 		const searchTerm = `${songInfo.artist} - ${songInfo.title}`

// 		const results = await searchForVideo(searchTerm)

// 		//if it's a video
// 		//if it is within 4 seconds on either side
// 		//if the title and artist do not CONTAIN live and the search result title doesn't either

// 		let id

// 		results.forEach((result) => {
// 			result.title

// 			if (result.type === "video" && !result.badges.includes("LIVE NOW")) {
// 				const ytSearchResult = new YTSearchResult(result)

// 				if (
// 					!id &&
// 					songInfo.duration - 4 <= ytSearchResult.duration &&
// 					ytSearchResult.duration <= songInfo.duration + 4
// 				) {
// 					//if neither the name nor the artist include live, but the title still does, then return
// 					if (
// 						!songInfo.title.toLowerCase().includes("live") &&
// 						!songInfo.artist.toLowerCase().includes("live") &&
// 						ytSearchResult.title.toLowerCase().includes("live")
// 					) {
// 						return
// 					}

// 					id = ytSearchResult.id
// 					console.log(
// 						"I liked",
// 						ytSearchResult.title,
// 						"at",
// 						ytSearchResult.duration,
// 						ytSearchResult.id
// 					)
// 				}
// 			}
// 		})

// 		if (!id) {
// 			reject("This song file could not be found on our servers.")
// 			return
// 		}

// 		downloadVideo(id).then((filePath) => {
// 			//download the thumbnail

// 			downloadPicture(songInfo.artwork).then((picturePath) => {
// 				const options = {
// 					attachments: [picturePath],
// 				}

// 				const metadata = {
// 					title: songInfo.title,
// 					artist: songInfo.artist,
// 					album: songInfo.album,
// 					track: songInfo.track,
// 					date: songInfo.date,
// 					disc: songInfo.disc,
// 				}

// 				ffmetadata.write(filePath, metadata, options, (err) => {
// 					if (err) {
// 						console.log("error writing to metadata:", err)
// 						reject(err)
// 					} else {
// 						fs.unlinkSync(picturePath)

// 						resolve([filePath, id])
// 					}
// 				})
// 			})
// 		})
// 	})
// }

function downloadVideoWithMetadata(songInfo, sender) {
	return new Promise(async (resolve, reject) => {
		const searchTerm = `${songInfo.artist} - ${songInfo.title}`

		const results = await searchForVideo(searchTerm).catch((err) =>
			console.log("error searching for video:", err)
		)

		//if it's a video
		//if it is within 4 seconds on either side
		//if the title and artist do not CONTAIN live and the search result title doesn't either

		let ytid

		results.forEach((result) => {
			result.title

			if (result.type === "video" && !result.badges.includes("LIVE NOW")) {
				const ytSearchResult = new YTSearchResult(result)

				if (
					!ytid &&
					songInfo.duration - 4 <= ytSearchResult.duration &&
					ytSearchResult.duration <= songInfo.duration + 4
				) {
					//if neither the name nor the artist include live, but the title still does, then return
					if (
						!songInfo.title.toLowerCase().includes("live") &&
						!songInfo.artist.toLowerCase().includes("live") &&
						ytSearchResult.title.toLowerCase().includes("live")
					) {
						return
					}

					ytid = ytSearchResult.id
					console.log(
						"I liked",
						ytSearchResult.title,
						"at",
						ytSearchResult.duration,
						ytSearchResult.id
					)
				}
			}
		})

		if (!ytid) {
			const error = new Error('"This song file could not be found on our servers.')
			error.name = ("404")

			firebase.reportMissing(songInfo, sender)

			reject(error)
			return
		}

		console.log("about to download the video")

		downloadVideo(ytid)
			.then((filePath) => {
				resolve([filePath, ytid])
			})
			.catch((err) => {
				console.log("error downloading video:", err)
				reject(err)
			})
	})
}

function getVideoInfo(link) {
	return new Promise(async (resolve, reject) => {
		ytdl
			.getInfo(link)
			.then((info) => {
				resolve(info)
			})
			.catch((err) => {
				reject(err)
			})
	})
}

class YTSearchResult {
	constructor(result) {
		this.title = result.title
		this.id = result.id

		let seconds = 0

		if (result.duration != null) {
			const durationSplit = result.duration.split(":")
			const minutes = Number(durationSplit[0])
			seconds = Number(durationSplit[1])

			seconds = minutes * 60 + seconds
		}

		this.duration = seconds
	}
}

module.exports = {
	downloadVideo,
	searchForVideo,
	downloadVideoWithMetadata,
	downloadPicture,
	getVideoInfo,
}
