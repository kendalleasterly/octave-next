import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil"
import {
	contextSelectionAtom,
	isDarkAtom,
	queueAtom,
	shufflingAtom,
} from "../Global/atoms"

import ObjectRow from "./ObjectRow"
import More from "@/public/Images/more.svg"

import { usePlaylistModel } from "../Models/PlaylistModel"
import { accountAtom, useAccountModel } from "../Models/AccountModel"
import { usePlaybackModel } from "../Models/PlaybackModel"
import { MouseEventHandler, useState } from "react"
import { useRouter } from "next/navigation"
import { Track } from "../Models/typedefs"

function Song({
	index,
	track,
	noImage,
	deleteFromPlaylist,
	onClickFunction,
}: {
	index: number
	track: Track
	noImage?: boolean
	deleteFromPlaylist?: () => void
	onClickFunction?: () => void
}) {
	const isDark = useRecoilValue(isDarkAtom)
	const playbackModel = usePlaybackModel()
	const playlistModel = usePlaylistModel()
	const [contextSelection, setContextSelection] =
		useRecoilState(contextSelectionAtom)
	const setQueue = useSetRecoilState(queueAtom)
	const setShuffling = useSetRecoilState(shufflingAtom)
	const router = useRouter()
	const accountModel = useAccountModel()

	function showContext() {
		if (contextSelection === index) {
			setContextSelection(-1)
		} else {
			setContextSelection(index)
		}
	}

	function onContextMenu(event: any) {
		event.preventDefault()
		showContext()
	}

	function playSingularSong() {
		playbackModel.prepareForNewSong(true)
		setShuffling(false)

		playbackModel.playTrack(track).then((playbackObject) => {
			setQueue([playbackObject])
		})
	}

	return (
		<ObjectRow
			object={track}
			playFunction={onClickFunction ? onClickFunction : playSingularSong}
			noImage={noImage}
			index={index}
			onContextMenu={onContextMenu}
		>
			<button
				className="my-auto"
				onClick={showContext}
				id={`more-button-${index}`}
			>
				<More fill={isDark ? "#FFFFFF" : "#3F3F46"} />
			</button>
			<Dropdown />
		</ObjectRow>
	)

	function Dropdown() {
		const [playlistsActive, setPlaylistsActive] = useState(false)
		const account = useRecoilValue(accountAtom)

		function getOffset() {
			const parent = document.getElementById(`more-button-${index}`)

			if (parent) {
				return parent.getBoundingClientRect()
			} else {
				return { y: 0, x: 0 }
			}
		}

		return (
			<div
				className={
					"z-50 fixed " +
					(contextSelection === index ? "flex flex-row" : "hidden")
				}
				style={{ top: getOffset().y, right: window.innerWidth - getOffset().x }}
			>
				{playlistsActive ? (
					<div
						className="bg-gray-800 rounded-md py-3 space-y-2 flex flex-col flex-none"
						onMouseEnter={() => setPlaylistsActive(true)}
						onMouseLeave={() => setPlaylistsActive(false)}
					>
						{account.simplePlaylists.map((simplePlaylist, key) => {
							return (
								<MenuRow
									title={simplePlaylist.title}
									clickFunction={() =>
										playlistModel.addToPlaylist(track, simplePlaylist)
									}
									key={key}
								/>
							)
						})}
					</div>
				) : null}

				<div className="bg-gray-800 rounded-md py-3 space-y-2 flex flex-col">
					<MenuRow
						title="Add To Queue"
						clickFunction={() => playbackModel.addToQueue(track)}
					/>
					{account.isSignedIn && (
						<MenuRow
							title="Add To Playlist"
							clickFunction={() => setPlaylistsActive(true)}
							onMouseEnter={() => setPlaylistsActive(true)}
							onMouseLeave={() => setPlaylistsActive(false)}
						/>
					)}

					<MenuRow
						title="View Album"
						clickFunction={() => {
							router.push(`/album/${track.albumID}`)
						}}
					/>

					{account.isSignedIn ? (
						account.savedTracks &&
						Object.keys(account.savedTracks).includes(track.id) ? (
							<MenuRow
								title="Remove Song"
								clickFunction={() => {
									accountModel.removeTrack(track)
								}}
							/>
						) : (
							<MenuRow
								title="Save Song"
								clickFunction={() => {
									accountModel.saveTrack(track)
								}}
							/>
						)
					) : null}

					{deleteFromPlaylist && (
						<MenuRow title="Delete" clickFunction={deleteFromPlaylist} />
					)}

					<MenuRow title="View Artist" clickFunction={() => {}} />
				</div>
			</div>
		)

		function MenuRow({
			clickFunction,
			title,
			onMouseEnter,
			onMouseLeave,
		}: {
			clickFunction: () => void
			title: string
			onMouseEnter?: MouseEventHandler
			onMouseLeave?: MouseEventHandler
		}) {
			return (
				<button
					onClick={() => {
						clickFunction()
						if (title != "Add To Playlist") setContextSelection(-1)
					}}
					className="hover:bg-gray-700 text-gray-400 text-left px-4"
					onMouseOver={onMouseEnter}
					onMouseLeave={onMouseLeave}
				>
					{title}
				</button>
			)
		}
	}
}

export default Song
