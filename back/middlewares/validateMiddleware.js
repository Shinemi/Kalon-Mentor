const {z} = require('zod')

//middleware générique de validation zod
function validateBody (schema){
    return (req, res, next) => {
     
        const result = schema.safeParse(req.body)
        
        if (!result.success){
            return res.status(422).json({
                title: "Données invalides",
                statut: 422,
                invalidParams: result.error.issues.map(err => ({
                    path: err.path.join("."),
                    message: err.message
                }))
            })
        }

        // si on arrive ici, on a passé la valisation, on renvoie les données sur dadta et on passe a la suite
       req.body = result.data;
       next();

    }
}

module.exports = validateBody