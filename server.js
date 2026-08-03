const app = require("./express");
const spotify = require("./spotify");
const spotistatus = require("./spotistatus");

app.post("/spotify-user", spotify.userCurrent);

app.use("/", spotistatus);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log(`Node server running on port ${PORT}`);
});