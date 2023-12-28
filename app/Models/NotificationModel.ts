// "use client"

import {atom, useRecoilState} from "recoil"

export class NotificationObject {
    constructor(
        public title: string,
        public description: string = "",
        public iconType: "collection success" | "collection error" | "success" | "error" | "" = "",
        ) {}
}

const notifications: NotificationObject[] = []

export const notificationsAtom = atom({
    key: "notifications",
    default: notifications
})


export function useNotificationModel() {
    const [notifications, setNotifications] = useRecoilState(notificationsAtom)
    
    function add(notification: NotificationObject) {
        
        setNotifications([...notifications, notification])

    }

    return {add}
}



// module.exports = {NotificationObject}