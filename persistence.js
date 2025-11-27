// Adam Nashbat - 60304819, Saif Al Deen Judeh - 60306539, INFS3201 Project
const fs = require('fs/promises')
const mongo = require('mongodb')

let client
let photoCollection
let userCollection
let albumCollection
let sessionData
let commentCollection


/**
 * Connects to the MongoDB database and initializes collections.
 * @async
 * @function
 * @returns {Promise<mongo.Db>} The connected MongoDB database instance.
 */
async function connectDatabase() {
  if (!client) {
    client = new mongo.MongoClient('mongodb+srv://60304819:sixseven@s-60304819.1mdns.mongodb.net/')
    await client.connect()
    const db = client.db('infs3201_fall2025')
    photoCollection = db.collection('photos')
    albumCollection = db.collection('albums')
    userCollection = db.collection('users')
    commentCollection = db.collection('comments')
    sessionData = db.collection('sessionData')
  }
  return client.db('infs3201_fall2025')
}


/**
 * Adds a new comment to the database.
 * @async
 * @function
 * @param {Object} comment - The comment object to add. Must include at least id, photoId, username, text, createdAt.
 * @returns {Promise<boolean>} True when insertion is complete.
 */
async function addComment(comment){
  await connectDatabase()
  await commentCollection.insertOne(comment)
  return true
}


/**
 * Retrieves all comments for a specific photo, sorted by creation date.
 * @async
 * @function
 * @param {number} photoId - The ID of the photo.
 * @returns {Promise<Object[]>} An array of comment objects for the given photo.
 */
async function getCommentByPhoto(photoId){
  await connectDatabase()
  let docs = await commentCollection.find({photoId:photoId}).sort({createdAt:1}).toArray()
  return docs
}


/**
 * Loads all album documents from the database.
 * @async
 * @function
 * @returns {Promise<Object[]>} An array of album objects.
 */
async function loadAlbumData() {
  const db = await connectDatabase()
  return db.collection('albums').find({}).toArray()
}


/**
 * Loads all photo documents from the database.
 * @async
 * @function
 * @returns {Promise<Object[]>} An array of photo objects.
 */
async function loadPhotosData() {
  const db = await connectDatabase()
  return db.collection('photos').find({}).toArray()
}


/**
 * Loads all user documents from the database.
 * @async
 * @function
 * @returns {Promise<Object[]>} An array of user objects.
 */
async function loadUserData() {
  const db = await connectDatabase()
  return db.collection('users').find({}).toArray()
}

/**
 * Retrieves a single user document by username.
 * @async
 * @function
 * @param {string} username - The username of the user to retrieve.
 * @returns {Promise<Object|null>} The user object if found, otherwise null.
 */
async function getUserDetails(username) {
    await connectDatabase()
    let user = await userCollection.findOne({ username: username })
    if (user) {
        return user
    }
    return null
}


/**
 * Updates a single photo document by its ID, returning the updated document.
 * @async
 * @function
 * @param {number} photoId - The ID of the photo to update.
 * @param {Object} fieldsToUpdate - An object containing the fields to update.
 * @returns {Promise<Object>} The result object from MongoDB containing the updated document in `value`.
 */
async function updatePhotoById(photoId, fieldsToUpdate) {
  await connectDatabase()
  const result = await photoCollection.findOneAndUpdate(
    { id: photoId },
    { $set: fieldsToUpdate },
    { returnDocument: "after" }
  )
  return result
}


/**
 * Updates multiple user documents in the database, inserting new users if needed.
 * @async
 * @function
 * @param {Object[]} userList - An array of user objects to save.
 * @returns {Promise<void>} Resolves when all users have been updated or inserted.
 */
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


/**
 * Stores a new session in the database.
 * @async
 * @function
 * @param {string} uuid - The session key.
 * @param {Date} expiry - The expiry date of the session.
 * @param {Object} data - Arbitrary session data (e.g., username).
 * @returns {Promise<void>} Resolves when the session has been saved.
 */
async function saveSession(uuid, expiry, data) {
    await connectDatabase()

    await sessionData.insertOne({
        sessionKey: uuid,
        expiry: expiry,
        data: data
    })

    console.log('Session saved:', uuid);
}


/**
 * Retrieves session data for a given session key.
 * If the session has expired, it will be deleted and null returned.
 * @async
 * @function
 * @param {string} key - The session key.
 * @returns {Promise<Object|null>} The session object if valid, otherwise null.
 */
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


/**
 * Deletes a session from the database by its session key.
 * @async
 * @function
 * @param {string} key - The session key to delete.
 * @returns {Promise<void>} Resolves when deletion is complete.
 */
async function deleteSession(key) {
    await connectDatabase()

    let result = await sessionData.deleteOne({ sessionKey: key })
    if (result.deletedCount > 0) {
        console.log("Session deleted:", key)
    } else {
        console.log("No session found to delete:", key)
    }
}

/**
 * Inserts a new photo document into the database.
 * @async
 * @function
 * @param {Object} photo - The photo document to insert.
 * @returns {Promise<boolean>} True when insertion is complete.
 */
async function addPhoto(photo) {
  await connectDatabase()
  await photoCollection.insertOne(photo)
  return true
  
}


module.exports = {
    loadAlbumData,
    loadPhotosData,
    loadUserData,
    saveUserData,
    getSessionData,
    deleteSession,
    saveSession,
    getUserDetails,
    addComment,
    getCommentByPhoto,
    updatePhotoById,
    addPhoto 
}