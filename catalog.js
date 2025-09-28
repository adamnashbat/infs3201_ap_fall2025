// Adam Nashbat, 60304819, INFS3201 Assignment 1
const fs = require('fs/promises')
const prompt = require('prompt-sync')()
userInterface()
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
 * Finds a photo by its ID and returns its details.
 * @async
 * @param {number} photoId - The ID of the photo to find.
 * @returns {Promise<("empty" | null | Array)>} 
 *   "empty" if no photos exist, null if not found, or an array with 
 *   [filename, title, date, albumNames[], tags[]].
 */
async function findPhoto(photoId){
    // Load data
    let albumData = await loadAlbumData()
    let photoData = await loadPhotosData()
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
 * Prompts the user for updated title and description.
 * Pressing Enter reuses the existing values.
 * @async
 * @param {number} photoId - The ID of the photo to update.
 * @returns {Promise<[string, string] | null>} 
 *   Returns [title, description] or null if photo not found.
 */
async function updatePhotoPrompts(photoId) {
    // Load data
    let photoData = await loadPhotosData()
    for(let i of photoData){
        if (i.id===photoId){
            console.log("Press Enter to reuse existing value. ")
            let title = prompt("Enter value for title [" + i.title + "]: ")
            let description = prompt("Enter value for description [" + i.description + "]: ")
            return [title, description]
        }
    }
    //If the function does not return during the for loop, it will come here, indicating no photo ID was found.
    return null
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
    let photoData = await loadPhotosData()
    for(let i of photoData){
        if(i.id===photoId){
            if (title!==""){ // If the users input is not empty, then change the title.
                i.title = title
            }
            if (description!==""){ // Same deal here. If not empty, change.
                i.description = description
            }
            await savePhotosData(photoData)
            return
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
    let albumData = await loadAlbumData()
    let photoData = await loadPhotosData()
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
    let photoData = await loadPhotosData()
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
                await savePhotosData(photoData)
                return
            }
        }
    }
    return null
}
/**
 * Main user interface loop. Displays the menu and handles user input (Errors as well).
 * @async
 * @returns {Promise<void>}
 */
async function userInterface(){
    // The user interface main menu. The loop will keep going till the user enters the number 5 to exit.
    while (true) {
        console.log('<Photo Catalog>')
        console.log('1. Find Photo')
        console.log('2. Update Photo Details')
        console.log('3. Album Photo List')
        console.log('4. Tag Photo')
        console.log('5. Exit')
        let selection = Number(prompt("Your selection> "))
        if (selection == 1) {
            let photo = Number(prompt("Photo ID?: "))
            let result = await findPhoto(photo)
            if (result === 'empty'){
                console.log("No photos")
            }
            else if (result === null){
                console.log("Photo ID not found.")
            }
            else{
                // The output of the findPhoto function is in a list, and then to print it I put it in a loop.
                // I made a list called order to print it like it was shown in the assignment.
                let order = ["File name", "Title", "Date", "Albums", "Tags"]
                for (let m = 0;m<result.length;m++){
                    let i = result[m]
                    // If it is an array, print each item seperated by a comma and space. If not, just print it as it is.
                    if(Array.isArray(i)){ 
                        console.log(`${order[m]}: ${i.join(", ")}`)
                    }
                    else{
                        console.log(`${order[m]}: ${i}`)
                    }
                }
            }
        }
        else if (selection == 2){
            let photo = Number(prompt("Photo ID?: "))
            // Made this function for the prompts specifically, as they needed data to be loaded so it can show the user what the current title/description is.
            // I didn't want to load the data and do all the work in the user interface function, so I made its own function.
            let promptValues = await updatePhotoPrompts(photo)
            if (promptValues === null){
                console.log("Photo ID not found.")
            }

            else{
                // The actual editing of the file is done in this function.
                await updatePhotoDetails(photo,promptValues[0],promptValues[1])
                console.log("Photo Updated.")
            }
        }
        else if (selection == 3) {
            let album = prompt("What is the name of the album?: ").toLowerCase()
            let result = await albumPhotoList(album)
            if (result === null){
                console.log("Album not found. ")
            }
            else{
                console.log("filename,resolution,tags")
                for (let i of result){
                    console.log(i)
                }
            }
        }
        else if (selection == 4) {
            let photo = Number(prompt("What photo ID to tag?: "))
            let tag = prompt("What tag to add (caves, rock, explore, etc.)?: ")
            let result = await addTagToPhoto(photo, tag)
            if (result === null){
                console.log("Photo not found.")
            }
            else if(result === 'exists'){
                // Let the user know if the tag they put in already exists.
                console.log("This tag already exists.")
            }
            else{
                console.log("Updated!")
            }
        }
        else if (selection == 5) {
            console.log("Exiting...")
            break
        }
        else {
            console.log('PLEASE PICK A NUMBER BETWEEN 1 AND 5!')
        }
    }
}