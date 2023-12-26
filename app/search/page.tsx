'use client'

import { useSpotifyModel } from "../Models/SpotifyModel"
import { useEffect, useState } from "react"

import AlbumComponent from "../Components/Album"
import Song from "../Components/Song"
import SearchIcon from "../Images/search.svg"
import CloseIcon from "../Images/close.svg"
import { useRecoilState, useSetRecoilState } from "recoil"
import { headerTextAtom, searchTermAtom } from "../Global/atoms"
import { Album, Track } from "../Models/typedefs"

function Search() {
	const [oldSearchTerm, setOldSearchTerm] = useState("")
	const [searchResults, setSearchResults] = useState<(Track | Album)[]>([])
	const [searchTerm, setSearchTerm] = useRecoilState(searchTermAtom)
	const setHeaderText = useSetRecoilState(headerTextAtom)
	const spotifyModel = useSpotifyModel()

	useEffect(() => {

        if (document) {
            const element: HTMLInputElement | null = document.getElementById("search-input") as HTMLInputElement | null

            if (element) {
                element.focus()

                setHeaderText("Search")

                if (searchTerm !== "") {
                    element.value = searchTerm
                    getSearchResults(searchTerm)
                } 
            }
        }

	}, [setHeaderText]) //TODO test this why use this as dependency

	function getSearchResults(searchTerm: string) {
		if (searchTerm !== "") {
			if (searchTerm.length >= 3 && searchTerm.trim() !== oldSearchTerm) {
				spotifyModel
					.getToken()
					.then(async (token) => {
						const results = await spotifyModel.fetchSearchResults(
							token,
							searchTerm
						)

						setSearchResults(results)

						setOldSearchTerm(searchTerm)
					})
					.catch((err) => {
						console.log("error getting search results was: " + err)
					})
			}
		} else {
			setSearchResults([])
		}
	}

	function clearSearchInput() {
		const searchField = document.getElementById("search-input") as HTMLInputElement | undefined

        if (searchField) {
            searchField.value = ""
            setSearchResults([])
            searchField.focus()
        }
	}

	return (
		<div className="space-y-8">
			<div
				className={
					"bg-gray-100 dark:bg-gray-800 rounded-2xl md:rounded-xl px-4 py-2 flex space-x-4 md:space-x-2.5 focus-within:bg-gray-50 dark:focus-within:bg-gray-700 duration-200"
				}
			>
				<SearchIcon fill="#A1A1AA" className="my-auto icon" />

				<input
					type="text"
					id="search-input"
					className="bg-transparent w-full text font-normal focus:outline-none "
					placeholder="Songs and Albums"
					onChange={(event) => {
						getSearchResults(event.target.value)
						setSearchTerm(event.target.value)
					}}
				/>

				<button onClick={clearSearchInput}>
					<CloseIcon style={{ fill: "#A1A1AA" }} className="close-icon" />
				</button>
			</div>

			<div className="space-y-8">
				{searchResults.map((searchResult, key) => {

					if (searchResult instanceof Track) {
						return <Song track={searchResult} index={key} key = {key}/>
					} else {
						return <AlbumComponent album={searchResult} index={key} key = {key}/>
					}
				})}
			</div>
		</div>
	)
}

export default Search
