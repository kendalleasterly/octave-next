const express = require("express")
const dotenv = require("dotenv")
const fs = require("fs")
const ytdl = require("ytdl-core")
const cors = require("cors")
const Joi = require("joi")

const youtubeDownloader = require("./youtubeDownloader")
const spotify = require("./spotify")
const firebase = require("./firebase")
const onedrive = require("./onedrive")
const { logger } = require("firebase-functions/v1")

const router = express.Router()
router.use(express.json())

dotenv.config()

const corsOptions = {
	exposedHeaders: "Type",
	origin: (origin, callback) => {
		// if (process.env.CORS_ALLOWED_ORIGINS.split(" ").includes(origin)) {
			callback(null, true)
		// } else {
		// 	callback("cors blocked origin: " + origin, false)
		// }
	}
}

router.use(cors(corsOptions))

router.use((req, res, next) => {
	if (req.url.includes("metadata")) {
		const trackSchema = Joi.object({
			title: Joi.string().required(),
			artist: Joi.string().required(),
			album: Joi.string().required(),
			track: Joi.string().required(),
			date: Joi.string().required(),
			id: Joi.string().required(),
			artwork: Joi.string().required(),
			thumbnail: Joi.string().required(),
			duration: Joi.number().required(),
			albumID: Joi.string().required(),
			artistObjects: Joi.array().required(),
		})

		const result = trackSchema.validate(req.body)

		if (result.error) {
			res.status(400).send(result.error.message)
		} else {
			console.log(req.body.title, req.body.id)
			next()
		}
	} else {
		next()
	}
})

router.post("/id-download", (req, res) => {
	const id = req.body.id
	console.log(req.body)

	//validate the id first
	if (id) {
		if (!ytdl.validateID(id)) {
			res.status(400).send("must provide valid id")
			return
		}
	} else {
		res.status(400).send("request body must include id")
		return
	}

	youtubeDownloader
		.downloadVideo(id)
		.then((songPath) => {

			res.sendFile(songPath, (err) => {
				if (err) {
					logger.error("error downloading to response was:", err)
				} else {
					console.log("sending file!", songPath)
				}

				fs.unlinkSync(songPath)
			})
		})
		.catch((err) => {
			console.log("the error doing all that was", err)
			res.status(500).send(err)
		})
})

router.post("/search", (req, res) => {
	const term = req.body.term

	if (!term) {
		res.status(400).send("must provide 'term'")
		return
	}

	youtubeDownloader
		.searchForVideo(term)
		.then((results) => {
			res.status(200).send(results)
		})
		.catch((err) => {
			res.status(500).send(err)
		})
})

router.post("/search-download", (req, res) => {
	const searchTerm = req.body.term

	youtubeDownloader
		.searchForVideo(searchTerm)
		.then((results) => {
			let id

			results.forEach((item) => {
				if (item.type === "video" && !id) {
					id = item.id
				}
			})

			youtubeDownloader
				.downloadVideo(id)
				.then((songPath) => {
					res.sendFile(songPath, (err) => {
						if (err) {
							console.log("error downloading to response was:", err)
						} else {
							console.log("sent file!")
						}

						fs.unlinkSync(songPath)
					})
				})
				.catch((err) => {
					console.log("the error doing all that was", err)
					res.status(500).send(err)
				})
		})
		.catch((err) => {
			console.log("error getting serach results", err)
		})
})

router.post("/metadata-download", async (req, res) => {
	const sender = req.query.sender

	const alreadyExists = await firebase.songDoesExist(req.body.id)

	if (alreadyExists) {
		//get the url and send it

		onedrive
			.getDownloadURL(req.body.id)
			.then((url) => {
				res.type("application/json")
				res.send({ url })
				console.log(
					"sent them the download url cause i already have",
					req.body.title,
					"(" + req.body.id + ")"
				)
			})
			.catch((err) => {
				console.log("error getting download url: " + err)
				res.status(500).send("error getting download url: " + err)
			})
	} else {
		//proceed to regular route

		youtubeDownloader
			.downloadVideoWithMetadata(req.body, sender)
			.then((songFileInfo) => {
				//in here there will be two completley independent processes; send the file and upload it. unlink the song once we get a resolve or reject from the uploading AND the

				const [songPath, youtubeID] = songFileInfo

				let didSendFile = false //true for completed
				let didUploadFile = false //true for completed OR got an error

				function updateStatus(process) {
					if (process === "file") {
						didSendFile = true

						if (didUploadFile) {
							console.log("both are good, i'll unlink now")
							fs.unlinkSync(songPath)
						}
					} else {
						didUploadFile = true

						if (didSendFile) {
							console.log("both are good, i'll unlink now", req.body.title)
							fs.unlinkSync(songPath)
						}
					}
				}

				res.sendFile(songPath, (err) => {
					if (err) {
						console.log("error downloading to response was:", err)
						res.status(500).send("could not send file, " + err)
					} else {
						console.log("sent file!", req.body.title)
					}

					updateStatus("file")
				})

				onedrive
					.uploadLargeSong(songPath, req.body, youtubeID)
					.then(() => {
						console.log("did upload!", req.body.title)
						updateStatus("upload")
					})
					.catch((err) => {
						//do not put any send status to client cause this isn't their business
						updateStatus("upload")
					})
			})
			.catch((err) => {
				console.log("the error doing all that was", err)
				res.status(500).send(err)
			})
	}
})

router.get("/spotify-token", (req, res) => {
	console.log("recieved request for token")

	spotify
		.getRefreshToken()
		.then((tokenJSON) => {
			res.send(tokenJSON)
		})
		.catch((err) => {
			res.status(500).send(err)
		})
})

