require("dotenv").config();

const express = require("express");
const crypto = require("crypto");

const router = express.Router();

// Temporary OAuth sessions
const oauthSessions = new Map();

router.get("/login", (req, res) => {
	const clientId = req.query.client_id;
	const clientSecret = req.query.client_secret;

	if (!clientId || !clientSecret) {
		return res.status(400).send(
			"Missing Spotify Client ID or Client Secret"
		);
	}

	// Generate a random state value
	const state = crypto.randomBytes(32).toString("hex");

	// Store credentials temporarily
	oauthSessions.set(state, {
		clientId,
		clientSecret,
		createdAt: Date.now()
	});

	const params = new URLSearchParams({
		client_id: clientId,
		response_type: "code",
		redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
		scope: "user-read-currently-playing user-read-recently-played",
		show_dialog: "true",
		state
	});

	res.redirect(
		"https://accounts.spotify.com/authorize?" +
		params.toString()
	);
});


router.get("/spotify-callback", async (req, res) => {
	try {
		const code = req.query.code;
		const state = req.query.state;

		if (!code) {
			return res.status(400).send("Missing code");
		}

		if (!state) {
			return res.status(400).send("Missing state");
		}

		const session = oauthSessions.get(state);

		if (!session) {
			return res.status(400).send(
				"Invalid or expired OAuth session"
			);
		}

		// Delete immediately so the state cannot be reused
		oauthSessions.delete(state);

		// Expire sessions after 10 minutes
		if (Date.now() - session.createdAt > 10 * 60 * 1000) {
			return res.status(400).send(
				"OAuth session expired. Please try again."
			);
		}

		const response = await fetch(
			"https://accounts.spotify.com/api/token",
			{
				method: "POST",
				headers: {
					"Content-Type":
						"application/x-www-form-urlencoded",

					"Authorization":
						"Basic " +
						Buffer.from(
							`${session.clientId}:${session.clientSecret}`
						).toString("base64")
				},

				body: new URLSearchParams({
					grant_type: "authorization_code",
					code,
					redirect_uri:
						process.env.SPOTIFY_REDIRECT_URI
				})
			}
		);

		const responseText = await response.text();

		let data;

		try {
			data = JSON.parse(responseText);
		} catch {
			data = {
				error: responseText
			};
		}

		if (!response.ok) {
			throw new Error(
				data.error_description ||
				data.error ||
				"Spotify authentication failed"
			);
		}

		if (!data.refresh_token) {
			throw new Error(
				"Spotify did not return a refresh token"
			);
		}

		res.redirect(
			"/?token=" +
			encodeURIComponent(data.refresh_token)
		);

	} catch (err) {
		console.error(err);
		res.status(500).send(
			"Spotify authentication failed: " +
			err.message
		);
	}
});

module.exports = router;