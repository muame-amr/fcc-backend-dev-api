require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient } = require("mongodb");
const dns = require("dns");
const urlParser = require("url");

const client = new MongoClient(process.env.DB_URL);
const db = client.db("fcc-url-shortener");
const urls = db.collection("url-shortener");

// Basic Configuration
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
	res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
	res.json({ greeting: "hello API" });
});

app.post("/api/shorturl", (req, res) => {
	// Verify URL through DNS lookup
	const url = req.body.url;
	const dnslookup = dns.lookup(
		urlParser.parse(url).hostname,
		async (err, address) => {
			if (!address) {
				res.json({ error: "invalid url" });
			} else {
				const short_url = await urls.countDocuments({});
				const urlDoc = {
					url,
					short_url,
				};
				const result = await urls.insertOne(urlDoc);
				console.log(result);
				res.json({ original_url: url, short_url });
			}
		}
	);
});

app.get("/api/shorturl/:short_url", async (req, res) => {
	const shorturl = req.params.short_url;
	const urlDoc = await urls.findOne({ short_url: +shorturl });
	res.redirect(urlDoc.url);
});

app.listen(port, function () {
	console.log(`Listening on port ${port}`);
});
