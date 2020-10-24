const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AgendaSchema = new Schema({
        title: {
            type: String,
            required: true,
        },
		private: {
			type: Boolean,
			default: true
		},
		invite: {
			type: String
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
