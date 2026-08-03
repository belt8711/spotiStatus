require("dotenv").config();

async function userCurrent(req, res) {
	try {
		const refreshToken = req.body.token;

		if (!refreshToken) {
			return res.status(400).json({
				error: "Missing token"
			});
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
					grant_type: "refresh_token",
					refresh_token: refreshToken
				})
			}
		);

		const tokenData = await response.json();

		if (!response.ok) {
			throw new Error(JSON.stringify(tokenData));
		}

		const accessToken = tokenData.access_token;

		const spotifyResponse = await fetch(
			"https://api.spotify.com/v1/me/player/currently-playing",
			{
				headers: {
					Authorization: `Bearer ${accessToken}`
				}
			}
		);

		if (spotifyResponse.status === 204) {
			return res.json({
				online: false
			});
		}

		const data = await spotifyResponse.json();

		res.json({
			online: true,
			song: data.item.name,
			songUrl: data.item.external_urls.spotify,
			artist: data.item.artists[0].name,
			artistUrl: data.item.artists[0].external_urls.spotify,
			album: data.item.album.name,
			albumUrl: data.item.album.external_urls.spotify,
			img: data.item.album.images[1]?.url || ""
		});

	} catch (err) {
		console.error(err);

		res.status(500).json({
			error: err.message
		});
	}
}

module.exports = {
	userCurrent
};