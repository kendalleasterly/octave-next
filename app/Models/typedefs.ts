export type SpotifyObject = {
	id: string
	name: string
	artists: SpotifyArtist[]
}

export type SpotifyAlbumImage = {
	url: string
}

export type SpotifyAlbum = SpotifyObject & {
	total_tracks: number
	release_date: string
	images: SpotifyAlbumImage[]
}

export type FullSpotifyAlbum = SpotifyAlbum & {
	tracks: {
		items: SimplifiedSpotifyTrack[]
	}
}

export type SpotifyArtist =  {
	id: string
	name: string
}

export type SimplifiedSpotifyTrack = SpotifyObject & {
	duration_ms: number
	track_number: number
}

export type SpotifyTrack = SimplifiedSpotifyTrack & {
	album: SpotifyAlbum
}

export class Track {
    constructor(
        public title: string,
        public artist: string,
        public album: string,
        public track: string,
        public date: string ,
        public id: string ,
        public artwork: string,
        public thumbnail: string,
        public duration: number,
        public albumID: string,
        public artistObjects: SpotifyArtist[]) {}
	
}



export class PlaylistTrack extends Track {
    constructor (
        public title: string,
    public artist: string,
    public album: string,
    public track: string, // "3/20" 3rd out of 20
    public date: string,
    public id: string,
    public artwork: string,
    public thumbnail: string,
    public duration: number,
    public albumID: string,
    public artistObjects: SpotifyArtist[],
    public dateAdded: Date) {
        super(title,
            artist,
            album,
            track,
            date,
            id, artwork, thumbnail, duration, albumID, artistObjects)
    }
	
}

export class Album {
	
    constructor(
        public title: string,
        public artist: string,
        public totalTracks: number,
        public id: string,
        public thumbnail: string) {}
	
}

export class FullAlbum extends Album {

    constructor (
        title: string,
        artist: string,
        totalTracks: number,
        id: string,
        thumbnail: string,
        public date: string,
        public tracks: Track[],
        public artwork: string,
        public artistObjecs: SpotifyArtist[]) {
            super(title, artist, totalTracks, id, thumbnail)
        }
	
}

export type SimplePlaylist = {id: string, title: string}

export class PlaybackObject {

	isExpired: boolean

	constructor(
		public track?: Track, 
		public url?: string, 
		public expireTime?: number, 
		public position?: number, 
		public guid?: string) {

        if (this.expireTime) {
            this.isExpired = Date.now() >= this.expireTime;
        } else {
            this.isExpired = true
        }

		if (!this.guid) {
			this.guid = this.generateGUID()
		}
	}

    generateGUID() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            var r = (Math.random() * 16) | 0,
                v = c == "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

	//add a function that caluculates wheter or not the song will expire by the end of playback
}