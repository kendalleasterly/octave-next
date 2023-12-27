const { default: axios } = require("axios")

function getRefreshToken() {
	return new Promise((resolve, reject) => {
		//decide if the one we already have in storage is good enough. If it is, give it to them and if not,

		const tokenUrl = "https://accounts.spotify.com/api/token"

		const params = new URLSearchParams()
		params.append("grant_type", "client_credentials")

		const config = {
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				Authorization:
					"Basic ***REMOVED***",
			},
		}

		axios
			.post(tokenUrl, params, config)
			.then((response) => {
				const token = response.data.access_token

				const now = new Date()
				now.setSeconds(now.getSeconds() + response.data.expires_in)

				const expireDateTime = now.getTime()

				resolve({ token, expireDateTime })

			})
			.catch((err) => {
				console.log("error requesting token: " + err)
				console.log(err.response)
				reject("error requesting token: " + err.response)
			})
	})
}

module.exports = { getRefreshToken }
