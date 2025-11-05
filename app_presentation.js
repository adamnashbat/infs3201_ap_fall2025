const express = require('express')
const exphbs = require('express-handlebars')
const path = require('path')
const cookieParser = require('cookie-parser')
const crypto = require('crypto')
const business = require('./business.js')
const bodyParser = require('body-parser')

const app = express()
const port = 8000

app.engine('hbs', exphbs.engine({ extname: '.hbs', defaultLayout: false }))
app.set('view engine', 'hbs')
app.set('views', path.join(__dirname, 'views'))
app.use('/photos', express.static(path.join(__dirname, 'public/photos')))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(bodyParser.urlencoded())
let albums
app.get('/', (req, res) => {
    res.render('login', {layout: undefined, message: req.query.message})
})
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
app.get('/register', async(req, res)=>{
  res.render('register', {layout:undefined, message: req.query.message})
})
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
app.get('/logout', async (req, res) => {
  let sessionKey = req.cookies.sessionkey
  console.log(sessionKey)
  if (sessionKey) {
    await business.deleteSession(sessionKey)
    res.clearCookie('sessionkey')
  }
  res.redirect('/')
})
app.get('/album-list', async (req,res)=>{
  let sessionKey = req.cookies.sessionkey
  if (!sessionKey) {
        return res.redirect("/?message=No session found. Please log in.")
  }
  const session = await business.getSessionData(sessionKey)
  if (!session) {
    return res.redirect("/?message=Session expired")
  }
  let albums= await business.loadAlbum()
  res.render('albumList', {message:req.query.message, albums, layout:undefined})
})

app.get('/album/:id', async (req, res) => {
  const albumId = Number(req.params.id)
  const album = await business.getAlbumById(albumId)
  if (!album) {
    return res.render('error', { msg: 'Album not found.', layout: undefined })
  }
  let albumPhotos = await business.albumPhotoList(albumId)
  let count = albumPhotos.length
  let s = 's'
  if (count === 1){
    s = ''
  }

  res.render('album', { album, albumPhotos, count, s, layout: undefined })
});
app.get('/photo/:id', async (req, res) => {
  const photoId = Number(req.params.id)
  const photo = await business.findPhoto(photoId)
  if (!photo) {
    return res.render('error', { msg: 'Photo not found.', layout: undefined })
  }
  res.render('photo', { photo, layout: undefined })
})

app.get('/edit', async (req, res) => {
  const photoId = Number(req.query.pid)
  const photo = await business.findPhoto(photoId)
  if (!photo) {
    return res.render('error', { msg: 'Photo not found.', layout: undefined })
  }
  res.render('photoEdit', { photo, layout: undefined })
})

app.post('/edit', async (req, res) => {
  const photoId = Number(req.query.pid)
  const { title, description } = req.body
  const photo = await business.updatePhotoDetails(photoId, title, description)
  if (!photo) {
    return res.render('error', { msg: 'Update failed', layout: undefined })
  }
  res.redirect(`/photo/${photoId}`)
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})