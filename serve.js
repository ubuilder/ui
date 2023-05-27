import express from 'express'

const app = express()

app.use('/components/*', express.static('./build'))

app.get('/', (req, res) => {
    res.redirect('/components')
})

app.listen(3000, () => {
    console.log('listening on port '+ 3000)
})