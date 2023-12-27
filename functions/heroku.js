const { default: axios } = require("axios")

const herokuAuthKey = process.env.HEROKU_AUTH_KEY

function restartDyno(details) {

	console.log("restarting dyno...")

	axios.post("https://set-light.herokuapp.com/mail", {
		subject: "Open Music Dyno Restart",
		text: "Open music dyno was restarted: " + details,
	})

	axios.delete("https://api.heroku.com/apps/open-music/dynos", {
		headers: {
			Accept: "application/vnd.heroku+json; version=3",
			Authorization:
				`Basic ${herokuAuthKey}`,
		},
	})
}

module.exports = { restartDyno }
