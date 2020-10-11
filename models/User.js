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
		group: {
			type: String
		},
        _agendas: [{
			type: mongoose.ObjectId,
			ref: 'agenda'
		}]
    }
);

module.exports = mongoose.model("user", UserSchema)
