const element = document.currentScript.parentElement;

const settings = JSON.parse(
	decodeURIComponent(document.currentScript.dataset.settings)
);

function renderTemplate(template, data = {}) {
	return template.replace(/\$\{data\.(\w+)\}/g, (_, key) => data[key] ?? "");
}

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
					token:         settings.spotifytoken,
					client_id:     settings.spotify_client_id,
					client_secret: settings.spotify_client_secret
				})
			}
		);

		const data = await res.json();
		if (!data.online && !settings.offline_status) {
			element.innerHTML = renderTemplate(settings.offline_html, data);
			return;
		}

		element.innerHTML = renderTemplate(settings.custom_html, data);

	} catch (err) {
		console.log("Spotify has revoked your API token, please contact widgetstar dev for a workaround")
		console.error("Spotify has revoked your API token, please contact widgetstar dev for a workaround");
		element.innerHTML = renderTemplate(settings.offline_html, {});
	}
}

loadSpotify();