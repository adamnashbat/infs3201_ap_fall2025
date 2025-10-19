const express = require('express')
const exphbs = require('express-handlebars')
const path = require('path')
const business = require('./business.js')

const app = express()
const port = 8000

app.engine('hbs', exphbs.engine({ extname: '.hbs', defaultLayout: false }))
app.set('view engine', 'hbs')
app.set('views', path.join(__dirname, 'views'))
app.use('/photos', express.static(path.join(__dirname, 'public/photos')))
app.use(express.urlencoded({ extended: true }))
let albums
app.get('/', async (req, res) => {
  albums = await business.loadAlbum()
  res.render('albumList', { albums, layout: undefined })
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