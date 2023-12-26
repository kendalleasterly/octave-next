'use client'

import { atom } from "recoil"
import { PlaybackObject } from "../Models/typedefs"


export const isPlayingAtom = atom({
    key: "isPlaying",
    default: false
})

export const currentPlaybackObjectAtom = atom({
    key: "playbackObject",
    default: new PlaybackObject() 
})

let emptyQueue: PlaybackObject[] = []

export const queueAtom = atom({
    key:"queue",
    default: emptyQueue
})

export const timelineIsActiveAtom = atom({
    key:"timelineIsActive",
    default: false
})

export const headerTextAtom = atom({
    key: "headerText",
    default: ""
})

export const searchTermAtom = atom({
    key: "searchTerm",
    default: ""
})

export const menuIsActiveAtom = atom({
    key: "menuIsActive",
    default: false
})

export const shouldPlayAtom = atom({
    key: "shouldPlay",
    default: true
})

export const shufflingAtom = atom({
    key: "shuffling",
    default: false
})

export const contextSelectionAtom = atom({
    key: "contextSelection",
    default: -1
})


//MARK: Settings

function getLSBool(setting: string) {


    if (typeof window !== "undefined") {
        const LSBool = localStorage.getItem(setting)

        return LSBool === "true"
    } else {
        console.log("chose not to get the value")
    }

    return false

    
}

export const isDarkAtom = atom({
    key: "isDark",
    default: getLSBool("isDark")
})