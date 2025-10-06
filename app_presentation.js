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
  const albumId = req.params.id
  const albums = await business.loadAlbum()
  const album = albums.find(a => a.id == albumId)
  if (!album){
    return res.status(404).send('Album not found')
  }
  const photos = await business.loadPhotos()
  let albumPhotos = []
  for (pic of photos){
    if (pic.albums.includes(Number(albumId))){
        albumPhotos.push(pic)
    }
  }
  let count = albumPhotos.length
  res.render('album', {album, photos, albumPhotos, count, layout: undefined})
})
app.get('/photo/:id', async (req, res) => {
    const photoId = req.params.id
    const photos = await business.loadPhotos()
    const photo = photos.find(p => p.id == photoId)
    if (!photo){ 
        return res.status(404).send("Photo not found")
    }
    res.render('photo', {photo, layout: undefined })

})
app.get('/photo/:id/edit', async (req, res) => {
  const photoId = Number(req.params.id)
  const photos = await business.loadPhotos()
  const photo = photos.find(p => p.id === photoId)

  if (!photo) {
    return res.status(404).send("Photo not found")
  }

  res.render('photoEdit', { photo, layout: undefined })
})
app.post('/photo/:id/edit', async (req, res) => {
  const photoId = Number(req.params.id)
  const { title, description } = req.body

  const photos = await business.loadPhotos()
  const photo = photos.find(p => p.id == photoId)

  if (!photo) {
    return res.status(404).send("Photo not found")
  }
  photo.title = title
  photo.description = description
  await business.savePhotos(photos)

  res.redirect(`/photo/${photoId}`)
})


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})