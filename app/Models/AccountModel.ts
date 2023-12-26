import axios from "axios"
import { atom, useRecoilState } from "recoil"
import { auth, db } from "../Global/firebase"
import { NotificationObject, useNotificationModel } from "./NotificationModel"
import { useTrackModel } from "./TrackModel"
import { GoogleAuthProvider, getRedirectResult, signInWithRedirect } from "firebase/auth"
import { Timestamp, collection, deleteField, doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, updateDoc } from "firebase/firestore"
import { SimplePlaylist, Track } from "./typedefs"
import { update } from "firebase/database"

type SavedTracks = {[key: string]: {id:string, dateAdded: Date}}


const stuff = {"BrVRQL4fVJPCgTI9Coct97TRJqf1": {
    date: "123",
    id: "llskdfjlsf"
}, "zBDy5X0D0PbI63xsOMewVsKO1hw2": {
    date: "345",
    id: "xcv,mxmc,"
}}

class Account {
    constructor(
        public isSignedIn: boolean, 
        public name: string, 
        public email: string, 
        public uid: string, 
        public simplePlaylists: SimplePlaylist[],
        public savedTracks: SavedTracks) {}
}

export const accountAtom = atom({
    key: "account",
    default: new Account(false, "", "", "", [], {})
})

export function useAccountModel() {

    const notificationModel = useNotificationModel()
    const trackModel = useTrackModel()
    const [account, setAccount] = useRecoilState(accountAtom)

    function signIn() {
		var provider = new GoogleAuthProvider()
        
        signInWithRedirect(auth, provider)
	}

    function getAccount() {
        auth.onAuthStateChanged(user => {
            if (user) {
                if (!account.isSignedIn) {

                    const docRef = doc(db, "users", user.uid)

                    onSnapshot(docRef, doc => {

                        if (doc.exists()) {

                            const simplePlaylists = doc.data().simplePlaylists
                            
                            let savedTracks: SavedTracks = {}

                            Object.values(doc.data().savedTracks).map((value) => {

                                const track = value as {id: string, dateAdded: Timestamp}
                                if (track.id && track.dateAdded) {
                                    savedTracks[track.id] = {
                                        id: track.id,
                                        dateAdded: track.dateAdded.toDate()
                                    }
                                }
                            })
    
                            setAccount(new Account(true, user.displayName?? "", user.email?? "", user.uid, simplePlaylists, savedTracks))
                        } else {

                            setDoc(docRef, {
                                name: user.displayName,
                                email: user.email,
                                simplePlaylists: [],
                                savedTracks: {}
                            })

                            setAccount(new Account(true, user.displayName?? "", user.email?? "", user.uid, [], {}))

                        }
                    })
                }
            } else {
                console.log("there is no user")
                setAccount(new Account(false, "", "", "", [], {}))
            }
        })
    }

    function signOut() {
        auth.signOut()
        .then(() => {

            notificationModel.add(new NotificationObject("Signed Out", "You were successfully signed out of your account", "success"))

        })
        .catch(error => {
            console.log("error signing out user", error)

            notificationModel.add(new NotificationObject("Couldn't sign you out", "Sorry, there was an error signing you out.", "error"))
        })
    }

    function checkForGoogleRedirect() { //TEST
        getRedirectResult(auth)
        .then(result => {

            if (result) { //only runs when there was a redirect

                console.log("there was a redirect")

                const user = result.user
                notificationModel.add(new NotificationObject("We've signed you in", `You've been signed in as ${user.displayName}. View the settings page to log out at any time.`, "success"))

                //get or set their data

                const docRef = doc(db, "users", user.uid) 
                getDoc(docRef)
                .then(doc => {

                    console.log("got data from redirect result")

                    if (!doc.exists()) { //we need to set the data in firebase because it's not there yet //TEST

                        setDoc(docRef, {
                            name: user.displayName,
                            email: user.email,
                            simplePlaylists: [],
                            savedTracks: []
                        })
                    }
                })
            }
        })
        .catch(error => {
            console.log("error getting redirect result", error)

            notificationModel.add(new NotificationObject("Couldn't sign you in", "Sorry, there was an error signing you in.", "error"))
        })
    }

    function saveTrack(track: Track) {

        let accountRef = doc(db, "users", account.uid)

        let updatedData: any = {}
        updatedData["savedTracks." + track.id] = {
            id: track.id,
            dateAdded: serverTimestamp()
        }

        updateDoc(accountRef, updatedData)
        .then(() => {

            trackModel.addTrackToDatabase(track) //TODO: make this a cloud functions side-effect

            notificationModel.add(new NotificationObject(`Saved ${track.title}`, `${track.title} was successfully saved to your library.`, "success"))
        })
        .catch(error => {
            console.log("error adding track to library", error)
            notificationModel.add(new NotificationObject(`Couldn't Save ${track.title}`, `${track.title} couldn't be saved to your library.`, "error"))
        })
    }

    function removeTrack(track: Track) {
 
        let accountRef = doc(db, "users", account.uid)

        let updatedData:any = {}
        updatedData["savedTracks." + track.id] = deleteField()

        updateDoc(accountRef, updatedData)
        .then(() => {
            notificationModel.add(new NotificationObject(`Removed ${track.title}`, `${track.title} was successfully removed from your library.`, "success"))
        })
        .catch(error => {
            console.log("error removing track from library", error)

            notificationModel.add(new NotificationObject(`Couldn't Remove ${track.title}`, `${track.title} couldn't be removed from your library.`, "error"))
        })
    }

    return {signIn, checkForGoogleRedirect, getAccount, signOut, saveTrack, removeTrack}
}