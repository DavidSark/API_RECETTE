const express = require('express');
const sqlite3 = require('sqlite3');
const app = express();
const db = new sqlite3.Database('../db/recettes.db');

//methode utilisé pour activer la méthode PUT();
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.json());


//--------------------------------------------------------------//


//-------------------Route de navigation-------------------//


//Route home
app.get('/', (req,res) =>{
    res.sendFile(__dirname + '/home.html');
});

//Route pour la page help : 
app.get('/help', (req,res) =>{
    res.sendFile(__dirname + '/helpPage.html');
});

//Route pour la page contact
app.get('/contact', (req,res) =>{
    res.sendFile(__dirname + '/contactPage.html');
});


//---------------RECETTES------------------//


//Route pour afficher les recettes
app.get('/recipes', (req,res) =>{
    db.all('SELECT * FROM recipes', (err, rows)=>{
        if(err){
            res.status(500).json({error: err, rows});
            return;
        }
        const formattedJSON = JSON.stringify({ recipes: rows }, null, 2);

        res.setHeader('Content-Type', 'application/json');
        res.send(formattedJSON);
    });
});

//route pour supprimer une recette avec son ID
// Pour faire marcher le delete, il faut utiliser postman car dans
// l'url cela ne fonctionne pas
app.delete('/recipes/delete/:recipeId', (req, res)=>{
   const {recipeId} = req.params;
   const sql = 'DELETE FROM recipes WHERE recipe_id = ?' ;

   db.run(sql, recipeId, function (err) {
    if (err) {
        res.status(500).json({ error: err.message });
    } else {
        if (this.changes === 0) {
            res.status(404).json({ message: 'Recipe not found' });
        } else {
            res.json({ message: 'Recipe deleted successfully' });
        }
    }
});
});

