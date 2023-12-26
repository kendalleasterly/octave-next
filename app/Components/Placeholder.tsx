import PlaceholderLight from "../Images/placeholder-light.svg"
import PlaceholderDark from "../Images/placeholder-dark.svg"
import { useRecoilValue } from 'recoil'
import { isDarkAtom } from "../Global/atoms"
import { ReactComponentElement } from "react"

export function usePlaceholder() {

    const isDark = useRecoilValue(isDarkAtom)

    function getPlaceholder() {

        return isDark ? <PlaceholderLight className = "rounded-md"/> : <PlaceholderDark className = "rounded-md"/>
       
    }


    return  {getPlaceholder}
}

