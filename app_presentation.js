// Adam Nashbat - 60304819, Saif Al Deen Judeh - 60306539, INFS3201 Project
const express = require('express')
const exphbs = require('express-handlebars')
const path = require('path')
const cookieParser = require('cookie-parser')
const business = require('./business.js')
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload')
const Mail = require('./email.js')

const app = express()
const port = 8000

app.engine('hbs', exphbs.engine({ extname: '.hbs', defaultLayout: 'main' }))
app.set('view engine', 'hbs')
app.set('views', path.join(__dirname, 'views'))
app.use(fileUpload())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(bodyParser.urlencoded())
/**
 * GET photo.
 * Checks user session and photo visibility before serving the photo.
 * @async
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
app.get('/photo/:id/image', requireLogin, async (req, res) => {
    const photoId = Number(req.params.id)
    const photo = await business.findPhoto(photoId)

    if (!photo) {
        return res.render('error', { msg: 'Photo not found.' })
    }


    const canView = await business.canViewPhoto(req.username, photo)
    if (!canView) {
        return res.render('error', { msg: 'You do not have access to this photo.' })
    }

   
    const photoPath = path.join(__dirname, 'public/photos', photo.filename)
    res.sendFile(photoPath)
})
app.use('/css', express.static(path.join(__dirname, 'public/css')))
let album


/**
 * Middleware to ensure a user is logged in before accessing a route.
 * If the session key is missing or expired, the user is redirected to the login page.
 * @async
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The next middleware function.
 */
async function requireLogin(req,res,next){
  const sessionKey = req.cookies.sessionkey
  if(!sessionKey){
    return res.redirect('/?message=No session found. Please log in.')
  }
  const session = await business.getSessionData(sessionKey)
  if(!session){
    return res.redirect('/?message= Session Expired')
  }
  req.username = session.data.username
  next()
}

/**
 * GET login page.
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 */
app.get('/', (req, res) => {
    res.render('login', {message: req.query.message})
})


