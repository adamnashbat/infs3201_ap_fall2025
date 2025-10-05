// Adam Nashbat, 60304819, INFS3201 Assignment 2
const business = require("./business.js")
const prompt = require('prompt-sync')()
userInterface()
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
    let photoData = await business.loadPhotos()
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
async function tagPhotoPrompts(photoId){
    // Load data
    let photoData = await business.loadPhotos()
    for(let i of photoData){
        if (i.id===photoId){
            let tag = prompt(`What tag to add (${i.tags}, etc.): `)
            return tag
        }
    }
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
            let result = await business.findPhoto(photo)
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
                await business.updatePhotoDetails(photo,promptValues[0],promptValues[1])
                console.log("Photo Updated.")
            }
        }
        else if (selection == 3) {
            let album = prompt("What is the name of the album?: ").toLowerCase()
            let result = await business.albumPhotoList(album)
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
            let tag = await tagPhotoPrompts(photo)
            let result = await business.addTagToPhoto(photo, tag)
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