//route avoir accès au formulaire pour ajouter une recette
app.get('/add-recipes', (req, res) => {
    res.sendFile(__dirname + '/recipeForm.html');
});
app.post('/recipes', (req, res) => {
    const { title, description, image_url, cuisine_id, goal_id, DietaryInformation_id, AllergiesInformation_id } = req.body;
    // Si aucune valeur les champs vides sont remplacé
    // par NULL 
    const values = [
        title || null,
        description || null,
        image_url || null,
        cuisine_id || null,
        goal_id || null,
        DietaryInformation_id || null,
        AllergiesInformation_id || null
    ];
    const sql = `INSERT INTO recipes (title, description, image_url, cuisine_id, goal_id, DietaryInformation_id, AllergiesInformation_id) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, values, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ message: 'Recipe added successfully', recipeId: this.lastID });
        }
    });
});


// Route pour retourner les recettes provenant d'une cuisine
// PAS DE FORMULAIRE - À FAIRE DANS L'URL
app.get('/recipes-cuisine/:cuisineId', (req, res) => {
    const { cuisineId } = req.params;
    const sql = 'SELECT * FROM recipes WHERE cuisine_id = ?';

    db.all(sql, cuisineId, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const formattedJSON = JSON.stringify({ recipes: rows }, null, 2);

        res.setHeader('Content-Type', 'application/json');
        res.send(formattedJSON);
    });
});


//Route pour afficher les recettes qui ne contiennent pas d'allergènes alimentaires
// PAS DE FORMULAIRE - À FAIRE DANS L'URL
app.get('/recipes-no-allergies/', (req, res) => {
    db.all('SELECT * FROM recipes WHERE AllergiesInformation_id IS NULL', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const formattedJSON = JSON.stringify({ recipes: rows }, null, 2);

        res.setHeader('Content-Type', 'application/json');
        res.send(formattedJSON);
    });
});


//Route pour retourner les recettes qui verifient un goal
// PAS DE FORMULAIRE - À FAIRE DANS L'URL
app.get('/recipes-goal', (req, res) => {
    db.all('SELECT * FROM recipes WHERE goal_id IS NOT NULL', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const formattedJSON = JSON.stringify({ recipes: rows }, null, 2);
        res.setHeader('Content-Type', 'application/json');
        res.send(formattedJSON);
    });
});

//Router pour retourner une recette avec son id et tous ses composants
// PAS DE FORMULAIRE - À FAIRE DANS L'URL
app.get('/recipes/:recipeId', (req, res) => {
    const { recipeId } = req.params;
    const sql = 'SELECT * FROM recipes WHERE recipe_id = ?';

    db.all(sql, recipeId, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const formattedJSON = JSON.stringify({ recipes: rows }, null, 2);

        res.setHeader('Content-Type', 'application/json');
        res.send(formattedJSON);
    });
});



//------------CUISINE-----------------//

//Route pour afficher les toutes les cuisines
app.get('/cuisines', (req,res) =>{
    db.all('SELECT * FROM cuisines', (err, rows)=>{
        if(err){
            res.status(500).json({error: err, rows});
            return;
        }
        const formattedJSON = JSON.stringify({ cuisines: rows }, null, 2);

        res.setHeader('Content-Type', 'application/json');
        res.send(formattedJSON);
    });
});


//Route pour ajouter une cuisine 
//Utiliser le formulaire sur la homepage -> bouton add cuisine
app.get('/add-cuisines', (req,res) =>{ 
    res.sendFile(__dirname + '/cuisineForm.html');
});
app.post('/cuisines', (req,res)=>{
    const { name } = req.body;
    const values = [name];
    const sql = `INSERT INTO cuisines (name) VALUES (?)`;
    db.run(sql, values, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ message: 'Cuisine added successfully'});
        }
    });
})




//Route pour supprimer une cuisine
//si la cuisine était dans une recette, elle est remplacé par l'id 6 qui est l'id 
//de la cuisine International 
app.delete('/cuisines/delete/:id', (req, res) => {
    let idCuisine = req.params.id; 
    if (idCuisine == 6) {
      res.status(500).json({ msg: `This cuisine can't be removed` });
      return;
    }
  
    let update_cuisine = `
      UPDATE Recipes
      SET cuisine_id = ${6}
      WHERE cuisine_id = ${idCuisine} 
    `;
  
    let delete_cuisine = `DELETE FROM Cuisines WHERE cuisine_id = ${idCuisine}`;
    
    db.run(update_cuisine, (err) => {
      if (err) {
        console.log(err);
        return;
      }
      db.run(delete_cuisine, (err) => {
        if (err) {
          console.log(err);
          return;
        }
        res.status(200).json({
          msg: `Cuisine ${idCuisine} has been successfully removed`
        });
      });
    });
  });
  




//--------------------MISE À JOUR------------------------//


//Route pour mettre à jour le nom de la recette avec son ID
/*VIA POSTMAN
http://localhost:3000/recipes/update-name/3
Dans l'URL on cible l'id de la recette 3 et on change son nom
 {
  "name": "Blinchik"
}
pour changer la recette avec l'identifiant 3 avec un autre nom.
*/
app.put('/recipes/update-name/:id', (req, res) => {
    const newValue = req.body.name;
    const idRecipe = req.params.id;
  
    db.run('UPDATE Recipes SET title = ? WHERE recipe_id = ?', [newValue, idRecipe], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: `The recipe with the ID ${idRecipe} has been updated with the name : ${newValue}` });
    });
});



//Route pour mettre à jour la description de la recette avec son ID
/*VIA POSTMAN
http://localhost:3000/recipes/update-desc/3
Dans l'URL on cible l'id de la recette 3 et on change sa description
 {
  "description": "En Arménie, on trouve des blinchik dans la cuisine populaire basique. Un plat chaud et réconfortant. Ce sont des crêpes garnies de viande hachée avec de la coriandre, que l’on roule et dore à la poêle."
}
pour changer la description de la recette avec l'identifiant 3 avec une autre description.

*/
app.put('/recipes/update-desc/:id', (req, res) => {
    const descValue = req.body.description;
    const idRecipe = req.params.id;

    db.run('UPDATE Recipes SET description  = ? WHERE recipe_id = ?', [descValue, idRecipe], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: `The description with the ID ${idRecipe} has been updated` });
    });
});





