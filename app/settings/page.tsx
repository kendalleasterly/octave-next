"use client"

import { useEffect } from 'react'
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import { headerTextAtom, isDarkAtom } from '../Global/atoms';
import { accountAtom, useAccountModel } from '../Models/AccountModel';
import { useReferences } from '../Global/references';

function Settings() {

    const [isDark, setIsDark] = useRecoilState(isDarkAtom)
	const setHeaderText = useSetRecoilState(headerTextAtom)
	const account = useRecoilValue(accountAtom)
	const accountModel = useAccountModel()
	const bodyRef: {current: HTMLBodyElement | null} = useReferences().bodyReference

	useEffect(() => {
		setHeaderText("Settings")
	})

	function setNewIsDark(newIsDark:boolean) {

		console.log("running function")

        setIsDark(newIsDark)

        // const bodyEl = bodyRef.current!
        
		// bodyEl.style.backgroundColor = newIsDark ? "#18181B" : "#FFFFFF"
       

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

				<p className='text'>hello world</p>

			</div>
		);
}

export default Settings