router.get("/onedrive-token", (req, res) => {
	onedrive
		.getAccessToken()
		.then((token) => {
			res.send(token)
		})
		.catch((err) => {
			console.log("err getting token:", err)
			res.status(500).send("err getting token:" + err)
		})
})

router.post("/youtube-link-download", (req, res) => {
	const link = req.body.link

	if (!link) {
		res.status(400).send("please include link")
		return
	} else if (!ytdl.validateURL(link)) {
		res.status(400).send("please incldue valid link")
		return
	}

	youtubeDownloader
		.getVideoInfo(link)
		.then((info) => {
			res.send(info)
		})
		.catch((err) => {
			console.log("err getting video: ", err)
			res.status(500).send(err)
		})
})

router.get("/id-link", (req, res) => {
	const id = req.query.id

	onedrive
		.getDownloadURL(id)
		.then((url) => {
			let expireDate = new Date()
			expireDate.setMinutes(expireDate.getMinutes() - 1)

			res.send({
				url: url,
				expireTime: expireDate.getTime(),
			})
		})
		.catch((err) => {
			res.status(500).send(err)
		})
})

router.post("/metadata-link", async (req, res) => {
	//server recieves metadata
	const songID = req.body.id
	const sender = req.query.sender
	console.log(sender)

	//metadata id in firebase?
	const songDoesExist = await firebase.songDoesExist(songID)

	if (songDoesExist) {
		//yes
		console.log(req.body.title, "existed")
		onedrive.getDownloadURL(songID).then((url) => {
			const expireDate = new Date()
			expireDate.setMinutes(expireDate.getMinutes() + 59)

			console.log("sent the url that already existed")

			res.send({
				url,
				expireTime: expireDate.getTime(),
			})
		})
	} else {
		//no
		console.log(req.body.title, "not in firebase, downloading...")

		//use the youtube download video with metadata function passing in the request body
		youtubeDownloader
			.downloadVideoWithMetadata(req.body, sender)
			.then((songFileInfo) => {
				console.log("received song file info")

				//recieve resolution with songpath and ytdi
				const [songPath, youtubeID] = songFileInfo

				const stats = fs.statSync(songPath)

				function getDonwloadURLAndRetry() {
					setTimeout(() => {
						onedrive
							.getDownloadURL(songID)
							.then((url) => {
								console.log("did upload, going to unlink", req.body.title)
								fs.unlinkSync(songPath)

								const expireDate = new Date()
								expireDate.setMinutes(expireDate.getMinutes() + 59)

								res.send({
									url,
									expireTime: expireDate.getTime(),
								})
							})
							.catch((err) => {
								console.log("error getting download link:", err)

								getDonwloadURLAndRetry()
							})
					}, 500)
				}

				//is file size bigger than 4 megabytes?

				if (stats.size >= 4 * 1000 * 1000) {
					//yes, upload large song

					console.log(req.body.title, "was large")

					onedrive
						.uploadLargeSong(songPath, req.body, youtubeID)
						.then(() => {
							//request the download url

							getDonwloadURLAndRetry()
						})
						.catch((err) => {
							console.log("error uploading large song", err)
						})
				} else {
					//no

					onedrive
						.uploadSmallSong(songPath, req.body, youtubeID)
						.then(() => {
							getDonwloadURLAndRetry()
						})
						.catch((err) => {
							console.log("error uploading small song:", err)
						})
				}
			})
			.catch((err) => {
				console.log("error getting and sending link using metadata:", err)

				if (err.name === "404") {
					res.status(404).send(err)
				} else {
					res.status(500).send(err)
				}
			})
	}
})

router.post("/metadata-add", async (req, res) => {
	//server recieves metadata
	const songID = req.body.id
	const sender = req.query.sender
	console.log(sender)

	//metadata id in firebase?
	const songDoesExist = await firebase.songDoesExist(songID)

	if (songDoesExist) {
		//yes
		console.log(req.body.title, "existed")

		res.status(200).send(`${req.body.title} already existed`)
	} else {
		//no
		console.log(req.body.title, "not in firebase, downloading...")

		//use the youtube download video with metadata function passing in the request body
		youtubeDownloader
			.downloadVideoWithMetadata(req.body, sender)
			.then((songFileInfo) => {
				console.log("received song file info")

				//recieve resolution with songpath and ytdi
				const [songPath, youtubeID] = songFileInfo

				const stats = fs.statSync(songPath)

				//is file size bigger than 4 megabytes?

				if (stats.size >= 4 * 1000 * 1000) {
					//yes, upload large song

					console.log(req.body.title, "was large")

					onedrive
						.uploadLargeSong(songPath, req.body, youtubeID)
						.then(() => {
							res
								.status(200)
								.send(`${req.body.title} added to database and server!`)
						})
						.catch((err) => {
							console.log("error uploading large song", err)
						})
				} else {
					//no

					onedrive
						.uploadSmallSong(songPath, req.body, youtubeID)
						.then(() => {
							res
								.status(200)
								.send(`${req.body.title} added to database and server!`)
						})
						.catch((err) => {
							console.log("error uploading small song:", err)
						})
				}
			})
			.catch((err) => {
				console.log("error getting and sending link using metadata:", err)

				if (err.name === "404") {
					res.status(404).send(err)
				} else {
					res.status(500).send(err)
				}
			})
	}
})

router.get("/info", async (req, res) => {
	const { id } = req.query

	const info = await ytdl.getBasicInfo(id)

	res.send(info)
})

module.exports = router
