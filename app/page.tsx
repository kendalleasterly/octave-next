"use client"

import { useEffect } from 'react'
import { useRecoilState } from 'recoil'
import { headerTextAtom } from './Global/atoms'

function Home() {

    console.log("rendering home")

    const setHeaderText = useRecoilState(headerTextAtom)[1]

    useEffect(() => {
        setHeaderText("Home")
    })

    return (
        <div className = "text-white">
            home
        </div>
    )
}

export default Home