//Route pour mettre à jour l'information allergique de la recette avec son ID
/*VIA POSTMAN

 {
  "AllergiesInformation_id": 1
}
pour changer l'information allergique de la recette avec l'identifiant 3 avec une autre allergie.

*/
app.put('/recipes/update-allergy/:id', (req, res) => {
    const allergyValue = req.body.AllergiesInformation_id;
    const idRecipe = req.params.id;

    db.run('UPDATE Recipes SET AllergiesInformation_id  = ? WHERE recipe_id = ?', [allergyValue, idRecipe], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: `The allergy information of the recipe with the ID ${idRecipe} has been updated` });
    });
});


//-------------------------ROUTE & REQUETE BONUS-----------------------------------------//


//--------------AFFICHER LES ALLERGIES-------------------//
//bouton view allergies dans l'accueil
app.get('/allergies', (req, res) => {
    db.all('SELECT * FROM AllergiesInformation', (err, rows) => {
        if (err) {
            res.status (500).json({ error: err.message});
            return;
        }

        const formattedJSON = JSON.stringify({ recipes: rows }, null, 2);

        res.setHeader('Content-Type', 'application/json');
        res.send(formattedJSON);
    });
});

//--------------AFFICHER LES RECETTES EN FONCTION DE LEUR ALLERGIE-------------------//
//à faire dans l'url ou postman
app.get('/recipes-allergies/:allergiesId', (req, res) => {
    const { allergiesId } = req.params;
    const sql = 'SELECT * FROM recipes WHERE AllergiesInformation_id = ?';

    db.all(sql, allergiesId, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const formattedJSON = JSON.stringify({ recipes: rows }, null, 2);

        res.setHeader('Content-Type', 'application/json');
        res.send(formattedJSON);
    });
});

//--------------------AJOUTER DES ALLERGIES------------------------///
//ajouter avec le formulaire via le bouton add allergies
app.get('/add-allergies', (req,res) =>{ 
    res.sendFile(__dirname + '/addAllergyForm.html');
});
app.post('/allergies', (req,res)=>{
    const { name } = req.body;
    const values = [name];
    const sql = `INSERT INTO AllergiesInformation (name) VALUES (?)`;
    db.run(sql, values, function (err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                } else {
                    res.json({ message: 'Allergie added successfully'});
                }
            });
})


//---------------------------SUPPRIMER DES ALLERGIES------------------//
//VIA POSTMAN
app.delete('/allergies/delete/:allergieId', (req, res) => {
    const {allergieId} = req.params;
    const sql = 'DELETE FROM AllergiesInformation WHERE allergy_id = ?';

    db.run(sql, allergieId, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            if (this.changes === 0) {
                res.status(404).json({ message: 'Allergie not found' });
            } else {
                res.json({ message: 'Allergy deleted successfully' });
            }
        }
    });
});


//--------------AFFICHER LES GOALS-------------------//
//afficher les goals avec la route ou le bouton view goals sur la page d'accueil
app.get('/goals', (req, res) => {
    db.all('SELECT * FROM Goals', (err, rows) => {
        if (err) {
            res.status (500).json({ error: err.message});
            return;
        }

        const formattedJSON = JSON.stringify({ recipes: rows }, null, 2);

        res.setHeader('Content-Type', 'application/json');
        res.send(formattedJSON);
    });
});

//--------------------AJOUTER DES GOALS------------------------///
//ajouter un goal avec le formulaire via le bouton add goals dans la page d'accueil
app.get('/add-goals', (req,res) =>{ 
    res.sendFile(__dirname + '/addGoalForm.html');
});
app.post('/goals', (req,res)=>{
    const { name } = req.body;
    const values = [name];
    const sql = `INSERT INTO Goals (name) VALUES (?)`;
    db.run(sql, values, function (err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                } else {
                    res.json({ message: 'Goal added successfully'});
                }
            });
})



