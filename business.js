// Adam Nashbat, 60304819, INFS3201 Assignment 2
const persistence = require("./persistence.js")
/**
 * Loads all album data from persistence.
 * @async
 * @function
 * @returns {Promise<Object[]>} A promise that resolves to an array of album objects.
 */
async function loadAlbum() {
    return persistence.loadAlbumData()
}

/**
 * Loads all photo data from persistence.
 * @async
 * @function
 * @returns {Promise<Object[]>} A promise that resolves to an array of photo objects.
 */
async function loadPhotos() {
    return persistence.loadPhotosData()
}
/**
 * Loads all user data from persistence.
 * @async
 * @function
 * @returns {Promise<Object[]>} A promise that resolves to an array of photo objects.
 */
async function loadUsers() {
    return persistence.loadUserData()
}

/**
 * Saves all photo data to persistence.
 * @async
 * @function
 * @returns {Promise<void>} A promise that resolves when the data has been saved.
 */
async function savePhotos() {
    return persistence.savePhotosData()
}


/**
 * Updates a photo's title and description, saving changes to the JSON file.
 * Empty strings mean the value is unchanged.
 * @async
 * @param {number} photoId - The ID of the photo to update.
 * @param {string} title - The new title (or "" to keep existing).
 * @param {string} description - The new description (or "" to keep existing).
 * @returns {Promise<null | void>} Null if not found, otherwise nothing.
 */
async function updatePhotoDetails(photoId, title, description) {
    // Load data
    let photoData = await persistence.loadPhotosData()
    for(let i of photoData){
        if(i.id===photoId){
            if (title!==""){ // If the users input is not empty, then change the title.
                i.title = title
            }
            if (description!==""){ // Same deal here. If not empty, change.
                i.description = description
            }
            await persistence.savePhotosData(photoData)
            return
        }
    }
    return null
}
/**
 * Finds a photo by its ID and returns its details.
 * @async
 * @param {number} photoId - The ID of the photo to find.
 * @returns {Promise<("empty" | null | Array)>} 
 *   "empty" if no photos exist, null if not found, or an array with 
 *   [filename, title, date, albumNames[], tags[]].
 */
async function findPhoto(photoId){
    // Load data
    let albumData = await persistence.loadAlbumData()
    let photoData = await persistence.loadPhotosData()
    if(photoData.length === 0){
        //If there are somehow no photos, let the user know it is empty.
        return "empty"
    }
    for(let i of photoData){
        if(i.id === photoId){
            let albumnames = []
            for(let n of i.albums){ //The id's of the albums
                for(let m of albumData){ //Iterate through each album
                    if(n == m.id){ // Find a match for the album ID
                        albumnames.push(m.name) //To display the name
                    } 
                }
            }
            // This is the method I used to convert the date to a readable one.
            let dateString = i.date;
            let date = new Date(dateString);
            let options = { year: "numeric", month: "long", day: "numeric" };
            let newDate = date.toLocaleDateString("en-US", options)
            return [i.filename, i.title, newDate, albumnames, i.tags]
        }
    }
    return null
}
/**
 * Returns a CSV-like list of photos from an album.
 * @async
 * @param {string} albumName - The album name, not case sensitive.
 * @returns {Promise<string[] | null>} 
 *   An array of CSV lines (filename,resolution,tags) or null if album not found.
 */
async function albumPhotoList(albumName){
    // Load data
    let albumData = await persistence.loadAlbumData()
    let photoData = await persistence.loadPhotosData()
    // Made an empty list that will be used later to hold each line, for each photo that is in the album.
    let lines = []
    for(let i of albumData){
        if (i.name.toLowerCase() === albumName){
            // Iterate through each photo
            for(let photoInfo of photoData){
                // Iterate through the albums array
                for(let n of photoInfo.albums){
                    if(n===i.id){
                        let tags = photoInfo.tags.join(":") // Join each tag with a colon
                        // Create a string which seperates each piece of data with a comma
                        lines.push(`${photoInfo.filename},${photoInfo.resolution},${tags}`)
                    }
                }
            }
            return lines
        }
    }
    return null    
}
/**
 * Adds a new tag to a photo if it does not already exist.
 * @async
 * @param {number} photoId - The ID of the photo to tag.
 * @param {string} newTag - The new tag to add.
 * @returns {Promise<"exists" | null | void>} 
 *   "exists" if tag already exists, null if photo not found, or nothing if added.
 */
async function addTagToPhoto(photoId, newTag){
    // Load data
    let photoData = await persistence.loadPhotosData()
    for(let i of photoData){
        if(i.id === photoId){
            for(let tag of i.tags){
                // Made sure it is not case sensitive. For example, there's no point in having the tags "beach" and "Beach" both present.
                if (tag.toLowerCase() === newTag.toLowerCase()){
                    return 'exists'
                }
            }
            if (newTag === ""){
                // If the user just presses Enter, it will not add "" as a tag. It will just not add anything, similar to the photo updating function.
                return
            }
            else{
                i.tags.push(newTag)
                await persistence.savePhotosData(photoData)
                return
            }
        }
    }
    return null
}
module.exports = {
    loadAlbum,
    loadPhotos,
    savePhotos,
    updatePhotoDetails,
    findPhoto,
    albumPhotoList,
    addTagToPhoto,
    loadUsers
}