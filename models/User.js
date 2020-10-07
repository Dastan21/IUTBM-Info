const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
        id: {
            type: String,
            required: true,
            index: { unique: true }
        },
        username: {
            type: String,
            required: true,
        },
        _group: []
    }
);

module.exports = mongoose.model("user", UserSchema)
