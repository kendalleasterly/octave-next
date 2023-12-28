'use client'

import { MutableRefObject } from "react";
import { atom } from "recoil";

let typeValue: MutableRefObject<null> | null = null


export const audioRefAtom = atom({
    key:"audioReference",
    default: typeValue
})