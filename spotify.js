require("dotenv").config();

async function userCurrent(req, res) {
try {
	const refreshToken = req.body.token;
	const clientId =     req.body.client_id || process.env.SPOTIFY_CLIENT_ID;
	const clientSecret = req.body.client_secret || process.env.SPOTIFY_CLIENT_SECRET;

	if (!refreshToken) {
	return res.status(400).json({
		error: "Missing token"
	});
	}

	if (!clientId || !clientSecret) {
	return res.status(400).json({
		error: "Missing Spotify client credentials"
	});
	}

	// Get access token
	const response = await fetch(
	"https://accounts.spotify.com/api/token",
	{
		method: "POST",
		headers: {
		"Content-Type": "application/x-www-form-urlencoded",
			"Authorization":
				"Basic " +
				Buffer.from(
					`${clientId}:${clientSecret}`
				).toString("base64")
		},
		body: new URLSearchParams({
		grant_type: "refresh_token",
		refresh_token: refreshToken
		})
	}
	);

	let tokenData;
	try{
		tokenData = await response.json();

		if (!response.ok) {
			throw new Error(tokenData);
		}
	} catch{
		throw new Error("Spotify has revoked your API token, please contact widgetstar dev for a workaround");
	}

	const accessToken = tokenData.access_token;

	// Check currently playing first
	const spotifyResponse = await fetch(
	"https://api.spotify.com/v1/me/player/currently-playing",
	{
		headers: {
		Authorization: `Bearer ${accessToken}`
		}
	}
	);

	// If currently playing, return that
	if (spotifyResponse.status !== 204) {
	const data = await spotifyResponse.json();

	return res.json({
		online: true,
		song: data.item.name,
		songUrl: data.item.external_urls.spotify,
		artist: data.item.artists[0].name,
		artistUrl: data.item.artists[0].external_urls.spotify,
		album: data.item.album.name,
		albumUrl: data.item.album.external_urls.spotify,
		img: data.item.album.images[1]?.url || "",
	});
	}

	// If nothing playing, get last played
	const lastResponse = await fetch(
	"https://api.spotify.com/v1/me/player/recently-played?limit=1",
	{
		headers: {
		Authorization: `Bearer ${accessToken}`
		}
	}
	);

	const lastData = await lastResponse.json();

	if (!lastData.items || lastData.items.length === 0) {
	return res.json({
		online: false
	});
	}

	const item = lastData.items[0].track;

	res.json({
	online: false,
	song: item.name,
	songUrl: item.external_urls.spotify,
	artist: item.artists[0].name,
	artistUrl: item.artists[0].external_urls.spotify,
	album: item.album.name,
	albumUrl: item.album.external_urls.spotify,
	img: item.album.images[1]?.url || "",
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