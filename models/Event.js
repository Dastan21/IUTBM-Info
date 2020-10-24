const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const EventSchema = new Schema({
        title: {
            type: String,
            required: true,
        },
		description: {
			type: String,
			default: ""
		},
		date: {
			type: Date
		},
		state: {
			type: String,
			default: "todo"
		},
		_agenda: {
			type: mongoose.Types.ObjectId
		}
    }
);

module.exports = mongoose.model("event", EventSchema)
