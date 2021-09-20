// Thanks to https://coolaj86.com/articles/lets-encrypt-v2-step-by-step/ for the great walkthrough

function urlSafeBase64(input) {
	return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function jsonToURLSafeBase64(json) {
	return urlSafeBase64(JSON.stringify(json));
}

async function pemEncodePrivateKey(key) {
	// Convert an ArrayBuffer into a string (from https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String)
	function ab2str(buf) {
		return String.fromCharCode.apply(null, new Uint8Array(buf));
	}
	const exported = await window.crypto.subtle.exportKey("pkcs8", key);
	const exportedAsString = ab2str(exported);
	const exportedAsBase64 = window.btoa(exportedAsString);
	const pemExported = `-----BEGIN PRIVATE KEY-----\n${exportedAsBase64}\n-----END PRIVATE KEY-----`.replace(/.{64}/g, "$&\n");
	return pemExported;
}

async function createNewACMEAccount(directoryURL, email) {
	// get directory
	const dirResp = await window.fetch(directoryURL);
	const directory = await dirResp.json();

	// get initial nonce
	const nonceResp = await window.fetch(directory.newNonce);
	let nonce = nonceResp.headers.get('Replay-Nonce');

	// generate account key
	const keyParams = {
		name: "ECDSA",
		namedCurve: "P-256"
	};
	const keyPair = await window.crypto.subtle.generateKey(keyParams, true, ["sign", "verify"]);
	
	// generate jwk
	const accountJWK = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);

	// sign account
	const textEncoder = new TextEncoder();
	const payload64 = jsonToURLSafeBase64({
		termsOfServiceAgreed: true,
		contact: ["mailto:"+email]
	});
	const protected64 = jsonToURLSafeBase64({
		nonce: nonce,
		url: directory.newAccount,
		alg: "ES256",
		jwk: {
			kty: accountJWK.kty,
			crv: accountJWK.crv,
			x: accountJWK.x,
			y: accountJWK.y
		}
	});
	const signature = await window.crypto.subtle.sign(
		{ name: "ECDSA", hash: { name: "SHA-256" } },
		keyPair.privateKey,
		textEncoder.encode(protected64 + '.' + payload64)
	);

	// convert signature bytes to URL-safe base64
	const signatureStr = Array.prototype.map.call(new Uint8Array(signature), function (ch) {
		return String.fromCharCode(ch);
	}).join('');
	const urlSafeBase64Signature = urlSafeBase64(signatureStr);

	// create account
	const signedAccount = {
		protected: protected64,
		payload: payload64,
		signature: urlSafeBase64Signature
	};
	const newAccountResp = await window.fetch(directory.newAccount, {
		mode: "cors",
		method: "POST",
		headers: {"Content-Type": "application/jose+json"},
		body: JSON.stringify(signedAccount)
	});
	nonce = newAccountResp.headers.get("Replay-Nonce");

	
	// TODO: for debug, I guess
	// let accountID = newAccountResp.headers.get("Location");
	// console.log("NEXT NONCE:", nonce);
	// console.log("ACCOUNT LOCATION:", accountID);
	// let account = await newAccountResp.json();
	// console.log("CREATED ACCOUNT:", account);

	return keyPair;
}

createNewACMEAccount("/acme/devtest/directory", "foo@bar.com").then(keyPair => {
	console.log("RESULTING KEY PAIR:", keyPair);
	pemEncodePrivateKey(keyPair.privateKey).then(pemEncoded => console.log(pemEncoded));
});
