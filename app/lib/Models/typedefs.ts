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
        public aritst: string,
        public album: string,
        public track: string,
        public date: string,
        public id: string,
        public artwork: string,
        public thumbnail: string,
        public  duration: number,
        public albumId: string,
        public artistObjects: SpotifyArtist[]) {}
	
}



export class PlaylistTrack extends Track {
    constructor (
        public title: string,
    public artist: string,
    public album: string,
    public  track: string,
    public date: string,
    public id: string,
    public artwork: string,
    public thumbnail: string,
    public duration: number,
    public albumId: string,
    public artistObjects: SpotifyArtist[],
    public dateAdded: Date) {
        super(title,
            artist,
            album,
            track,
            date,
            id, artwork, thumbnail, duration, albumId, artistObjects)
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
        date: string,
        tracks: Track[],
        artwork: string,
        artistObjecs: SpotifyArtist[]) {
            super(title, artist, totalTracks, id, thumbnail)
        }
	
}

