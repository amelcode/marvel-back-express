const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const axios = require("axios");
const cors = require("cors");
const dotenv = require("dotenv");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

const User = require("./models/User");

const app = express();

app.use(formidable());
app.use(cors());
dotenv.config();
mongoose.connect("mongodb://localhost/marvel");

//API MARVEL
app.get("/comics", async (req, res) => {
  try {
    const title = req.query.title ? req.query.title : "";
    const skip = req.query.skip ? req.query.skip : 0;
    const response = await axios.get(
      `https://lereacteur-marvel-api.herokuapp.com/comics?apiKey=${process.env.API_KEY}&title=${title}&skip=${skip}`
    );

    res.json(response.data);
  } catch (error) {
    console.log(error);
  }
});

app.get("/characters", async (req, res) => {
  try {
    const name = req.query.name ? req.query.name : "";
    const skip = req.query.skip ? req.query.skip : 0;
    const response = await axios.get(
      `https://lereacteur-marvel-api.herokuapp.com/characters?apiKey=${process.env.API_KEY}&name=${name}&skip=${skip}`
    );
    res.json(response.data);
  } catch (error) {
    console.log(error);
  }
});

//USERS ROUTES
app.get("/comics/:characterId", async (req, res) => {
  try {
    const characterId = req.params.characterId;
    const skip = req.query.skip ? req.query.skip : 0;
    const response = await axios.get(
      `https://lereacteur-marvel-api.herokuapp.com/comics/${characterId}?apiKey=${process.env.API_KEY}`
    );

    res.json(response.data);
  } catch (error) {
    console.log(error);
  }
});

app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.fields;

    const findEmail = await User.findOne({ email: email }); //const mane = modelName.find()

    if (findEmail === null) {
      const salt = uid2(16);
      const hash = SHA256(password + salt).toString(encBase64);
      const token = uid2(16);

      const newUser = new User({
        account: {
          username: username,
        },
        email: email,
        salt: salt,
        hash: hash,
        token: token,
      });
      await newUser.save();

      res.json({ token: token });
    }
  } catch (error) {
    console.log(error);
    res.json({ error: error.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const userData = await User.findOne({ email: req.fields.email });

    if (userData.email === undefined) {
      throw "Information not valid";
    } else {
      const password = req.fields.password;
      const salt = userData.salt;
      const hash = SHA256(password + salt).toString(encBase64);
      if (hash === userData.hash) {
        res.json({ token: userData.token });
      } else {
        throw "Information not valid";
      }
    }
  } catch (error) {
    res.status(401).json({ error: error });
  }
});

// ROUTES FAVORITES

app.put("/addFavorits", async (req, res) => {
  try {
    let message = "";
    console.log("req.fields", req.fields);
    console.log("req.fields.token", req.fields.token);

    const user = await User.findOne({ token: req.fields.token });
    console.log("user", user);
    //favorites: { comics: [], characters: [] },

    console.log("user._id", user._id);

    const comicsUserFavorits = user.favorites.comics;
    console.log("comicsUserFavorits", comicsUserFavorits);

    const comicsNewFavorits = req.fields.favorites.favoritesComics;
    console.log("comicsNewFavorits", comicsNewFavorits);

    const charactersUserFavorits = user.favorites.characters;
    console.log("charactersUserFavorits", charactersUserFavorits);

    const charactersNewFavorits = req.fields.favorites.favoritesCharacters;
    console.log("charactersNewFavorits", charactersNewFavorits);

    
    if (comicsUserFavorits !== [] && comicsNewFavorits !== undefined) {
      if (!comicsUserFavorits.includes(comicsNewFavorits)) {
        const comics = comicsUserFavorits.concat(comicsNewFavorits);
        await User.findByIdAndUpdate(user._id, {
          favorites: {
            comics: comics,
            characters: charactersUserFavorits,
          },
        });
        message = "Comics added to favorits";
      } else {
        message = "Comics already in favorits";
      }
    } else if (comicsUserFavorits === [] && comicsNewFavorits !== undefined) {
      await User.findByIdAndUpdate(user._id, {
        favorites: {
          comics: comicsNewFavorits,
          characters: charactersUserFavorits,
        },
      });
      message = "Comics added to favorits";
    }

    if (charactersUserFavorits !== [] && charactersNewFavorits !== undefined) {
      if (!charactersUserFavorits.includes(charactersNewFavorits)) {
        const characters = charactersUserFavorits.concat(charactersNewFavorits);
        console.log("characters concat", characters);
        await User.findByIdAndUpdate(user._id, {
          favorites: {
            comics: comicsUserFavorits,
            characters: characters,
          },
        });
        message = "Characters added to favorits";
      } else {
        message = "Character already in favorits";
      }
    } else if (
      charactersUserFavorits === [] &&
      charactersNewFavorits !== undefined
    ) {
      console.log("e", e);
      await User.findByIdAndUpdate(user._id, {
        favorites: {
          comics: comicsUserFavorits,
          characters: charactersNewFavorits,
        },
      });
      message = "Characters added to favorits";
    }

    /* Returning the comics array to the frontend. */
    res.json({
      message: message,
    });
  } catch (error) {
    console.log(error);
  }
});

app.get("/favorites", async (req, res) => {
  try {    
    const token = req.query.token;
    const user = await User.findOne({ token: "KVsBmaxKHPrlu6a1" });
    res.json(user.favorites);
  } catch (error) {
    console.log(error);
  }
})

app.listen(process.env.PORT, () => {
  console.log("Server has started");
});
