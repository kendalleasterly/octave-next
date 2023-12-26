const admin = require("firebase-admin")


admin.initializeApp({
    credential: admin.credential.applicationDefault()
})


const db = admin.firestore()

function addSong(songInfo, youtubeID) {

    const docID = songInfo.id
    delete songInfo.id //removes the "id" property from the songInfo object (wow!)

    db.collection("songs").doc(docID).set({
        ...songInfo,
        youtubeID: youtubeID
    })

}

function songDoesExist(id) {

    return new Promise((resolve, reject) => {
        db.collection("songs").doc(id).get().then(doc => {

            resolve(doc.exists)

        })
    })
}

function reportMissing(songInfo, sender) {
    const docID = songInfo.id
    delete songInfo.id

    db.collection("missings").doc(docID).set({
        ...songInfo,
        sender: sender,
        lastReported: admin.firestore.Timestamp.now()
    }).then(() => {
        console.log(songInfo.title, "was reported missing")
    })
}

module.exports = {addSong, songDoesExist, reportMissing}