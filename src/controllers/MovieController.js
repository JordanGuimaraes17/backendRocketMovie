const knex = require('../database/knex')

class MovieController {
  async create(request, response) {
    const { title, description, rating, movie_tags } = request.body
    const user_id = request.user.id
    const [movie_notes_id] = await knex('movie_notes').insert({
      title,
      description,
      rating,
      user_id
    })

    const tagsInsert = movie_tags.map(name => {
      return {
        movie_notes_id,
        name,
        user_id
      }
    })
    await knex('movie_tags').insert(tagsInsert)
    return response.json()
  }

  async show(request, response) {
    const { id } = request.params
    const movie = await knex('movie_notes').where({ id }).first()
    const tags = await knex('movie_tags')
      .where({ movie_notes_id: id })
      .orderBy('name')

    return response.json({ ...movie, tags })
  }

  async delete(request, response) {
    const { id } = request.params

    await knex('movie_notes').where({ id }).delete()

    return response.json()
  }

  async index(request, response) {
    const { title, movie_tags } = request.query
    const user_id = request.user.id
    let movie
    if (movie_tags) {
      const filterTags = movie_tags.split(',').map(tag => tag)

      movie = await knex('movie_tags')
        .select(['movie_notes.id', 'movie_notes.title', 'movie_notes.user_id'])
        .where('movie_notes.user_id', user_id)
        .whereLike('title', `%${title}%`)
        .whereIn('movie_tags.name', filterTags)
        .innerJoin('movie_notes', 'movie_notes.id', 'movie_tags.movie_notes_id')
        .groupBy('movie_notes.id')
        .orderBy('movie_notes.title')
    } else {
      movie = await knex('movie_notes')
        .where({ user_id })
        .whereLike('title', `%${title}%`)
        .orderBy('title')
    }
    const userTags = await knex('movie_tags').where({ user_id })
    const moviesWithTags = movie.map(movie => {
      const movieTags = userTags.filter(tag => tag.movie_notes_id === movie.id)
      return {
        ...movie,
        movie_tags: movieTags
      }
    })

    return response.json(moviesWithTags)
  }
}
module.exports = MovieController