/**
 * POST login attempt.
 * Validates credentials and starts a session.
 * @async
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
app.post('/', async (req,res) => {
    let username = req.body.username
    let password = req.body.password
    let valid = await business.checkLogin(username, password)
    if (valid){
        let sessionData = await business.startSession({username: username})
        res.cookie('sessionkey', sessionData.sessionKey, {expires:sessionData.expiry})
        res.redirect('/album-list')
    }
    else{
        res.redirect('/?message=Failed to log in - invalid credentials.')
    }
})



/**
 * GET registration page.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
app.get('/register', async(req, res)=>{
  res.render('register', {message: req.query.message})
})



/**
 * POST new user registration.
 * Creates account & starts session.
 * @async
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
app.post('/register', async(req, res)=>{
  let username = req.body.username
  let password = req.body.password
  let firstName = req.body.firstName
  let lastName = req.body.lastName
  let email = req.body.email
  let added = await business.addUser(username, password, firstName, lastName, email)
  if(!added){
    res.redirect('/register?message=Username or email already used.')
    return
  }
  let sessionData = await business.startSession({username: username})
  res.cookie('sessionkey', sessionData.sessionKey, {expires:sessionData.expiry})
  res.redirect('/album-list?message=Successfully created account. Welcome!')

})



/**
 * GET logout.
 * Clears session cookie and deletes session.
 * @async
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
app.get('/logout', async (req, res) => {
  let sessionKey = req.cookies.sessionkey
  console.log(sessionKey)
  if (sessionKey) {
    await business.deleteSession(sessionKey)
    res.clearCookie('sessionkey')
  }
  res.redirect('/')
})


/**
 * GET list of all albums.
 * Protected by login middleware.
 * @async
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
app.get('/album-list', requireLogin, async (req,res)=>{
  let sessionKey = req.cookies.sessionkey
  if (!sessionKey) {
        return res.redirect("/?message=No session found. Please log in.")
  }
  const session = await business.getSessionData(sessionKey)
  if (!session) {
    return res.redirect("/?message=Session expired")
  }
  let albums= await business.loadAlbum()
  res.render('albumList', {message:req.query.message, albums})
})



/**
 * GET a specific album and photos visible to the user.
 * @async
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
app.get('/album/:id', requireLogin, async (req, res) => {
  const albumId = Number(req.params.id)
  const album = await business.getAlbumById(albumId)
  if (!album) {
    return res.render('error', { msg: 'Album not found.' })
  }
  let albumPhotos = await business.albumPhotoListVisibleToUser(albumId,req.username)
  let count = albumPhotos.length
  let s = 's'
  if (count === 1){
    s = ''
  }

  res.render('album', { album, albumPhotos, count, s})
})


app.get('/album/:id/upload', requireLogin,async (req,res)=>{
  let albumId = Number(req.params.id)
  let album = await business.getAlbumById(albumId)
  if(!album){
    return res.render('error', {msg: 'Album not found.'})
  }
  res.render('upload',{ album })
})

app.post('/album/:id/upload', requireLogin, async (req, res) => {
  let albumId = Number(req.params.id)

  console.log('req.files =', req.files)

  let uploaded = req.files && req.files.photo

  if (!uploaded) {
    return res.render('error', { msg: 'No file uploaded (photo field missing).' })
  }

  let timestamp = Date.now()
  let safeName = timestamp + '_' + uploaded.name
  let uploadPath = path.join(__dirname, 'public', 'photos', safeName)

  uploaded.mv(uploadPath, async (err) => {
    if (err) {
      console.error('Upload mv error:', err)
      return res.render('error', { msg: 'Upload failed.' })
    }
    await business.addPhoto({
      filename: safeName,
      ownerUsername: req.username,
      visibility: "private",
      title: "",
      description: "",
      tags: [],
      albums: [albumId]
    })
    res.redirect('/album/' + albumId)
  })
})


/**
 * GET a specific photo.
 * Checks view permissions & loads comments.
 * @async
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
app.get('/photo/:id', requireLogin, async (req, res) => {
  const photoId = Number(req.params.id)
  const photo = await business.findPhoto(photoId)
  if (!photo) {
    return res.render('error', { msg: 'Photo not found.'})
  }
  const canView = await business.canViewPhoto(req.username, photo)
  if (!canView) {
    return res.render('error', { msg: 'You do not have access to this photo.'})
  }
  let canEdit = await business.canEditPhoto(req.username, photo)

  const comments = await business.getCommentsByPhoto(photoId)
  res.render('photo', { photo,canEdit, comments})
})


/**
 * POST add comment to photo.
 * Validates view permissions & comment text.
 * @async
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
app.post('/photo/:id/comment', requireLogin, async(req,res)=>{
  let photoId = Number(req.params.id)
  let text = req.body.text
  let username = req.username
  let photo = await business.findPhoto(photoId)
  let canView = await business.canViewPhoto(req.username,photo)
  if(!canView){
    return res.render('error',{msg:'You do not have access to this photo.'})
  }
  let canEdit = await business.canEditPhoto(username, photo)
  if(!text||text.trim() === ''){
    let comments = await business.getCommentsByPhoto(photoId)
    return res.render('photo', {
      photo,
      comments,
      canEdit:canEdit,
      message:'comment cannot be empty'
    }
    )
  }
  await business.addComment(photoId,req.username,text.trim())
  let ownerUsername = photo.ownerUsername
  let ownerUser = await business.getUserByUsername(ownerUsername)
  if(ownerUser && ownerUser.email){
    let subject = "New comment on your photo"
    let body = "User "+username+" commented: "+text.trim()
    Mail.sendMail(ownerUser.email,subject,body)
  }
  let comments = await business.getCommentsByPhoto(photoId)
  res.render('photo',{
    photo,
    comments,
    canEdit:canEdit,
    message: 'comment added'
  })
})



/**
 * GET edit photo page.
 * @async
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
app.get('/edit', requireLogin, async (req, res) => {
  const photoId = Number(req.query.pid)
  const photo = await business.findPhoto(photoId)
  if (!photo) {
    return res.render('error', { msg: 'Photo not found.'})
  }
  res.render('photoEdit', { photo})
})



/**
 * POST update photo metadata (title, description, visibility).
 * @async
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
app.post('/edit', requireLogin, async (req, res) => {
  const photoId = Number(req.query.pid)
  const { title, description } = req.body
  const visibility = req.body.visibility
  const photo = await business.updatePhotoDetails(photoId, req.username, title, description, visibility)
  if (!photo) {
    return res.render('error', { msg: 'Update failed'})
  }
  res.redirect(`/photo/${photoId}`)
})



/**
 * Starts the Express server.
 */
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})

