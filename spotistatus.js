require("dotenv").config();

const express = require("express");
const router = express.Router();

router.get("/login", (req, res) => {
	const params = new URLSearchParams({
		client_id: process.env.SPOTIFY_CLIENT_ID,
		response_type: "code",
		redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
		scope: "user-read-currently-playing",
		show_dialog: "true"
	});

	res.redirect(
		"https://accounts.spotify.com/authorize?" + params.toString()
	);
});


router.get("/spotify-callback", async (req, res) => {
	try {
		const code = req.query.code;

		if (!code) {
			return res.status(400).send("Missing code");
		}

		const response = await fetch(
			"https://accounts.spotify.com/api/token",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					"Authorization":
						"Basic " +
						Buffer.from(
							`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
						).toString("base64")
				},
				body: new URLSearchParams({
					grant_type: "authorization_code",
					code,
					redirect_uri: process.env.SPOTIFY_REDIRECT_URI
				})
			}
		);

		const data = await response.json();

		if (!response.ok) {
			throw new Error(JSON.stringify(data));
		}

		res.redirect(
			"/?token=" + encodeURIComponent(data.refresh_token)
		);

	} catch (err) {
		console.error(err);
		res.status(500).send("Spotify authentication failed");
	}
});


module.exports = router;