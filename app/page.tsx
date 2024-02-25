"use client"

import { useEffect, useState } from 'react'
import { useRecoilState, useRecoilValue } from 'recoil'
import { headerTextAtom, isDarkAtom } from './Global/atoms'
import { accountAtom } from './Models/AccountModel'
import { Playlist, usePlaylistModel } from './Models/PlaylistModel'
import { PlaylistArtwork } from './playlist/[playlistID]/PlaylistComponents'
import Link from 'next/link'

function Home() {

    console.log("rendering home")

    const setHeaderText = useRecoilState(headerTextAtom)[1]
    const account = useRecoilValue(accountAtom)
    const isDark = useRecoilValue(isDarkAtom)
    const playlistModel = usePlaylistModel()
    const [accountPlaylists, setAccountPlaylists] = useState<{[key: string]: Playlist}>({})

    useEffect(() => {
        setHeaderText("Home")

        for (const simplePlaylist of account.simplePlaylists) {

            console.log("updating the local playlist")

            playlistModel.getPlaylist(simplePlaylist.id).then((playlist => {
                accountPlaylists[playlist.id] = playlist
                setAccountPlaylists(accountPlaylists)
                console.log("now we have", {accountPlaylists})
            }))
        }
    }, [account.simplePlaylists, accountPlaylists])

    return (
        <div className='text'>
            {account.isSignedIn && 
            
                <div className="space-y-12">

                <p>account is signed in!!</p>

                         {Object.values(accountPlaylists).map((playlist, key) => {
                            return (
                                <Link href={"/playlist/"+playlist.id} key = {key}>
                                    <div className='w-min bg-gray-800'>
                                    <div className="w-full max-w-sm md:w-52 md:h-52 mx-auto aspect-square md:mx-0 md:max-w-none">
                                    <PlaylistArtwork playlist={playlist} isDark={isDark}/>
                                    </div>
                                    
                                    <p>{playlist.title}</p>
                                    </div>
                                    
                                </Link>
                            
                            )  
                         })}
                </div>
               

            }


             <p>these are all the public playlists:</p>
        </div>
    )
}

export default Home
