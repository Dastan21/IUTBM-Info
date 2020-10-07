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
        _events: []
    }
);

module.exports = mongoose.model("agenda", AgendaSchema)
