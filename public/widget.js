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

		if (!data.online && !settings.offline_status) {
			element.innerHTML = settings.offline_html;
			return;
		}

		element.innerHTML = settings.custom_html;

	} catch (err) {
		console.error(err);
		element.innerHTML = settings.offline_html;
	}
}

loadSpotify();