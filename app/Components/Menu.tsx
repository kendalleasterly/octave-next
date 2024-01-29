// "use client"

import { usePathname, useRouter } from "next/navigation"

import SearchIcon from "../Images/search.svg"
import HomeIcon from "../Images/home.svg"
import Logo from "../Images/logo.svg"
import SettingsIcon from "../Images/settings.svg"
import ClockIcon from "../Images/clock.svg"
import HeartIcon from "../Images/heart.svg"
import AlbumIcon from "../Images/album.svg"
import PlaylistIcon from "../Images/playlist.svg"
import AddIcon from "../Images/add.svg" 
import UserCircleIcon from "../Images/user-circle.svg"
import { useRecoilValue, useSetRecoilState } from "recoil"
import {
	isDarkAtom,
	menuIsActiveAtom
} from "../Global/atoms"
import { accountAtom, useAccountModel } from "../Models/AccountModel"
import { usePlaylistModel } from "../Models/PlaylistModel"
import Link from "next/link"
import { ReactNode } from "react"

function Menu() {
	const pathname = usePathname()
	const isDark = useRecoilValue(isDarkAtom)
	const page = pathname.replace("/", "")
	const account = useRecoilValue(accountAtom)
	const setMenuIsActive = useSetRecoilState(menuIsActiveAtom)
	const playlistModel = usePlaylistModel()
	const accountModel = useAccountModel()

	function getBarColor(slug: string, isSVG: boolean, canInclude?: boolean): string {

		if (canInclude == true) {
			if (page.toLowerCase().includes(slug.toLowerCase().replace("/", ""))) {
				return isSVG ? "#F08A79" : "text-accent75";
			}
		} else {
			if (page.toLowerCase() === slug.toLowerCase().replace("/", "")) {
				return isSVG ? "#F08A79" : "text-accent75";
			}
		}

		return isSVG == true ? (isDark ? "#FFFFFF" : "#3F3F46") : "text";

		
	}

	function createPlaylist() {
		const title = prompt("What is the title of the playlist?")
		let description = prompt("What is the description of the playlist? (optional)")
		const isVisible = prompt("Would you like it to be private?")

		if (title) {

			if (description === null) {
				description = ""
			}

			playlistModel.createPlaylist(description, isVisible === "yes", title)
		}
	}

	// function testFunction() {
	// 	axios.get("https://api.spotify.com/v1/playlists/56RLbe1qdSnWwA7nmzcFSX/tracks?offset=200&limit=100", {
	// 		headers: {
	// 			Authorization: "Bearer ***REMOVED***"
	// 		}
	// 	})
	// 	.then(response => {
			
	// 		let spotifyTrackMetadatas = response.data.items

	// 		let i
	// 		for(i = last;i < last + 5;i++)  {

	// 			const spotifyTrack = spotifyTrackMetadatas[i].track
				
	// 			const trackObject = spotifyModel.parseSpotifyTrack(spotifyTrack, spotifyTrack.album)
	// 			console.log(trackObject)
	// 			let serialzedTrackObject = JSON.parse(JSON.stringify(trackObject))

	// 			let rgt = JSON.parse(`{"createTime":"2021-08-13T01:38:16.227Z","description":"","isVisible":true,"lastUpdatedTime":"2021-08-13T01:38:16.227Z","title":"rgt","ownerName":"Kendall Easterly","ownerUID":"BrVRQL4fVJPCgTI9Coct97TRJqf1","firstTwentySongs":[],"songIDs":[],"id":"bvZaRytuKB7spyq8MGcn"}`)

	// 			playlistModel.addToPlaylist(serialzedTrackObject, rgt)
	// 		}
	// 		setLast(last + 5)
	// 		console.log({last})
	// 	})
	// }

	return (
		<div id="menu" className="overflow-scroll overscroll-contain space-y-8">
			<div className="flex space-x-2">
				<Logo fill={isDark ? "#FFFFFF" : "#27272A"} />
				<p className="text-xl font-bold text">Octave</p>
			</div>

			<div id="menu-menu" className="space-y-6">
				<SubHeading>MENU</SubHeading>

				{/* THIS CANNOT BE REFACTORED, BECAUSE THE ICONS CAN'T BE PUT INTO AN OBJECT*/}
				<Page title="Home" slug="/">
					<HomeIcon fill={getBarColor("", true)} className="icon" />
				</Page>

				<Page title="Search" slug="/search">
					<SearchIcon fill={getBarColor("/search", true)} className="icon" />
				</Page>

				<Page title="Settings" slug="/settings">
					<SettingsIcon fill={getBarColor("settings", true)} className="icon" />
				</Page>
			</div>

			<div id="menu-library" className="space-y-6">
				<SubHeading>LIBRARY</SubHeading>

				<Page title="Recent" slug="/library/recent">
					<ClockIcon
						fill={getBarColor("/library/recent", true)}
						className="icon"
					/>
				</Page>

				<Page title="Favorites" slug="/library/favorites">
					<HeartIcon
						fill={getBarColor("/library/favorites", true)}
						className="icon"
					/>
				</Page>

				<Page title="Mixes" slug="/library/mixes" canInclude={true}>
					<AlbumIcon
						fill={getBarColor("/library/mixes", true, true)}
						className="icon"
					/>
				</Page>
			</div>

			<div
				id="menu-playlists"
				className={"space-y-6 " + (account.isSignedIn ? "" : "hidden")}>
				<SubHeading>PLAYLISTS</SubHeading>

				<button className="flex space-x-3" onClick={createPlaylist}>
					<div className="my-auto">
						<AddIcon fill={isDark ? "#FFFFFF" : "#3F3F46"} />
					</div>

					<p className="text one-line text-left">Create New</p>
				</button>

				{account.simplePlaylists.map((playlist, key) => {
					const playlistSlug = `/playlist/${playlist.id}`;

					return (
						<Page title={playlist.title} slug={playlistSlug} key={key}>
							<PlaylistIcon
								fill={getBarColor(playlistSlug, true)}
								className="icon"
							/>
						</Page>
					);
				})}
			</div>

			<div
				id="menu-playlists"
				className={"space-y-6 " + (account.isSignedIn ? "hidden" : "")}>
				<SubHeading>ACCOUNT</SubHeading>

				<button className="flex space-x-3" onClick={accountModel.signIn}>
					<div className="my-auto">
						<UserCircleIcon fill={(isDark ? "#FFFFFF" : "#3F3F46")} />
					</div>

					<p className="text one-line text-left">Sign In</p>
				</button>
			</div>
		</div>
	);

	function SubHeading({children}: {children: ReactNode}) {
		return <p className="text-sm font-bold text-gray-400">{children}</p>
	}

	function Page({title, slug, children, canInclude}: {title: string, slug: string, children: ReactNode, canInclude?: boolean}) {

		return (
			<div
				onClick={() => {
					setMenuIsActive(false);
				}}>
				<Link href={slug}> {/*this is a proper use of the link component and should not have any issues*/}
					<div className="flex space-x-3">
						<div className="my-auto">{children}</div>

						<p
							className={
								"font-medium one-line " + getBarColor(slug, false, canInclude)
							}>
							{title}
						</p>
					</div>
				</Link>
			</div>
		);
	}
}

export default Menu
