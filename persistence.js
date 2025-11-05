// Adam Nashbat, 60304819, INFS3201 Assignment 3
const fs = require('fs/promises')
const mongo = require('mongodb')

let client
let photoCollection
let userCollection
let albumCollection
let sessionData

async function connectDatabase() {
  if (!client) {
    client = new mongo.MongoClient('mongodb+srv://60304819:sixseven@s-60304819.1mdns.mongodb.net/')
    await client.connect()
    const db = client.db('infs3201_fall2025')
    photoCollection = db.collection('photos')
    albumCollection = db.collection('albums')
    userCollection = db.collection('users')
    sessionData = db.collection('sessionData')
  }
  return client.db('infs3201_fall2025')
}
async function loadAlbumData() {
  const db = await connectDatabase()
  return db.collection('albums').find({}).toArray()
}

async function loadPhotosData() {
  const db = await connectDatabase()
  return db.collection('photos').find({}).toArray()
}

async function loadUserData() {
  const db = await connectDatabase()
  return db.collection('users').find({}).toArray()
}
async function getUserDetails(username) {
    await connectDatabase()
    let user = await userCollection.findOne({ username: username })
    if (user) {
        return user
    }
    return null
}
async function savePhotosData(photoList) {
    await connectDatabase()
    for (let photo of photoList) {
        await photoCollection.updateOne(
            { id: photo.id },
            { $set: photo }
        )
    }
}

async function saveUserData(userList) {
  await connectDatabase()
  for (let user of userList) {
    await userCollection.updateOne(
      { id: user.id },
      { $set: user },
      { upsert: true }
    )
  }
}

async function saveSession(uuid, expiry, data) {
    await connectDatabase()

    await sessionData.insertOne({
        sessionKey: uuid,
        expiry: expiry,
        data: data
    })

    console.log('Session saved:', uuid);
}

async function getSessionData(key) {
    await connectDatabase()
    let session = await sessionData.findOne({ sessionKey: key })

    if (!session){
        return null
    } 
    let now = new Date()
    if (session.expiry < now) {
        await deleteSession(key)
        console.log("Session expired and deleted:", key)
        return null
    }

    return session
}
async function deleteSession(key) {
    await connectDatabase()

    let result = await sessionData.deleteOne({ sessionKey: key })
    if (result.deletedCount > 0) {
        console.log("Session deleted:", key)
    } else {
        console.log("No session found to delete:", key)
    }
}


module.exports = {
    loadAlbumData,
    loadPhotosData,
    savePhotosData,
    loadUserData,
    saveUserData,
    getSessionData,
    deleteSession,
    saveSession,
    getUserDetails
}