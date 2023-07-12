const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const { Schema } = mongoose;
require("dotenv").config();

mongoose.connect(process.env.DB_URL, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	dbName: "fcc-exercise-tracker",
});

const UserSchema = new Schema({
	username: String,
});
const User = mongoose.model("User", UserSchema);

const ExerciseSchema = new Schema({
	user_id: { type: String, required: true },
	description: String,
	duration: Number,
	date: Date,
});
const Exercise = mongoose.model("Exercise", ExerciseSchema);

app.use(cors());
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
	res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/users", async (req, res) => {
	await User.find({})
		.select("_id username")
		.then((data) => res.json(data))
		.catch((err) => {
			res.json({ error: "User not found!" });
		});
});

app.post("/api/users", async (req, res) => {
	const userObj = new User({
		username: req.body.username,
	});
	try {
		const user = await userObj.save();
		res.json(user);
	} catch (err) {
		// console.log(err);
		res.json({ error: err });
	}
});

app.post("/api/users/:_id/exercises", async (req, res) => {
	console.log(req.body);
	const id = req.params._id;
	const { description, duration, date } = req.body;
	try {
		const user = await User.findById(id);
		if (!user) {
			res.json({ error: "User not found" });
		} else {
			const exerciseObj = new Exercise({
				user_id: id,
				description: description,
				duration: +duration,
				date: date ? new Date(date) : new Date(),
			});
			const exercise = await exerciseObj.save();
			res.json({
				username: user.username,
				description: exercise.description,
				duration: +exercise.duration,
				date: new Date(exercise.date).toDateString(),
				_id: user._id,
			});
		}
	} catch (err) {
		// console.log(err);
		res.json({ error: err });
	}
});

app.get("/api/users/:_id/logs", async (req, res) => {
	const { from, to, limit } = req.query;
	const id = req.params._id;
	const user = await User.findById(id);
	if (!user) {
		res.json({ error: "User not found" });
		return;
	}
	let dateObj = {};
	if (from) {
		dateObj["$gte"] = new Date(from);
	}
	if (to) {
		dateObj["$lte"] = new Date(to);
	}
	let filter = {
		user_id: id,
	};
	if (from || to) {
		filter.date = dateObj;
	}
	const exercise = await Exercise.find(filter).limit(+limit ?? 500);

	const log = exercise.map((e) => ({
		description: e.description,
		duration: e.duration,
		date: e.date.toDateString(),
	}));

	res.json({
		username: user.username,
		count: exercise.length,
		_id: user._id,
		log,
	});
});

const listener = app.listen(process.env.PORT || 3000, () => {
	console.log("Your app is listening on port " + listener.address().port);
});
