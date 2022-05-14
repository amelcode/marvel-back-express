const mongoose = require("mongoose");

const User = mongoose.model("Users", {

  email: {
    type: String, 
    required: true,
    unique: true,
  },
  password:  String, 
  salt: {
    type: String, 
    required: true,
  },
  hash: {
    type: String, 
    required: true,
  },
  token: {
    type: String, 
    required: true,
  }, 
  account: {
    username: {
      required: true,
      type: String,
    },
    avatar: Object,
  },
  favorites: {
    comics: Array,
    characters: Array,
  }
});
module.exports = User;
