import React from "react";
import {useRecoilValue} from "recoil";
import {isDarkAtom} from "../Global/atoms";
import {usePlaybackModel} from "../Models/PlaybackModel";

function ProgressBar({isTranslucent, isFullScreen}: {isTranslucent?: boolean, isFullScreen?: boolean}) {
	const isDark = useRecoilValue(isDarkAtom);
	
	const {getTotalTime} = usePlaybackModel();

	function getBarColor() {
		if (isTranslucent) {
			return "border-white opacity-40";
		} else {
			return isFullScreen
				? "border-white opacity-80"
				: isDark
				? "border-gray-700"
				: "border-gray-300";
		}
	}

	return (
		<div className={`space-x-2 text-white opacity-80 text-sm flex`}>
			<p
				className={
					"w-9 time-progressed " +
					(isFullScreen ? "text-white opacity-90 font-medium" : "text text-gray-400")
				}>
				0:00
			</p>
			<hr
				className={"border-2 rounded-full w-full self-center " + getBarColor()}
			/>
			<p
				className={
					"w-9 time-total " +
					(isFullScreen ? "text-white opacity-90 font-medium" : "text text-gray-400")
				}>
				{getTotalTime()}
			</p>
		</div>
	);
}

export default ProgressBar;
