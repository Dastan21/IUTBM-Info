const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const EventSchema = new Schema({
        id: {
            type: Number,
            required: true,
            index: { unique: true }
        },
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
		time: {
			type: Date
		},
		done: {
			type: Boolean
		}
    }
);

module.exports = mongoose.model("event", EventSchema)
