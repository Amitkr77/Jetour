const mongoose = require("mongoose");
const Counter = require("../../model/counter.model");

const packageSchema = new mongoose.Schema(
    {
        package_code: {
            type: String,
            unique: true,
            immutable: true,
            index: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active"
        },

        details: {
            type: [String],
            required: true,
            validate: {
                validator: function (value) {
                    return value.length > 0;
                },
                message: "Details must contain at least one item"
            }
        }
    },
    { timestamps: true }
);

packageSchema.pre("save", async function () {
    if (!this.isNew) return;

    try {
        const counter = await Counter.findOneAndUpdate(
            { _id: "package" },
            { $inc: { seq: 1 } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        this.package_code = `PKG-${String(counter.seq).padStart(4, "0")}`;
        ;
    } catch (error) {
        console.error(error);
    }
});

module.exports = mongoose.model("Package", packageSchema);
