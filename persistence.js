// Adam Nashbat, 60304819, INFS3201 Assignment 3
const fs = require('fs/promises')
const mongo = require('mongodb')

let client
let photoCollection
let albumCollection

async function connectDatabase() {
  if (!client) {
    client = new mongo.MongoClient('mongodb+srv://60304819:sixseven@s-60304819.1mdns.mongodb.net/')
    await client.connect()
    const db = client.db('infs3201_fall2025')
    photoCollection = db.collection('photos')
    albumCollection = db.collection('albums')
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

async function savePhotosData(photoList) {
    await connectDatabase()
    for (let photo of photoList) {
        await photoCollection.updateOne(
            { id: photo.id },
            { $set: photo }
        )
    }
}

module.exports = {
    loadAlbumData,
    loadPhotosData,
    savePhotosData
}