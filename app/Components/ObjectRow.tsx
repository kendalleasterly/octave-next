// "use client"

import { useRecoilValue } from "recoil"
import { currentPlaybackObjectAtom } from "../Global/atoms"
import { useTrackModel } from "../Models/TrackModel"
import Image from "next/image"
import { Album, Track } from "../Models/typedefs"
import { ReactNode } from "react"
import RemoteImage from "./RemoteImage"

function ObjectRow({
	object,
	playFunction,
	noImage,
	index,
	onContextMenu,
	children,
}: {
	object: Track | Album
	playFunction: () => void
	noImage?: boolean
	index: number
	onContextMenu?: (event: any) => void
	children?: ReactNode
}) {
	const currentPlaybackObject = useRecoilValue(currentPlaybackObjectAtom)
	const { convertSecondsToReadableTime } = useTrackModel()

	function getTextColor() {
		let color = "text"

		if (currentPlaybackObject.track) {
			if (currentPlaybackObject.track.id === object.id) {
				color = "text-accent80"
			}
		}

		return color
	}

	

	function decideSongsInfo() {

		if (object instanceof Album) {
			if (object.totalTracks === 1) {
				return "1 song"
			} else {
				return `${object.totalTracks} songs`
			}
		}

		return convertSecondsToReadableTime(object.duration)

	}

	return (
		<div className="flex w-full space-x-4 z-30">
			<button
				className="object-row w-full"
				onClick={playFunction}
				onContextMenu={onContextMenu}
			>
				<p
					className={
						"w-6 text-center text-gray-400 font-medium text-lg my-auto medium-only " +
						(noImage ? "mr-4" : "")
					}
				>
					{index + 1}
				</p>

				{!noImage && 
				<div className="thumbnail mr-4 md:mx-4 relative">
					<RemoteImage src={object.thumbnail} className="rounded-md thumbnail"/>
				</div>
					
				}

				<div className="text-left h-full space-y-0.5">
					<p className={"one-line font-medium " + getTextColor()}>
						{object.title}
					</p>
					<p className="text-gray-400 one-line font-medium text-sm">
						{object.artist}
					</p>
				</div>
			</button>

			<p className="my-auto font-medium text-gray-400 whitespace-nowrap medium-only">
				{decideSongsInfo()}
			</p>

			{children}
		</div>
	)
}

export default ObjectRow
