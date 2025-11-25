// Adam Nashbat - 60304819, Saif Al Deen Judeh - 60306539, INFS3201 Project
const persistence = require("./persistence.js")
const crypto = require('crypto')
/**
 * Loads all album data from persistence.
 * @async
 * @function
 * @returns {Promise<Object[]>} A promise that resolves to an array of album objects.
 */
async function loadAlbum() {
    return await persistence.loadAlbumData()
}

/**
 * Loads all photo data from persistence.
 * @async
 * @function
 * @returns {Promise<Object[]>} A promise that resolves to an array of photo objects.
 */
async function loadPhotos() {
    return await persistence.loadPhotosData()
}

async function addPhoto(photoData) {
  let photos = await loadPhotos()

  let newId = 1
  for(let i=0; i<photos.length;i++){
    let p = photos[i]
    if (typeof p.id === 'number' && p.id >=newId){
      newId = p.id+1
    }
  }
  let photo ={
    id : newId,
    filename: photoData.filename,
    ownerUsername:photoData.ownerUsername,
    title:photoData.title,
    description: photoData.description,
    visibility:"private",
    tags:[],
    albums:photoData.albums
  }

  await persistence.addPhoto(photo)
  return photo
}


/**
 * Updates details of a specific photo, enforcing that only the owner can edit it.
 * @async
 * @function
 * @param {number} photoId - The ID of the photo to update.
 * @param {string} user - The username of the user attempting the update.
 * @param {string} title - The new title for the photo.
 * @param {string} description - The new description for the photo.
 * @param {'public'|'private'} visibility - The new visibility status of the photo.
 * @throws {Error} If the user is not allowed to edit the photo.
 * @returns {Promise<Object|null>} The updated photo object, or null if photo not found.
 */
async function updatePhotoDetails(photoId, user, title, description, visibility) {
    const photo = await findPhoto(photoId);
    if (!photo) return null

    if (photo.ownerUsername !== user) {
        throw new Error('User not allowed to edit this photo')
    }

    const fieldsToUpdate = { title, description };
    if (visibility === 'public' || visibility === 'private') fieldsToUpdate.visibility = visibility

    const updated = await persistence.updatePhotoById(photoId, fieldsToUpdate)
    return updated
}



/**
 * Determines whether a user is allowed to view a given photo.
 * @async
 * @function
 * @param {string} username - The username of the user attempting to view the photo.
 * @param {Object} photo - The photo object to check.
 * @returns {Promise<boolean>} True if the user can view the photo, false otherwise.
 */
async function canViewPhoto(username,photo) {
  if(photo.visibility === 'public'){
    return true
  }
  return photo.ownerUsername === username
  
}


/**
 * Determines whether a user is allowed to edit a given photo.
 * @async
 * @function
 * @param {string} username - The username of the user attempting to edit the photo.
 * @param {Object} photo - The photo object to check.
 * @returns {Promise<boolean>} True if the user owns the photo, false otherwise.
 */
async function canEditPhoto(username,photo) {
  return photo.ownerUsername === username
  
}

/**
 * Retrieves all photos from a given album that are visible to a specific user.
 * @async
 * @function
 * @param {number} albumId - The ID of the album to check.
 * @param {string} username - The username of the user requesting visibility.
 * @returns {Promise<Object[]>} An array of photo objects visible to the user.
 */
async function albumPhotoListVisibleToUser(albumId, username) {
  const photos= await loadPhotos()
  let out = []
  let targetId = Number(albumId)
  for(let i of photos){
    let inAlbum = false
    for(let a of i.albums){
      if(Number(a)===targetId){
        inAlbum = true 
        break
      }
    }
    if (!inAlbum){
      continue
    }
    let visible = await canViewPhoto(username,i)
    if(visible){
      out.push(i)
    }
  }
  return out
}


/**
 * Adds a new comment to a specific photo.
 * @async
 * @function
 * @param {number} photoId - The ID of the photo to comment on.
 * @param {string} username - The username of the user adding the comment.
 * @param {string} commentText - The text of the comment.
 * @returns {Promise<Object>} The newly created comment object.
 */
async function addComment(photoId,username,commentText) {
  return await persistence.addComment({
    id: Date.now(),
    photoId:photoId,
    username:username,
    text:commentText,
    createdAt:new Date()
  })
}


/**
 * Retrieves all comments associated with a specific photo.
 * @async
 * @function
 * @param {number} photoId - The ID of the photo.
 * @returns {Promise<Object[]>} A list of comment objects for that photo.
 */
async function getCommentsByPhoto(photoId) {
  return await persistence.getCommentByPhoto(photoId)
}

/**
 * Finds and returns a specific photo by its ID.
 * @async
 * @function
 * @param {number} photoId - The ID of the photo to find.
 * @returns {Promise<Object|null>} The photo object if found, or null otherwise.
 */
