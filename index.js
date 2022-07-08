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
const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(formidable());
app.use(cors(corsOptions));
dotenv.config();
mongoose.connect(process.env.DB_CONNECTION);

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

app.put("/addFavorit", async (req, res) => {
  try {
    let message = "";
    console.log("req.fields", req.fields);

    const user = await User.findOne({ token: req.fields.token });
    console.log('user', user);

    const comicsUserFavorits = user.favorites.comics;
    // console.log("comicsUserFavorits", comicsUserFavorits);

    const charactersUserFavorits = user.favorites.characters;
    // console.log("charactersUserFavorits", charactersUserFavorits);

    if (req.fields.categories === "character") {
      if (charactersUserFavorits?.length === 0) {
        console.log("characters user empty");
        await User.findByIdAndUpdate(user._id, {
          favorites: {
            comics: comicsUserFavorits,
            characters: req.fields.data,
          },
        });
        message = "added to favorits";
      } else {
        charactersUserFavorits.push(req.fields.data);
        await User.findByIdAndUpdate(user._id, {
          favorites: {
            comics: comicsUserFavorits,
            characters: charactersUserFavorits,
          },
        });
        message = "add to favorits";
        
      }
    } else if (req.fields.categories === "comic") {
      if (comicsUserFavorits.length === 0) {
        console.log("characters user empty");
        await User.findByIdAndUpdate(user._id, {
          favorites: {
            comics: req.fields.data,
            characters: charactersUserFavorits,
          },
        });
        message = "added to favorits";
      } else {
        comicsUserFavorits.push(req.fields.data);
        await User.findByIdAndUpdate(user._id, {
          favorites: {
            comics: comicsUserFavorits,
            characters: charactersUserFavorits,
          },
        });
        message = "add to favorits";
      }
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
    const token = req.headers.authorization.replace("Bearer ", "");
    const user = await User.findOne({ token: token });

    if (
      user.favorites.comics.length === 0 &&
      user.favorites.characters.length === 0
    ) {
      throw "No favorites";
    }
    console.log("user", user);
    res.json(user.favorites);
  } catch (error) {
    res.json({ error: error });
  }
});

app.listen(process.env.PORT, () => {
  console.log("Server has started");
});
