"use client"

import React, { useEffect } from 'react'
import { useRecoilState } from 'recoil'
import { headerTextAtom } from './Global/atoms'

function Home() {

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
