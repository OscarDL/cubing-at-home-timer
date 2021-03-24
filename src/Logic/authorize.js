//modified from https://github.com/saranshgrover/cubing-at-home/blob/master/src/logic/auth.js
export const localStorageKey = (key) => `WCA-Real-Time.${process.env.WCA_UID}.${key}`;

export const initializeAuth = () => {
  console.log(process.env);
  console.log('wca', process.env.WCA_UID);
  console.log('api key', process.env.FB_API_KEY);
  console.log('measurement id', process.env.MEASUREMENT_ID);
  console.log('app id', process.env.APP_ID);

	const hash = window.location.hash.replace(/^#/, '');
	const hashParams = new URLSearchParams(hash);

	if (hashParams.has('access_token')) {
		localStorage.setItem(
			localStorageKey('accessToken'),
			hashParams.get('access_token')
		);
	}
  
	if (hashParams.has('expires_in')) {
		/* Expire the token 15 minutes before it actually does,
       this way it doesn't expire right after the user enters the page. */
		const expiresInSeconds = hashParams.get('expires_in') - 15 * 60;
		const expirationTime = new Date(new Date().getTime() + expiresInSeconds * 1000);

		localStorage.setItem(
			localStorageKey('expirationTime'),
			expirationTime.toISOString()
		);
	}

	/* If the token expired, sign the user out. */
	const expirationTime = localStorage.getItem(localStorageKey('expirationTime'))
	if (expirationTime && new Date() >= new Date(expirationTime)) logout();
  
	/* Check if we know what path to redirect to (after OAuth redirect). */
	const redirectPath = localStorage.getItem(localStorageKey('redirectPath'));
	if (redirectPath) {
		window.location.replace(redirectPath);
		localStorage.removeItem(localStorageKey('redirectPath'));
	}
}

export const wcaAccessToken = () =>
	localStorage.getItem(localStorageKey('accessToken'));

export const login = () => {
  const params = new URLSearchParams({
		client_id: process.env.WCA_UID,
		response_type: 'token',
		redirect_uri: window.location.origin,
		scope: 'public',
	});
    
  const url = process.env.NODE_ENV === 'production'
    ?
  `https://www.worldcubeassociation.org/oauth/authorize?${params}`
    :
  `https://staging.worldcubeassociation.org/oauth/authorize?${params}`;

	localStorage.setItem(localStorageKey('redirectPath'), window.location);
	window.location.replace(url);	
}

export const logout = () => {
  return new Promise((resolve) => {
		localStorage.removeItem(localStorageKey('accessToken'));
		resolve();
	});
}

export const isSignedIn = () => !!wcaAccessToken();