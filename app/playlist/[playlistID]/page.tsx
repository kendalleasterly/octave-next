import { useRouter } from "next/navigation";

export default function Playlist({params}:{params: {playlistID: string}}) {


    return (
        <div>
            Playlist {params.playlistID}
        </div>
    );
}