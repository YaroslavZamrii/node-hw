import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import gravatar from "gravatar";
import fs from "fs/promises";
import path from "path";
import jimp from "jimp";

import User from "../models/User.js";

import { HttpError } from "../helpers/index.js";

import { ctrlWrapper } from "../decorators/index.js";

const { JWT_SECRET } = process.env;

const postersPath = path.resolve("public", "avatars");

const signup = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    throw HttpError(409, "Email in use");
  }

  const hashPassword = await bcrypt.hash(password, 10);
  const httpUrlAvatar = gravatar.url(email, {
    protocol: "http",
    s: "250",
  });

  const newUser = await User.create({
    ...req.body,
    password: hashPassword,
    avatarURL: httpUrlAvatar,
  });

  res.status(201).json({
    email: newUser.email,
    subscription: newUser.subscription,
  });
};

const signin = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(401, "Email or password invalid"); // throw HttpError(401, "Email invalid");
  }

  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw HttpError(401, "Email or password invalid"); // throw HttpError(401, "Password invalid");
  }

  const { _id: id } = user;

  const payload = {
    id,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "23h" });
  await User.findByIdAndUpdate(id, { token });

  res.json({
    token,
    user: {
      email: user.email,
      subscription: user.subscription,
    },
  });
};

const getCurrent = (req, res) => {
  const { email, subscription } = req.user;

  res.json({
    email,
    subscription,
  });
};

const signout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: "" });

  res.status(204).json({
    message: "Signout success",
  });
};

const updateAvatar = async (req, res) => {
  const { _id: user } = req.user;
  const { path: oldPath, filename } = req.file;
  const newPath = path.join(postersPath, filename);

  await fs.rename(oldPath, newPath);

  const image = await jimp.read(newPath);
  await image.resize(250, jimp.AUTO).writeAsync(newPath);

  const avatarPath = path.join("avatars", filename);
  const updatedUser = await User.findByIdAndUpdate(
    user,
    { avatarURL: avatarPath },
    { new: true, runValidators: true }
  );

  res.status(200).json({ avatarURL: updatedUser.avatarURL });
};

export default {
  signup: ctrlWrapper(signup),
  signin: ctrlWrapper(signin),
  getCurrent: ctrlWrapper(getCurrent),
  signout: ctrlWrapper(signout),
  updateAvatar: ctrlWrapper(updateAvatar),
};
