"use client"

import { useEffect } from 'react'
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import { headerTextAtom, isDarkAtom } from '../Global/atoms';
import { accountAtom, useAccountModel } from '../Models/AccountModel';

function Settings() {

    const [isDark, setIsDark] = useRecoilState(isDarkAtom)
	const setHeaderText = useSetRecoilState(headerTextAtom)
	const account = useRecoilValue(accountAtom)
	const accountModel = useAccountModel()

	useEffect(() => {
		setHeaderText("Settings")
	})

	function setNewIsDark(newIsDark:boolean) {

		console.log("running function")

        setIsDark(newIsDark)
       

        localStorage.setItem("isDark", newIsDark ? "true": "false")
    }

    return (
			<div className = "flex flex-col">

				<button onClick = {account.isSignedIn ? accountModel.signOut : accountModel.signIn} className = "text text-left">
					{account.isSignedIn ? "Sign Out" : "Sign In"}
				</button>

				<button className="text text-left" onClick={() => setNewIsDark(!isDark)}>
					Dark Mode: {isDark ? "on" : "off"}
				</button>

			</div>
		);
}

export default Settings
