import PlaceholderLight from "../Images/placeholder-light.svg"
import PlaceholderDark from "../Images/placeholder-dark.svg"
import PlaceholderLightURL from "../Images/placeholder-light.svg?url"
import PlaceholderDarkURL from "../Images/placeholder-dark.svg?url"
import { useRecoilValue } from 'recoil'
import { isDarkAtom } from "../Global/atoms"

export function usePlaceholder() {

    const isDark = useRecoilValue(isDarkAtom)

    function getPlaceholder(isUrl?: boolean) {

        if (isDark) {
            return isUrl ? PlaceholderLightURL : PlaceholderLight
        } else {
            return isUrl ? PlaceholderDarkURL : PlaceholderDark
        }
    }


    return  {getPlaceholder}
}

