import axios from "axios";
import {Track, SpotifyAlbum, SpotifyArtist, SpotifyObject, SpotifyTrack, FullSpotifyAlbum, SimplifiedSpotifyTrack, FullAlbum, Album} from "./typedefs"

export function useSpotifyModel() {
	const spotifyURL = "https://api.spotify.com/v1";

	const serverURL: string = process.env.NEXT_PUBLIC_SERVER_URL!

	// const serverURL = "http://localhost:4000"

	function getToken():Promise<string> {
		function requestToken():Promise<string> {
			return new Promise((resolve, reject) => {
				//contact server for a new token

				axios
					.get(serverURL + "/spotify-token")
					.then((response) => {
						console.log(process.env.DEV_SERVER_URL)
						localStorage.setItem("tokenJSON", JSON.stringify(response.data));

						const token = response.data.token;

						resolve(token);
					})
					.catch((err) => {
						console.log("error getting data from response: " + err.response);
						reject("error getting data from response: " + err.response);
					});
			});
		}

		return new Promise((resolve, reject) => {
			const tokenString = localStorage.getItem("tokenJSON");

			if (tokenString) {
				//we have a tokenJSON already, let's see if it is

				const tokenJSON = JSON.parse(tokenString);
				const expireDateTime = tokenJSON.expireDateTime;

				if (expireDateTime >= Date.now()) {
					//has not expired yet

					resolve(tokenJSON.token);
				} else {
					//it did expire, so get a new one

					requestToken()
						.then((token) => {
							resolve(token);
						})
						.catch((err) => {
							reject("error requesting token: " + err);
						});
				}
			} else {
				//we don't have one so get a new one
				requestToken()
					.then((token) => {
						resolve(token);
					})
					.catch((err) => {
						reject("error requesting token: " + err);
					});
			}
		});
	}

	

	function getArtists(artistObjects: SpotifyArtist[]):string {
		// const artists = spotifyTrack.artists

		let artists: string[] = [];

		artistObjects.forEach((artist) => {
			artists.push(artist.name);
		});

		if (artists.length === 1) {
			return artists[0];
		} else if (artists.length === 2) {
			return `${artists[0]} & ${artists[1]}`;
		} else {
			let returnData = "";

			artists.forEach((artist) => {
				if (artists[0] === artist) {
					returnData = artist;
				} else if (artists[artists.length - 1] === artist) {
					returnData = returnData + " & " + artist;
				} else {
					returnData = returnData + ", " + artist;
				}
			});

			return returnData;
		}
	}

	function getArtistObjects(spotifyObject: SpotifyObject) {
		const artists = spotifyObject.artists;

		let artistObjects: SpotifyArtist[] = [];

		artists.forEach((artist) => {
			const artistObject: SpotifyArtist = {
				id: artist.id,
				name: artist.name,
			};

			artistObjects.push(artistObject);
		});

		return artistObjects;
	}

	

	function parseSpotifyTrack(spotifyTrack: SimplifiedSpotifyTrack, spotifyAlbum: SpotifyAlbum): Track {
		function getTrackPosition() {
			const trackNumber = spotifyTrack.track_number;
			const totalTracks = spotifyAlbum.total_tracks;

			return trackNumber + "/" + totalTracks;
		}

		function getDuration() {
			const duration = Number(spotifyTrack.duration_ms);
			let seconds = Math.round(duration / 1000);

			return seconds;
		}

		const title = spotifyTrack.name;
		const aritst = getArtists(spotifyTrack.artists);
		const album = spotifyAlbum.name;
		const trackPosition = getTrackPosition();
		const date = spotifyAlbum.release_date;
		const id = spotifyTrack.id;
		const duration = getDuration();
		const albumID = spotifyAlbum.id;
		const artistObjects = getArtistObjects(spotifyTrack);
		let artwork = "";
		let thumbnail = "";

		if (spotifyAlbum.images) {
			if (spotifyAlbum.images[0]) {
				artwork = spotifyAlbum.images[0].url;
			}

			if (spotifyAlbum.images[1]) {
				thumbnail = spotifyAlbum.images[1].url;
			}
		}

		return new Track(
			title,
			aritst,
			album,
			trackPosition,
			date,
			id,
			artwork,
			thumbnail,
			duration,
			albumID,
			artistObjects
		);
	}

	function fetchSearchResults(token: string, term: string, tracksOnly?: boolean): Promise<(Track | Album)[]> {
		return new Promise((resolve, reject) => {
			const encodedTerm = encodeURIComponent(term);

			axios
				.get(
					spotifyURL +
						"/search?q=" +
						encodedTerm +
						`&type=track${tracksOnly ? "" : "%2Calbum"}&limit=6`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				)
				.then((response) => {
					const tracks: SpotifyTrack[] = response.data.tracks.items;

					let trackArray: Track[] = [];

					tracks.forEach((spotifyTrack) => {
						const trackObject = parseSpotifyTrack(
							spotifyTrack,
							spotifyTrack.album
						);
						//instead of artists its album
						trackArray.push(trackObject);
					});

					let albumArray: Album[] = [];

					if (!tracksOnly) {
						const albums: SpotifyAlbum[] = response.data.albums.items;

						albums.forEach((spotifyAlbum) => {
							const title = spotifyAlbum.name;
							const artist = getArtists(spotifyAlbum.artists);
							const totalTracks = spotifyAlbum.total_tracks;
							const id = spotifyAlbum.id;
							let thumbnail = "";

							if (spotifyAlbum.images[0]) {
								thumbnail = spotifyAlbum.images[0].url;
							} else {
								console.log({spotifyAlbum});
							}

							albumArray.push(
								new Album(title, artist, totalTracks, id, thumbnail)
							);
						});
					}

					resolve([...trackArray, ...albumArray]);
				});
		});
	}

	function getAlbumTracks(id: string): Promise<Track[]> {
		return new Promise(async (resolve, reject) => {
			const token = await getToken();

			const response = await axios.get(spotifyURL + "/albums/" + id, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			let trackArray: Track[] = [];

			const album: FullSpotifyAlbum = response.data

			album.tracks.items.forEach((spotifyTrack: SimplifiedSpotifyTrack) => {
				const parsedTrack = parseSpotifyTrack(spotifyTrack, album);
				trackArray.push(parsedTrack);
			});

			resolve(trackArray);
		});
	}

	function parseSpotifyAlbum(spotifyAlbum: FullSpotifyAlbum) {
		const title = spotifyAlbum.name;
		const artists = getArtistObjects(spotifyAlbum);
		const id = spotifyAlbum.id;
		const totalTracks = spotifyAlbum.total_tracks;
		const artist = getArtists(spotifyAlbum.artists);
		const date = spotifyAlbum.release_date;

		const tracks: Track[] = [];

		spotifyAlbum.tracks.items.forEach((spotifyTrack) => {
			const parsedTrack = parseSpotifyTrack(spotifyTrack, spotifyAlbum);
			tracks.push(parsedTrack);
		});

		let thumbnail = "";
		let artwork = "";
		if (spotifyAlbum.images) {
			if (spotifyAlbum.images[0]) {
				artwork = spotifyAlbum.images[0].url;
			}

			if (spotifyAlbum.images[1]) {
				thumbnail = spotifyAlbum.images[1].url;
			}
		}

		const parsedAlbum = new FullAlbum(
			title,
			artist,
			totalTracks,
			id,
			thumbnail,
			date,
			tracks,
			artwork,
			artists,
		);

		return parsedAlbum;
	}

	function getAlbum(id: string): Promise<FullAlbum> {
		return new Promise((resolve, reject) => {
			getToken()
				.then((token) => {
					axios
						.get(spotifyURL + "/albums/" + id, {
							headers: {
								Authorization: `Bearer ${token}`,
							},
						})
						.then((spotifyAlbum) => {
							const parsedAlbum = parseSpotifyAlbum(spotifyAlbum.data);
							resolve(parsedAlbum);
						});
				})
				.catch((error) => {
					console.log("error getting album:", error);
					reject(error);
				});
		});
	}

	function getTracksFromSongIDs(trackIDs: string[], shouldCache: boolean): Promise<Track[]>{
		//check local storage to see if we have it

		return new Promise(async (resolve, reject) => {
			let remainingIDs: string[] = [];
			let tracks: Track[] = [];

			trackIDs.map((trackID) => {
				const trackString = localStorage.getItem(trackID);

				if (trackString) {
					tracks.push(JSON.parse(trackString));
				} else {
					remainingIDs.push(trackID);
				}
			});

			if (remainingIDs.length !== 0) {
				let idsString = "";
				for (let i = 0; i < remainingIDs.length; i++) {
					if (i != 0) idsString += ",";

					idsString += remainingIDs[i];
				}

				const token = await getToken();

				axios
					.get(spotifyURL + "/tracks?ids=" + idsString, {
						headers: {
							Authorization: "Bearer " + token,
						},
					})
					.then((result) => {
						const rawTracks: SpotifyTrack[] = result.data.tracks;

						rawTracks.map((rawTrack) => {
							const track = parseSpotifyTrack(rawTrack, rawTrack.album);

							if (shouldCache)
								localStorage.setItem(track.id, JSON.stringify(track));

							tracks.push(track);
						});

						resolve(tracks);
					})
					.catch((error) => {
						console.log("error getting remaining trackIDs", error);
						reject(error);
					});
			} else {
				resolve(tracks);
			}
		});

		//continue rest of function with the ones we don't have
	}

	return {
		getToken,
		getArtists,
		getAlbum,
		getAlbumTracks,
		getArtistObjects,
		parseSpotifyAlbum,
		parseSpotifyTrack,
		fetchSearchResults,
		getTracksFromSongIDs,
	};
}


