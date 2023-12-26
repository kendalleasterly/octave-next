const { default: axios } = require("axios")
const fs = require("fs")
const path = require("path")
const dotenv = require("dotenv")
const firebase = require("./firebase")

dotenv.config()
const ONEDRIVE_CLIENT_SECRET = process.env.ONEDRIVE_CLIENT_SECRET
const ONEDRIVE_REFRESH_TOKEN = process.env.ONEDRIVE_REFRESH_TOKEN

function getAccessToken() {
	const accessTokenFile = "./tokens/onedriveAccessToken.json"

	return new Promise((resolve, reject) => {
		fs.readFile(accessTokenFile, "utf-8", (err, data) => {
			if (err) {
				reject(err)
			} else {
				const accessTokenJSON = JSON.parse(data)
				//you need to see if the file you already have is expired here
				const now = new Date()

				if (accessTokenJSON.expireTime <= now.getTime()) {
					//if it is, request a new one.

					const params = new URLSearchParams()

					params.append("client_id", "53ff117e-0289-4fd5-94e3-c3276d3314e1")
					params.append("redirect_uri", "https://set-light.herokuapp.com/auth")
					params.append("client_secret", ONEDRIVE_CLIENT_SECRET)
					params.append("refresh_token", ONEDRIVE_REFRESH_TOKEN)
					params.append("grant_type", "refresh_token")

					axios
						.post(
							"https://login.microsoftonline.com/common/oauth2/v2.0/token",
							params
						)
						.then((response) => {
							const data = response.data

							const accessToken = data.access_token

							//get the new one get the expires_in property from the response data

							const expires_in = data.expires_in

							//and extract the addToExpireDate function into this one. use properties it uses in here
							const expireDate = new Date()
							expireDate.setSeconds(now.getSeconds() + expires_in)
							accessTokenJSON["expireTime"] = expireDate.getTime()
							accessTokenJSON["accessToken"] = accessToken

							fs.writeFile(
								accessTokenFile,
								JSON.stringify(accessTokenJSON),
								(err) => {
									if (err) {
										console.log("error writing to access token file:", err)
									}
								}
							)

							//resolve using the access_token property
							resolve(accessToken)
						})
						.catch((error) => {
							reject()
							console.log("error getting access token:", error)
						})
				} else {
					//if it isn't resolve using the accessTOken from the json
					resolve(accessTokenJSON.accessToken)
				}
			}
		})
	})
}

function uploadLargeSong(songPath, songInfo, youtubeID) {
	//i need the path to upload, and the info and youtube id to give to firebase function

	//TODO: allow for songs over 60 mib (https://gist.github.com/tanaikech/22bfb05e61f0afb8beed29dd668bdce9)

	return new Promise((resolve, reject) => {
		//get access token

		getAccessToken()
			.then((token) => {
				//apply for upload session using access token

				console.log("got access token from upload large song")

				axios
					.post(
						`https://graph.microsoft.com/v1.0/me/drive/root:/api/open-music/${songInfo.id}.m4a:/createUploadSession`,
						{},
						{
							headers: {
								Authorization: token,
							},
						}
					)
					.then((response) => {
						const url = response.data.uploadUrl
						//upload using upload session link

						fs.readFile(songPath, (err, data) => {
							if (err) {
								console.log("error reading file:" + err)
								reject("error reading file:" + err)
								return
							}

							axios
								.put(url, data)
								.then((response) => {
									console.log("uploaded the song, adding to firebase")
									firebase.addSong(songInfo, youtubeID)

									resolve(response.data)
								})
								.catch((err) => {
									console.log("error uploading the song to onedrive: " + err)
								})
						})
					})
					.catch((err) => {
						console.log("err subscribing to upload session:" + err)
						reject("err subscribing to upload session:" + err)
					})
			})
			.catch((err) => {
				console.log("error getting access token: " + err)
				reject("error getting access token: " + err)
			})
	})
}

function uploadSmallSong(songPath, songInfo, youtubeID) {
	return new Promise((resolve, reject) => {
		//get access token

		getAccessToken().then((token) => {
			//apply for upload session using access token

			fs.readFile(songPath, (err, data) => {
				if (err) {
					console.log("error reading file:" + err)
					reject("error reading file:" + err)
					return
				}

				axios
					.put(
						`https://graph.microsoft.com/v1.0/me/drive/root:/api/open-music/${songInfo.id}.m4a:/content`,
						data,
						{
							headers: {
								Authorization: token,
							},
						}
					)
					.then((response) => {
						firebase.addSong(songInfo, youtubeID)
						resolve(response.data)
					})
			})
		})
	})
}

function getDownloadURL(id) {
	return new Promise((resolve, reject) => {
		getAccessToken().then((token) => {
			axios
				.get(
					`https://graph.microsoft.com/v1.0/me/drive/root:/api/open-music/${id}.m4a`,
					{
						headers: {
							Authorization: token,
						},
					}
				)
				.then((response) => {
					const donwloadLink = response.data["@microsoft.graph.downloadUrl"]
					resolve(donwloadLink)
				})
				.catch((err) => {
					console.log("error getting downloadURL" + err)
				})
		})
	})
}

module.exports = {
	getAccessToken,
	uploadLargeSong,
	getDownloadURL,
	uploadSmallSong,
}
