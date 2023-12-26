import SkipIcon from "../Images/skip-forward.svg";
import BackIcon from "../Images/skip-backward.svg";
import RepeatIcon from "../Images/repeat.svg";
import ShuffleLightIcon from "../Images/shuffle-light.svg";
import ShuffleDarkIcon from "../Images/shuffle-dark.svg";
import ShufflingIcon from "../Images/shuffling.svg";
import PlayingIcon from "../Images/playing.svg";
import PausedIcon from "../Images/paused.svg";

import {usePlaybackModel} from "../Models/PlaybackModel";
import {useRecoilState, useRecoilValue} from "recoil";
import {isDarkAtom, isPlayingAtom, shufflingAtom} from "../Global/atoms";

function PlaybackControls({isFullScreen}: {isFullScreen?: boolean}) {
	const isPlaying = useRecoilValue(isPlayingAtom);
	const shuffling = useRecoilValue(shufflingAtom);
	const isDark = useRecoilValue(isDarkAtom);
	const buttonColor = isFullScreen ? "#FFFFFF" : isDark ? "#FFFFFF" : "#3F3F46";

	const {skipBack, playPause, skip, toggleShuffling} = usePlaybackModel();

	return (
		<div
			id="controls-secondary"
			className="flex md:space-x-12 py-1 justify-between md:justify-center w-full">
			
			<button onClick={toggleShuffling}>
				{isFullScreen ? (
					<ShuffleDarkIcon />
				) : shuffling ? (
					<ShufflingIcon />
				) : isDark ? (
					<ShuffleDarkIcon />
				) : (
					<ShuffleLightIcon />
				)}
			</button>

			<div id="controls-primary" className="flex md:space-x-8 space-x-10">
				<button onClick={skipBack}>
					<BackIcon fill={buttonColor} />
				</button>

				<button onClick={playPause} className="">
					{isPlaying ? (
						<PlayingIcon fill={buttonColor} />
					) : (
						<PausedIcon fill={buttonColor} />
					)}
				</button>

				<button onClick={skip} className="ml-4">
					<SkipIcon fill={buttonColor} />
				</button>
			</div>

			<button>
				<RepeatIcon fill={buttonColor} />
			</button>
		</div>
	);
}

export default PlaybackControls;
