import PlaceholderLight from "../Images/placeholder-light.svg"
import PlaceholderDark from "../Images/placeholder-dark.svg"
import { useRecoilValue } from 'recoil'
import { isDarkAtom } from "../Global/atoms"

export function usePlaceholder() {

    const isDark = useRecoilValue(isDarkAtom)

    function getPlaceholder() {
        return isDark ? PlaceholderDark : PlaceholderLight
    }


    return  {getPlaceholder}
}

