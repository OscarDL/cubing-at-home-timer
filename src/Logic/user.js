import { isSignedIn, wcaAccessToken } from './authorize';

export function getMe() {

  return !isSignedIn()
    ?
  null
    :
  fetch (
    'https://www.worldcubeassociation.org/api/v0/me/',
    {
      headers: new Headers({
        Authorization: `Bearer ${wcaAccessToken()}`,
        'Content-Type': 'application/json'
      })
    }
  ).then(response => {
    if (!response.ok) throw new Error(response.statusText)
    return response
  }).then(response => response.json());
  
}