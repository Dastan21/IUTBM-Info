const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AgendaSchema = new Schema({
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
		_users: {
			type: Array
		},
		_events: {
			type: Array
		}
    }
);

module.exports = mongoose.model("agenda", AgendaSchema)
