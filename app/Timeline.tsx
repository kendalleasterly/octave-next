"use client"

import React, {useEffect, useState} from "react";
import {useRecoilValue, useSetRecoilState} from "recoil";
import ObjectRow from "./Components/ObjectRow";
import {
	headerTextAtom,
	queueAtom,
} from "./Global/atoms";
import {usePlaybackModel} from "./Models/PlaybackModel";
import { PlaybackObject } from "./Models/typedefs";

function Timeline() {
	const queue = useRecoilValue(queueAtom);
	const setHeaderText = useSetRecoilState(headerTextAtom);
	const [view, setView] = useState("queue");
	const playbackModel = usePlaybackModel();

	useEffect(() => {
		setHeaderText("Timeline");
	});

	let reversedQueue = [...queue];
	reversedQueue.reverse();

	function isInQueue(playbackObject: PlaybackObject) {
		//first make a local array. then do all of your logic using that one.

		let currentQueuePosition = playbackModel.getCurrentQueuePosition()

		let positionInQueue = playbackModel.getPositionInQueue(playbackObject);

		return positionInQueue >= currentQueuePosition
	}

	if (queue.length !== 0) {
		return (
			<div className="space-y-4">
				<div className="flex justify-around">
					<button onClick={() => setView("queue")}>
						<p
							className={
								"text-lg " + (view === "queue" ? "text" : "text-gray-400")
							}>
							Queue
						</p>
					</button>

					<button onClick={() => setView("history")}>
						<p
							className={
								"text-lg " +
								(view === "history" ? "text" : "text-gray-400")
							}>
							History
						</p>
					</button>
				</div>

				{view === "queue" ? (
					<div className="space-y-8">
						{queue.map((playbackObject, key) => {
							if (isInQueue(playbackObject)) {
								return (
									<ObjectRow
										object={playbackObject.track!}
										index={playbackModel.getPositionInQueue(playbackObject)}
										key={key}
										playFunction={() =>
											playbackModel.checkAndSetCurrentPlaybackObject(
												playbackObject
											)
										}></ObjectRow>
								);
							}
						})}
					</div>
				) : (
					<div className="space-y-8">
						{reversedQueue.map((playbackObject, key) => {
							if (!isInQueue(playbackObject)) {
								return (
									<ObjectRow
										object={playbackObject.track!}
										index={playbackModel.getPositionInQueue(playbackObject)}
										key={key}
										playFunction={() =>
											playbackModel.checkAndSetCurrentPlaybackObject(
												playbackObject
											)
										}></ObjectRow>
								);
							} else {
								return null
							}
						})}
					</div>
				)}
			</div>
		);
	} else {
		return (
			<p className="text-gray-400 text-center">
				You have no songs in your queue or history!
			</p>
		);
	}
}

export default Timeline;
