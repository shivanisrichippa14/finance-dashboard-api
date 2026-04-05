const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { ROLES_LIST } = require("../config/constants");

// Roles are defined in src/config/constants.js — imported here so there's one source of truth

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true, // always store emails in lowercase to avoid duplicate issues
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      // We never return the password field in API responses
      select: false,
    },

    role: {
      type: String,
      enum: ROLES_LIST,
      default: "viewer", // safest default — new users get least access until admin promotes them
    },

    isActive: {
      type: Boolean,
      default: true, // admin can deactivate a user without deleting their history
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

// Hash the password before saving to DB.
// We do this here in the model so we never forget to hash it in a controller.
// "pre save" runs every time we call user.save()
userSchema.pre("save", async function (next) {
  // Only rehash if the password was actually changed.
  // This prevents re-hashing an already-hashed password when updating other fields.
  if (!this.isModified("password")) return next();

  const saltRounds = 12;
  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

// Helper method to compare a plain-text password with the stored hash.
// We put this on the schema so controllers don't need to import bcrypt directly.
userSchema.methods.isPasswordCorrect = async function (plainTextPassword) {
  return await bcrypt.compare(plainTextPassword, this.password);
};

const User = mongoose.model("User", userSchema);

// Re-export ROLES_LIST as ROLES so existing imports keep working
const { ROLES_LIST: ROLES } = require("../config/constants");
module.exports = { User, ROLES };
