import { useRef } from "react";
import { atom } from "recoil";


export function useReferences() {

    const audioReference = useRef(null)
    const bodyReference = useRef(null)

    return {audioReference, bodyReference}
}