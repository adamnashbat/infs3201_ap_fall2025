// Adam Nashbat, 60304819, INFS3201 Assignment 2
const fs = require('fs/promises')
/**
 * Loads all album data from albums.json.
 * @async
 * @returns {Promise<Object[]>} A promise that resolves to an array of album objects.
 */
async function loadAlbumData() {
    let albums = await fs.readFile("albums.json", "utf8")
    let result = JSON.parse(albums)
    return result
}

/**
 * Loads all photo data from photos.json.
 * @async
 * @returns {Promise<Object[]>} A promise that resolves to an array of photo objects.
 */
async function loadPhotosData() {
    let photos = await fs.readFile("photos.json", "utf8")
    let result = JSON.parse(photos)
    return result
}
// async function saveAlbumsData(albumList) {
//     let nunu = albumList
//     nunu = JSON.stringify(nunu)
//     fs.writeFile('albums.json', nunu)
// }

/**
 * Saves the given photo list back to photos.json.
 * @async
 * @param {Object[]} photoList - The updated array of photo objects.
 * @returns {Promise<void>}
 */
async function savePhotosData(photoList) {
    let nunu = photoList
    nunu = JSON.stringify(nunu)
    await fs.writeFile('photos.json', nunu)
}
/**
 * Loads all user data from users.json.
 * @async
 * @returns {Promise<Object[]>} A promise that resolves to an array of user objects.
 */
async function loadUserData() {
    let users = await fs.readFile("users.json", "utf8")
    let result = JSON.parse(users)
    return result
}

module.exports = {
    loadAlbumData,
    loadPhotosData,
    savePhotosData,
    loadUserData
}