import { Album } from "../Models/typedefs"
import ObjectRow from "./ObjectRow"
import Disclosure from "@/public/Images/disclosure.svg"
import { useRecoilValue } from "recoil"
import { isDarkAtom } from "../Global/atoms"
import { useRouter } from "next/navigation"

function AlbumComponent({album, index}: {album: Album, index: number}) {
	//TODO: when adding a song to the global queue, make sure you increase the playbackObject.positon by the queue length
	const router = useRouter()
	const isDark = useRecoilValue(isDarkAtom)

	function goToAlbum() {
		router.push("/album/" + album.id)
	}

	return (
	<ObjectRow object={album} playFunction={goToAlbum} index = {index}>
		<button className="my-auto" >
				<Disclosure fill = {isDark ? "#FFFFFF" : "#3F3F46"}/>
			</button>
	</ObjectRow>)
}

export default AlbumComponent