//---------------------------SUPPRIMER DES GOALS------------------//
//VIA POSTMAN
app.delete('/goals/delete/:goalsId', (req, res) => {
    const {goalsId} = req.params;
    const sql = 'DELETE FROM Goals WHERE goal_id = ?';

    db.run(sql, goalsId, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            if (this.changes === 0) {
                res.status(404).json({ message: 'Goal not found' });
            } else {
                res.json({ message: 'Goal deleted successfully' });
            }
        }
    });
});




//Route pour mettre à jour le goal de la recette
/* VIA POSTMAN insérer par exemple : 
http://localhost:3000/recipes/update-goal/3
L'URL va prendre l'id de la recette, et on injecte la valeur de l'id d'un goal pour modifier l'objectif.
{
    "goal_id": 1
}
*/
app.put('/recipes/update-goal/:id', (req, res) => {
    const goalValue = req.body.goal_id;
    const idRecipe = req.params.id;

    db.run('UPDATE Recipes SET goal_id  = ? WHERE recipe_id = ?', [goalValue, idRecipe], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: `The goal information of the recipe with the ID ${idRecipe} has been updated` });
    });
});



//Route pour mettre à jour les informations sur la diet d'une recette
/* VIA POSTMAN insérer par exemple : 
http://localhost:3000/recipes/update-diet/3
L'URL va prendre l'id de la recette, et on injecte la valeur de l'id d'une diet pour modifier la diet.
{
    "DietaryInformation_id": 2
}
*/
app.put('/recipes/update-diet/:id', (req, res) => {
    const dietValue = req.body.DietaryInformation_id;
    const idRecipe = req.params.id;

    db.run('UPDATE Recipes SET DietaryInformation_id  = ? WHERE recipe_id = ?', [dietValue, idRecipe], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: `The diet information of the recipe with the ID ${idRecipe} has been updated` });
    });
});



//Route pour mettre à jour avec l'identifiant de la cuisine
/* VIA POSTMAN insérer par exemple : 
http://localhost:3000/cuisines/update-name/5
On cible la cuisine qui a l'id 5 puis on donne une autre valeur à name pour la modifié : 
{
  "name": "Arménien"
}
pour changer la cuisine avec l'identifiant 5 avec un autre nom.
*/
app.put('/cuisines/update-name/:id', (req, res) => {
    const nameValue = req.body.name;
    const idCuisine = req.params.id;
  
    db.run('UPDATE Cuisines SET name = ? WHERE cuisine_id = ?', [nameValue, idCuisine], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: `Cuisine with the ID ${idCuisine} has been updated with the name : ${nameValue}` });
    });
});




//Route pour mettre à jour la cuisine dans une recette avec son ID
/*VIA POSTMAN
Dans l'url il faut saisir l'id de la cuisine :
http://localhost:3000/recipes/update-cuisine/5
{
  "recipe_id": 1,
  "cuisine_id": 5
}
cela changera la recette avec l'id 1 avec l'id de la cuisine 5
*/
app.put('/recipes/update-cuisine/:id', (req, res) => {
    const idCuisine = req.params.id;
    const idRecipe = req.body.recipe_id; 
    db.get('SELECT name FROM Cuisines WHERE cuisine_id = ?', [idCuisine], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: `Cuisine avec l'ID ${idCuisine} non trouvée` });
      }
  
      const nomCuisine = row.name;
      db.run('UPDATE Recipes SET cuisine_id = ? WHERE recipe_id = ?', [idCuisine, idRecipe], (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: `Cuisine with the recipe of the ID ${idRecipe} has been updated with the name: ${nomCuisine}` });
      });
    });
  });
  


//Start the server
const port = process.env.PORT || 3000;
app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`);
});