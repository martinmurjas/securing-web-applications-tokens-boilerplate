// Third Party Imports
import axios from 'axios'
import dotenv from 'dotenv'
import express, { json } from 'express';

// gets variables from .env file and adds to the process.env object
dotenv.config()

// create an instance of express
const app = express();

// get the port number from the environment variables or default to 6001
const PORT = process.env.PORT || 6001;

// set up middleware to parse incoming json data
app.use(json({ extended: false }));

// set up redirect URL to which leads user to the Google Login page
app.get('/api/redirectUrl', async (req, res) => {

	// Goolgle URL where user can login in/authorize our application for access
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";

	// Options required as query parameters by Google
  const options = {
    redirect_uri: process.env.VITE_GOOGLE_OAUTH_REDIRECT_URI, // our backend route Google should redirect to
    client_id: process.env.VITE_CLIENT_ID, // our client ID so Google knows who we are
    access_type: "online", // only need to confirm the user w/ Google so we select 'online', 'offline' is good if your app will regularly connect to Goolge (ie accessing emails or calendar)
    response_type: "code", // determines what Google returns to us, 'code' is recommended as it requires additional steps to retrieve access/refresh tokens so this is more secure
    prompt: "consent", // forces Google to display the concent screen even if use has logged in before
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "), // list of scopes (permissions) your app is requesting access to
  };

	// creates a query string out of our options object
  const queryString = new URLSearchParams(options).toString();

	// creates final URL needed to redirect the user to Google with necessary query parameters included
  const url = `${rootUrl}?${queryString.toString()}`

	// returns the URL to the client
  res.send(url)
})

app.get('/api/oauth', async (req, res) => {
	try{
		// retrieves the authorization code from the request provided by Google
		const code = req.query.code

		// URL used to exchange authorization code and credentials for access & id tokens
		const url = 'https://oauth2.googleapis.com/token';

		// sets up object to hold options which will be converted to query parameters
		const options = {
			code, // we include the unique code provided by Google
			client_id: process.env.VITE_CLIENT_ID, // our Client ID to identify ourselves to Google
			client_secret: process.env.VITE_CLIENT_SECRET, // our Client Secret to confirm to Google we are who we say we are
			redirect_uri: process.env.VITE_GOOGLE_OAUTH_REDIRECT_URI, // our backend route Google should redirect to
			grant_type: 'authorization_code', // we are using an authorization code since google sent use that code (included above)
		};

		// built in function to create the query string parameters from the values object above
		const queryString = new URLSearchParams(options);

		// request to the googleAPI to retrieve the id and access tokens using our client info and the authorization code
		const { id_token, access_token } = (
			await axios.post(url, queryString.toString(), {
				headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
				},
			})
		).data;

		// uses previously retreived access and id tokens to retrieve the user data from the google userInfo api
		const googleUser = (await axios.get(
			`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
			{
				headers: {
					Authorization: `Bearer ${id_token}`,
				},
			}
		)).data;

		// sets the username cookie on the client
		res.cookie('username', googleUser.given_name);

		// redirects the  user back to our home page
    res.redirect('http://localhost:3000');
	} catch (err) {
		res.status(500).json({error: err.message})
	}
});

const startUp = async () => {

    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
}

startUp()

