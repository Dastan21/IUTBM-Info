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
		_users: [{
			type: mongoose.ObjectId,
			ref: 'user'
		}],
		_events: [{
			type: mongoose.ObjectId,
			ref: 'event'
		}]
    }
);

module.exports = mongoose.model("agenda", AgendaSchema)
