const { pool } = require('../db/db')

exports.findAllCategories = async () => {
    const { rows } = await pool.query(`SELECT DISTINCT category FROM resources`)

    return rows.map((row) => row.category)
}

exports.findResourceByCategory = async (category) => {
    const { rows } = await pool.query(
        `SELECT id, title, category, type, content_or_url, author_name
         FROM resources
         WHERE category = $1
         LIMIT 1`,
        [category]
    )

    return rows[0]
}