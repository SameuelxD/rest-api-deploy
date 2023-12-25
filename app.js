const express = require("express"); // require -> commonJS
const crypto = require("crypto");
const cors = require("cors");

const movies = require("./movies.json");
const { validateMovie, validatePartialMovie } = require("./moviesSchema");

const app = express();
app.use(express.json());
app.use(cors({
  origin: (origin, callback) => {
    const ACCEPTED_ORIGINS = [
      'http://localhost:8080',
      'http://localhost:1234',
      'https://movies.com',
      'https://midu.dev'
    ]

    if (ACCEPTED_ORIGINS.includes(origin)) {
      return callback(null, true)
    }

    if (!origin) {
      return callback(null, true)
    }

    return callback(new Error('Not allowed by CORS'))
  }
}));

app.disable("x-powered-by"); // deshabilitar el header X-Powered-By: Express

// métodos normales: GET/HEAD/POST
// métodos complejos: PUT/PATCH/DELETE

// CORS PRE-Flight
// OPTIONS

// app.get("/", (req, res) => {
//   res.json({ message: "hola mundo" });
// });

/* 
app.get("/movies", (req, res) => {
  res.json(movies);
});
*/
//Todos los recursos que sean de Movies se identifica con /movies , Todas las peliculas de cada genero

app.get("/movies", (req, res) => {
  //res.header("Access-Control-Allow-Origin", "*", "http://localhost:8080"); Solucion a las cors , a sus dominios
  const { genre } = req.query;
  if (genre) {
    const filteredMovies = movies.filter(movie =>
      movie.genre.some(g => g.toLowerCase() == genre.toLowerCase())
    );
    return res.json(filteredMovies);
  }
  res.json(movies);
});

app.get("/movies/:id", (req, res) => {
  //path-to-regexp
  const { id } = req.params;
  const movie = movies.find(movie => movie.id == id);
  if (movie) return res.json(movie);
  res.status(404).json({ message: "Movie not Found" });
});

app.post("/movies", (req, res) => {
  // const { title, genre, year, director, duration, rate, poster } = req.body;
  const result = validateMovie(req.body);

  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) });
  }

  // en base de datos
  const newMovie = {
    id: crypto.randomUUID(), //UUID V4
    ...result.data,
    // title,
    // genre,
    // director,
    // year,
    // duration,
    // rate: rate ?? 0,
    // poster,
  };
  //Esto no seria REST, porque estamos guardando el estado de la aplicacion en memoria
  movies.push(newMovie);
  res.status(201).json(newMovie); //actualizar la cache del cliente;
});

app.delete('/movies/:id', (req, res) => {
  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  movies.splice(movieIndex, 1)

  return res.json({ message: 'Movie deleted' })
})

app.patch("/movies/:id", (req, res) => {
  const result = validatePartialMovie(req.body);
  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) });
  }

  const { id } = req.params;
  const movieIndex = movies.findIndex(movie => movie.id == id);

  if (movieIndex == -1) {
    return res.status(404).json({ message: "Movie not found" });
  }

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data,
  };

  movies[movieIndex] = updateMovie;

  return res.json(updateMovie);
});

const PORT = process.env.PORT ?? 1234;

app.listen(PORT, () => {
  console.log(`server listening on port http://localhost:${PORT}`);
});

/*
node --watch app.js

npm install zod -E

Idempotencia, propiedad de realizar una accion determinada varias veces y aun asi conseguir siempre el mismo resultado que se obtendria al hacerlo una vez mas

POST,Crea un nuevo elemento/recurso en el servidor http://localhost:1234/movies , No es IDEMPOTENTE , put actualiza totalmente todos los elementos que hallan

PUT,Actualiza totalmente un elemento ya existente o lo crea si no existe http://localhost:1234/movies/c8a7d63f-3b04-44d3-9d95-8782fd7dcfaf , Si es IDEMPOTENTE

PATCH,Actualiza parcialmente un elemento/recurso http://localhost:1234/movies/c8a7d63f-3b04-44d3-9d95-8782fd7dcfaf , En principio siempre es IDEMPOTENTE pero depende en ciertos casos puede cambiar , patch actualiza por partes elementos 

npx servor ./web , Dominio estatico

problemas con los dominios , estamos usando el 1234  , pero al crear un dominio local se usa el 8080 , falta una cabecera

Instalar el Modulo Cors
npm install cors

*/
