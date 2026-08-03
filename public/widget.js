const element = document.currentScript.parentElement;

const settings = JSON.parse(
	decodeURIComponent(document.currentScript.dataset.settings)
);

async function loadSpotify() {
	try {
		const res = await fetch(
			"https://spotistatus.onrender.com/spotify-user",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					token: settings.spotifytoken
				})
			}
		);

		const data = await res.json();

		if (!data.online) {
			element.innerHTML = "Not listening to anything";
			return;
		}

		element.innerHTML = `
			<div class="spotistatus-widget">
				<img class="spotistatus-album-art" src="${data.img}" alt="Album art">

				<a class="spotistatus-song" href="${data.songUrl}" target="_blank">
					${data.song}
				</a>

				<a class="spotistatus-artist" href="${data.artistUrl}" target="_blank">
					${data.artist}
				</a>

				<a class="spotistatus-album" href="${data.albumUrl}" target="_blank">
					${data.album}
				</a>
			</div>
		`;

	} catch (err) {
		console.error(err);
		element.innerHTML = "Spotify unavailable";
	}
}

loadSpotify();