async function findPhoto(photoId) {
  const photos = await loadPhotos()
  for (let i of photos) {
    if (i.id == photoId) {
      return i
    }
  }
  return null
}

/**
 * Retrieves a specific album by its ID.
 * @async
 * @function
 * @param {number} albumId - The ID of the album to retrieve.
 * @returns {Promise<Object|null>} The album object if found, or null otherwise.
 */
async function getAlbumById(albumId) {
  const albums = await loadAlbum()
  let album = null
  for (let i of albums) {
    if (i.id === albumId) {
      album = i
      break
    }
  }
  return album
}

/**
 * Retrieves all photos that belong to a specific album, regardless of visibility.
 * @async
 * @function
 * @param {number} albumId - The ID of the album.
 * @returns {Promise<Object[]>} A list of photo objects associated with the album.
 */
async function albumPhotoList(albumId) {
  const photos = await loadPhotos()
  let albumPhotos = []
  for (let i of photos) {
    for (let a of i.albums) {
      if (a === albumId) {
        albumPhotos.push(i)
        break;
      }
    }
  }
  return albumPhotos
}


/**
 * Verifies a user's login credentials by comparing the provided password with the stored salted hash.
 * @async
 * @function
 * @param {string} username - The username to authenticate.
 * @param {string} password - The plain-text password to verify.
 * @returns {Promise<boolean>} True if credentials are valid, false otherwise.
 */
async function checkLogin(username, password) {
    let user = await persistence.getUserDetails(username)
    if(!user) return false

    let [salt, storedHash] = user.password.split('$')
    if(!salt || !storedHash) return false
    let hashedPassword = crypto.createHash('sha256').update(salt + password).digest('hex')
    if(user.username === username && storedHash === hashedPassword){
        return true
    }
    return false
}


/**
 * Starts a new session for a logged-in user and stores it in persistence.
 * @async
 * @function
 * @param {Object} data - Arbitrary session data (e.g., username).
 * @returns {Promise<Object>} The created session object including key, expiry, and data.
 */
async function startSession(data) {
    let sessionKey = crypto.randomUUID()
    let expiry = new Date(Date.now() + 5 * 60 * 1000 )
    let sessionData = {
      sessionKey,
      expiry,
      data:data,
    }
    await persistence.saveSession(sessionData.sessionKey, sessionData.expiry, sessionData.data)
  
    return sessionData
}


/**
 * Retrieves session data associated with a given session key.
 * @async
 * @function
 * @param {string} key - The session key.
 * @returns {Promise<Object|null>} The session data if found, or null otherwise.
 */
async function getSessionData(key) {
    return await persistence.getSessionData(key)
}
  

/**
 * Deletes an existing session by its session key.
 * @async
 * @function
 * @param {string} key - The session key to delete.
 * @returns {Promise<void>} A promise that resolves when the session has been deleted.
 */
async function deleteSession(key) {
    return await persistence.deleteSession(key)
}


/**
 * Registers a new user account with a salted and hashed password.
 * Ensures that the username and email are unique.
 * @async
 * @function
 * @param {string} username - The desired username.
 * @param {string} password - The plain-text password.
 * @param {string} firstName - The user's first name.
 * @param {string} lastName - The user's last name.
 * @param {string} email - The user's email address.
 * @returns {Promise<boolean>} True if registration succeeds, false if username/email already exist.
 */
async function addUser(username, password, firstName, lastName, email){
  let users = await persistence.loadUserData()
  for(let i of users){
    if (i.username==username || i.email==email){
      return false
    }
  }
  let id;
  let unique = false;
  while (!unique) {
    id = Math.floor(Math.random() * 1000000);
    unique = true
    for (let i of users) {
      if (i.id === id) {
        unique = false
        break
      }
    }
  }

  let salt = crypto.randomBytes(8).toString('hex')
  let hashedPassword = crypto.createHash('sha256').update(salt + password).digest('hex')
  let storedPassword = `${salt}$${hashedPassword}`

  let newUser = {
    id,
    username,
    password : storedPassword,
    firstName,
    lastName,
    email
  }
  users.push(newUser)
  await persistence.saveUserData(users)
  return true
}

async function getUserByUsername(username) {
  return await persistence.getUserDetails(username)
  
}



module.exports = {
    loadAlbum,
    loadPhotos,
    updatePhotoDetails,
    findPhoto,
    albumPhotoList,
    getAlbumById,
    startSession,
    getSessionData,
    deleteSession,
    checkLogin,
    addUser,
    canViewPhoto,
    canEditPhoto,
    albumPhotoListVisibleToUser,
    addComment,
    getCommentsByPhoto,
    addPhoto,
    getUserByUsername
}