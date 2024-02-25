"use client"

import "./App.css"
import "./globals.css"

import {
	useRecoilState,
	useRecoilValue,
	useSetRecoilState,
} from "recoil"
import Notification from "./Components/Notification"

import Player from "./Components/Player"
import Menu from "./Components/Menu"
import {
	contextSelectionAtom,
	headerTextAtom,
	isDarkAtom,
	timelineIsActiveAtom,
} from "./Global/atoms"
import Timeline from "./Timeline"
import { notificationsAtom } from "./Models/NotificationModel"
import { ReactNode, useEffect, useRef, useState } from "react"
import SmallMenu from "./Components/SmallMenu"
import { useAccountModel } from "./Models/AccountModel"

import { usePathname } from "next/navigation"

export default function AppLayout({ children }: { children: ReactNode }) {
	console.log("rendering AppLayout")

	const [timelineIsActive, setTimelineIsActive] =
		useRecoilState(timelineIsActiveAtom)
	const isDark = useRecoilValue(isDarkAtom)
	const notifications = useRecoilValue(notificationsAtom)
	const headerText = useRecoilValue(headerTextAtom)
	const pathname = usePathname()
	const accountModel = useAccountModel()
	const setContextSelection = useSetRecoilState(contextSelectionAtom)

    const bodyRef = useRef(null) as {current: HTMLDivElement | null}
    const [isClient, setIsCLient] = useState(false)

	useEffect(() => {
		setTimelineIsActive(false)
		setContextSelection(-1)
	}, [pathname])

	useEffect(() => {
		accountModel.checkForGoogleRedirect()
	}, [])

	useEffect(() => {
		
		accountModel.getAccount()
		console.log("in empty use effect")

        setIsCLient(true)

        if (bodyRef.current) {
            console.log("changed className to", getClassName())
            bodyRef.current.className = getClassName()
        } else {
            console.log("didn't change className to", getClassName())
        }

	}, [accountModel])

	useEffect(() => {
		console.log("changed", isDarkAtom.toJSON())
	}, [isDarkAtom])

	return (
        isClient ?
		<div id="color-scheme" ref = {bodyRef} className={getClassName()}>
			<div id="app-notifications-player" className="bg-white dark:bg-gray-900">
				<div className="hidden fixed bottom-16 py-6 px-8 space-y-4 md:block mb-2 z-auto w-full">
					{notifications.map((notification, key) => {
						return <Notification notificationObject={notification} key={key} />
					})}
				</div>

				<div className="fixed bottom-14 py-6 px-8 space-y-4 md:hidden w-screen mb-2">
					{notifications.length > 0 && (
						<Notification notificationObject={notifications[0]} />
					)}
				</div>
				<div className="content-with-player md:pb-23" id="main-content">
					<div className="main">
						<div className="medium-only border-r h-fullscreen overflow-scroll overscroll-contain dark:border-gray-700 border-gray-200 pt-10 pl-12 pb-4">
							<Menu />
						</div>

						<div
							id="content"
							className={
								"px-6 pt-4 md:pl-10 md:pt-10 md:pr-12 pb-28 md:pb-4 h-fullscreen overflow-scroll overscroll-contain " +
								(pathname.includes("/album") ? "space-y-3" : "space-y-6")
							}
							onScroll={() => setContextSelection(-1)}
						>
							<ConditionalSmallMenu />

							{timelineIsActive ? <Timeline /> : children}
						</div>
					</div>
				</div>
				<Player />
			</div>
		</div>
        :
        <div>{children}</div>
        
	)

	function ConditionalSmallMenu() {
		if (typeof window !== "undefined") {
			if (headerText !== "" || window.innerWidth < 768) {
				return <SmallMenu />
			}
		}
		return null
	}

	function getClassName() {

		if (isDark) {
			return "dark"
		} else {
			return ""
		}
	}
}
