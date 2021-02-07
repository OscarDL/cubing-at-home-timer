//modified from https://github.com/saranshgrover/cubing-at-home/blob/master/src/logic/auth.js
import { WCA_UID } from './secrets';

export const localStorageKey = (key) => `WCA-Real-Time.${WCA_UID}.${key}`;

export const initializeAuth = () => {
	const hash = window.location.hash.replace(/^#/, '')
	const hashParams = new URLSearchParams(hash)
	if (hashParams.has('access_token')) {
		localStorage.setItem(
			localStorageKey('accessToken'),
			hashParams.get('access_token')
		)
	}
	if (hashParams.has('expires_in')) {
		/* Expire the token 15 minutes before it actually does,
       this way it doesn't expire right after the user enters the page. */
		const expiresInSeconds = hashParams.get('expires_in') - 15 * 60
		const expirationTime = new Date(
			new Date().getTime() + expiresInSeconds * 1000
		)
		localStorage.setItem(
			localStorageKey('expirationTime'),
			expirationTime.toISOString()
		)
	}
	/* If the token expired, sign the user out. */
	const expirationTime = localStorage.getItem(localStorageKey('expirationTime'))
	if (expirationTime && new Date() >= new Date(expirationTime)) {
		logout()
	}
	/* Clear the hash if there is a token. 
	if (hashParams.has('access_token')) {
		history.replace({ ...history.location, hash: null })
	}
*/
	/* Check if we know what path to redirect to (after OAuth redirect). */
	const redirectPath = localStorage.getItem(localStorageKey('redirectPath'))
	if (redirectPath) {
		window.location.replace(redirectPath)
		localStorage.removeItem(localStorageKey('redirectPath'))
	}
	/* If non-signed in user tries accessing a competition path, redirect to OAuth sign in straightaway. */
	// if (path !== '/' && !isSignedIn()) {
	// 	localStorage.setItem(localStorageKey('redirectPath'), path)
	// 	signIn()
	// }
}

export const wcaAccessToken = () =>
	localStorage.getItem(localStorageKey('accessToken'))

export const login = () => {

  const params = new URLSearchParams({
		client_id: WCA_UID,
		response_type: 'token',
		redirect_uri: window.location.origin,
		scope: 'public',
	})
    
  const url = `https://www.worldcubeassociation.org/oauth/authorize?${params}`;

	localStorage.setItem(localStorageKey('redirectPath'), window.location);

	window.location.replace(url);	
}

export const logout = () => {
    return new Promise((resolve) => {
		localStorage.removeItem(localStorageKey('accessToken'))
		resolve()
	})
}

export const isSignedIn = () => !!wcaAccessToken()