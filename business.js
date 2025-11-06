// Adam Nashbat, 60304819, INFS3201 Assignment 2
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

/**
 * Saves all photo data to persistence.
 * @async
 * @function
 * @returns {Promise<void>} A promise that resolves when the data has been saved.
 */
async function savePhotos(photoList) {
    return await persistence.savePhotosData(photoList)
}

/**
 * Updates the title and description of a specific photo.
 * @async
 * @function
 * @param {number} photoId - The ID of the photo to update.
 * @param {string} title - The new title for the photo.
 * @param {string} description - The new description for the photo.
 * @returns {Promise<Object|null>} The updated photo object, or null if the photo was not found.
 */
async function updatePhotoDetails(photoId, title, description, visibility) {
  const photos = await loadPhotos()
  let photo = null
  for (let i of photos) {
    if (i.id == photoId) {
      photo = i
      break
    }
  }
  if (!photo){
    return null
  }
  photo.title = title
  photo.description = description
  if (visibility == 'public' || visibility == 'private'){
    photo.visibility = visibility
  }
  await savePhotos(photos)
  return photo
}

async function canViewPhoto(username,photo) {
  if(photo.visibility === 'public'){
    return true
  }
  return photo.ownerUsername === username
  
}

async function canEditPhoto(username,photo) {
  return photo.ownerUsername === username
  
}

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

async function addComment(photoId,username,commentText) {
  return await persistence.addComment({
    id: Date.now(),
    photoId:photoId,
    username:username,
    text:commentText,
    createdAt:new Date()
  })
}
async function getCommentsByPhoto(photoId) {
  return await persistence.getCommentByPhoto(photoId)
}

/**
 * Finds and returns a photo by its ID.
 * @async
 * @function
 * @param {number} photoId - The ID of the photo to find.
 * @returns {Promise<Object|null>} The photo object if found, or null if not found.
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
 * Retrieves an album by its ID.
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
 * Returns all photos that belong to a given album.
 * @async
 * @function
 * @param {number} albumId - The ID of the album to retrieve photos for.
 * @returns {Promise<Object[]>} An array of photo objects belonging to the album.
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

async function checkLogin(username, password) {
    let user = await persistence.getUserDetails(username)
    let hashedPassword = crypto.createHash('sha256').update(password).digest('hex')
    console.log(hashedPassword)
    if(user!==null && user.username===username && user.password===hashedPassword){
        return true
    }
    return false
}

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

async function getSessionData(key) {
    return await persistence.getSessionData(key)
}
  


async function deleteSession(key) {
    return await persistence.deleteSession(key)
}

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
    for (let i = 0; i < users.length; i++) {
      if (users[i].id === id) {
        unique = false
        break
      }
    }
  }
  let hashedPassword = crypto.createHash('sha256').update(password).digest('hex')

  let newUser = {
    id,
    username,
    password : hashedPassword,
    firstName,
    lastName,
    email
  }
  users.push(newUser)
  await persistence.saveUserData(users)
  return true
}

module.exports = {
    loadAlbum,
    loadPhotos,
    savePhotos,
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
    getCommentsByPhoto
}