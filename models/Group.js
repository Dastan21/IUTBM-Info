const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const GroupSchema = new Schema({
        id: {
            type: String,
            required: true,
            index: { unique: true }
        },
        name: {
            type: String,
            required: true,
        },
		private: {
			type: Boolean,
			default: true
		},
		_users: [],
		_agenda: {
            type: mongoose.Schema.ObjectId,
            ref: "agenda",
        }
    }
);

module.exports = mongoose.model("group", GroupSchema)
