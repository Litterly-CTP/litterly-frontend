/*! firebase-admin v8.7.0 */
"use strict";
/*!
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
// Use untyped import syntax for Node built-ins
var fs = require("fs");
var os = require("os");
var path = require("path");
var error_1 = require("../utils/error");
var api_request_1 = require("../utils/api-request");
var GOOGLE_TOKEN_AUDIENCE = 'https://accounts.google.com/o/oauth2/token';
var GOOGLE_AUTH_TOKEN_HOST = 'accounts.google.com';
var GOOGLE_AUTH_TOKEN_PATH = '/o/oauth2/token';
// NOTE: the Google Metadata Service uses HTTP over a vlan
var GOOGLE_METADATA_SERVICE_HOST = 'metadata.google.internal';
var GOOGLE_METADATA_SERVICE_PATH = '/computeMetadata/v1/instance/service-accounts/default/token';
var configDir = (function () {
    // Windows has a dedicated low-rights location for apps at ~/Application Data
    var sys = os.platform();
    if (sys && sys.length >= 3 && sys.substring(0, 3).toLowerCase() === 'win') {
        return process.env.APPDATA;
    }
    // On *nix the gcloud cli creates a . dir.
    return process.env.HOME && path.resolve(process.env.HOME, '.config');
})();
var GCLOUD_CREDENTIAL_SUFFIX = 'gcloud/application_default_credentials.json';
var GCLOUD_CREDENTIAL_PATH = configDir && path.resolve(configDir, GCLOUD_CREDENTIAL_SUFFIX);
var REFRESH_TOKEN_HOST = 'www.googleapis.com';
var REFRESH_TOKEN_PATH = '/oauth2/v4/token';
var ONE_HOUR_IN_SECONDS = 60 * 60;
var JWT_ALGORITHM = 'RS256';
function copyAttr(to, from, key, alt) {
    var tmp = from[key] || from[alt];
    if (typeof tmp !== 'undefined') {
        to[key] = tmp;
    }
}
var RefreshToken = /** @class */ (function () {
    function RefreshToken(json) {
        copyAttr(this, json, 'clientId', 'client_id');
        copyAttr(this, json, 'clientSecret', 'client_secret');
        copyAttr(this, json, 'refreshToken', 'refresh_token');
        copyAttr(this, json, 'type', 'type');
        var errorMessage;
        if (typeof this.clientId !== 'string' || !this.clientId) {
            errorMessage = 'Refresh token must contain a "client_id" property.';
        }
        else if (typeof this.clientSecret !== 'string' || !this.clientSecret) {
            errorMessage = 'Refresh token must contain a "client_secret" property.';
        }
        else if (typeof this.refreshToken !== 'string' || !this.refreshToken) {
            errorMessage = 'Refresh token must contain a "refresh_token" property.';
        }
        else if (typeof this.type !== 'string' || !this.type) {
            errorMessage = 'Refresh token must contain a "type" property.';
        }
        if (typeof errorMessage !== 'undefined') {
            throw new error_1.FirebaseAppError(error_1.AppErrorCodes.INVALID_CREDENTIAL, errorMessage);
        }
    }
    /*
     * Tries to load a RefreshToken from a path. If the path is not present, returns null.
     * Throws if data at the path is invalid.
     */
    RefreshToken.fromPath = function (filePath) {
        var jsonString;
        try {
            jsonString = fs.readFileSync(filePath, 'utf8');
        }
        catch (ignored) {
            // Ignore errors if the file is not present, as this is sometimes an expected condition
            return null;
        }
        try {
            return new RefreshToken(JSON.parse(jsonString));
        }
        catch (error) {
            // Throw a nicely formed error message if the file contents cannot be parsed
            throw new error_1.FirebaseAppError(error_1.AppErrorCodes.INVALID_CREDENTIAL, 'Failed to parse refresh token file: ' + error);
        }
    };
    return RefreshToken;
}());
exports.RefreshToken = RefreshToken;
/**
 * A struct containing the properties necessary to use service-account JSON credentials.
 */
var Certificate = /** @class */ (function () {
    function Certificate(json) {
        if (typeof json !== 'object' || json === null) {
            throw new error_1.FirebaseAppError(error_1.AppErrorCodes.INVALID_CREDENTIAL, 'Certificate object must be an object.');
        }
        copyAttr(this, json, 'projectId', 'project_id');
        copyAttr(this, json, 'privateKey', 'private_key');
        copyAttr(this, json, 'clientEmail', 'client_email');
        var errorMessage;
        if (typeof this.privateKey !== 'string' || !this.privateKey) {
            errorMessage = 'Certificate object must contain a string "private_key" property.';
        }
        else if (typeof this.clientEmail !== 'string' || !this.clientEmail) {
            errorMessage = 'Certificate object must contain a string "client_email" property.';
        }
        if (typeof errorMessage !== 'undefined') {
            throw new error_1.FirebaseAppError(error_1.AppErrorCodes.INVALID_CREDENTIAL, errorMessage);
        }
        var forge = require('node-forge');
        try {
            forge.pki.privateKeyFromPem(this.privateKey);
        }
        catch (error) {
            throw new error_1.FirebaseAppError(error_1.AppErrorCodes.INVALID_CREDENTIAL, 'Failed to parse private key: ' + error);
        }
    }
    Certificate.fromPath = function (filePath) {
        // Node bug encountered in v6.x. fs.readFileSync hangs when path is a 0 or 1.
        if (typeof filePath !== 'string') {
            throw new error_1.FirebaseAppError(error_1.AppErrorCodes.INVALID_CREDENTIAL, 'Failed to parse certificate key file: TypeError: path must be a string');
        }
        try {
            return new Certificate(JSON.parse(fs.readFileSync(filePath, 'utf8')));
        }
        catch (error) {
            // Throw a nicely formed error message if the file contents cannot be parsed
            throw new error_1.FirebaseAppError(error_1.AppErrorCodes.INVALID_CREDENTIAL, 'Failed to parse certificate key file: ' + error);
        }
    };
    return Certificate;
}());
exports.Certificate = Certificate;
/**
 * Obtain a new OAuth2 token by making a remote service call.
 */
function requestAccessToken(client, request) {
    return client.send(request).then(function (resp) {
        var json = resp.data;
        if (!json.access_token || !json.expires_in) {
            throw new error_1.FirebaseAppError(error_1.AppErrorCodes.INVALID_CREDENTIAL, "Unexpected response while fetching access token: " + JSON.stringify(json));
        }
        return json;
    }).catch(function (err) {
        throw new error_1.FirebaseAppError(error_1.AppErrorCodes.INVALID_CREDENTIAL, getErrorMessage(err));
    });
}
/**
 * Constructs a human-readable error message from the given Error.
 */
function getErrorMessage(err) {
    var detail = (err instanceof api_request_1.HttpError) ? getDetailFromResponse(err.response) : err.message;
    return "Error fetching access token: " + detail;
}
/**
 * Extracts details from the given HTTP error response, and returns a human-readable description. If
 * the response is JSON-formatted, looks up the error and error_description fields sent by the
 * Google Auth servers. Otherwise returns the entire response payload as the error detail.
 */
function getDetailFromResponse(response) {
    if (response.isJson() && response.data.error) {
        var json = response.data;
        var detail = json.error;
        if (json.error_description) {
            detail += ' (' + json.error_description + ')';
        }
        return detail;
    }
    return response.text;
}
/**
 * Implementation of Credential that uses a service account certificate.
 */
var CertCredential = /** @class */ (function () {
    function CertCredential(serviceAccountPathOrObject, httpAgent) {
        this.certificate = (typeof serviceAccountPathOrObject === 'string') ?
            Certificate.fromPath(serviceAccountPathOrObject) : new Certificate(serviceAccountPathOrObject);
        this.httpClient = new api_request_1.HttpClient();
        this.httpAgent = httpAgent;
    }
    CertCredential.prototype.getAccessToken = function () {
        var token = this.createAuthJwt_();
        var postData = 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3A' +
            'grant-type%3Ajwt-bearer&assertion=' + token;
        var request = {
            method: 'POST',
            url: "https://" + GOOGLE_AUTH_TOKEN_HOST + GOOGLE_AUTH_TOKEN_PATH,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: postData,
            httpAgent: this.httpAgent,
        };
        return requestAccessToken(this.httpClient, request);
    };
    CertCredential.prototype.getCertificate = function () {
        return this.certificate;
    };
    CertCredential.prototype.createAuthJwt_ = function () {
        var claims = {
            scope: [
                'https://www.googleapis.com/auth/cloud-platform',
                'https://www.googleapis.com/auth/firebase.database',
                'https://www.googleapis.com/auth/firebase.messaging',
                'https://www.googleapis.com/auth/identitytoolkit',
                'https://www.googleapis.com/auth/userinfo.email',
            ].join(' '),
        };
        var jwt = require('jsonwebtoken');
        // This method is actually synchronous so we can capture and return the buffer.
        return jwt.sign(claims, this.certificate.privateKey, {
            audience: GOOGLE_TOKEN_AUDIENCE,
            expiresIn: ONE_HOUR_IN_SECONDS,
            issuer: this.certificate.clientEmail,
            algorithm: JWT_ALGORITHM,
        });
    };
    return CertCredential;
}());
exports.CertCredential = CertCredential;
/**
 * Attempts to extract a Certificate from the given credential.
 *
 * @param {Credential} credential A Credential instance.
 * @return {Certificate} A Certificate instance or null.
 */
function tryGetCertificate(credential) {
    if (isFirebaseCredential(credential)) {
        return credential.getCertificate();
    }
    return null;
}
exports.tryGetCertificate = tryGetCertificate;
function isFirebaseCredential(credential) {
    return 'getCertificate' in credential;
}
/**
 * Implementation of Credential that gets access tokens from refresh tokens.
 */
var RefreshTokenCredential = /** @class */ (function () {
    function RefreshTokenCredential(refreshTokenPathOrObject, httpAgent) {
        this.refreshToken = (typeof refreshTokenPathOrObject === 'string') ?
            RefreshToken.fromPath(refreshTokenPathOrObject) : new RefreshToken(refreshTokenPathOrObject);
        this.httpClient = new api_request_1.HttpClient();
        this.httpAgent = httpAgent;
    }
    RefreshTokenCredential.prototype.getAccessToken = function () {
        var postData = 'client_id=' + this.refreshToken.clientId + '&' +
            'client_secret=' + this.refreshToken.clientSecret + '&' +
            'refresh_token=' + this.refreshToken.refreshToken + '&' +
            'grant_type=refresh_token';
        var request = {
            method: 'POST',
            url: "https://" + REFRESH_TOKEN_HOST + REFRESH_TOKEN_PATH,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: postData,
            httpAgent: this.httpAgent,
        };
        return requestAccessToken(this.httpClient, request);
    };
    return RefreshTokenCredential;
}());
exports.RefreshTokenCredential = RefreshTokenCredential;
/**
 * Implementation of Credential that gets access tokens from the metadata service available
 * in the Google Cloud Platform. This authenticates the process as the default service account
 * of an App Engine instance or Google Compute Engine machine.
 */
var MetadataServiceCredential = /** @class */ (function () {
    function MetadataServiceCredential(httpAgent) {
        this.httpClient = new api_request_1.HttpClient();
        this.httpAgent = httpAgent;
    }
    MetadataServiceCredential.prototype.getAccessToken = function () {
        var request = {
            method: 'GET',
            url: "http://" + GOOGLE_METADATA_SERVICE_HOST + GOOGLE_METADATA_SERVICE_PATH,
            headers: {
                'Metadata-Flavor': 'Google',
            },
            httpAgent: this.httpAgent,
        };
        return requestAccessToken(this.httpClient, request);
    };
    return MetadataServiceCredential;
}());
exports.MetadataServiceCredential = MetadataServiceCredential;
/**
 * ApplicationDefaultCredential implements the process for loading credentials as
 * described in https://developers.google.com/identity/protocols/application-default-credentials
 */
var ApplicationDefaultCredential = /** @class */ (function () {
    function ApplicationDefaultCredential(httpAgent) {
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            this.credential_ = credentialFromFile(process.env.GOOGLE_APPLICATION_CREDENTIALS, httpAgent);
            return;
        }
        // It is OK to not have this file. If it is present, it must be valid.
        var refreshToken = RefreshToken.fromPath(GCLOUD_CREDENTIAL_PATH);
        if (refreshToken) {
            this.credential_ = new RefreshTokenCredential(refreshToken, httpAgent);
            return;
        }
        this.credential_ = new MetadataServiceCredential(httpAgent);
    }
    ApplicationDefaultCredential.prototype.getAccessToken = function () {
        return this.credential_.getAccessToken();
    };
    ApplicationDefaultCredential.prototype.getCertificate = function () {
        return tryGetCertificate(this.credential_);
    };
    // Used in testing to verify we are delegating to the correct implementation.
    ApplicationDefaultCredential.prototype.getCredential = function () {
        return this.credential_;
    };
    return ApplicationDefaultCredential;
}());
exports.ApplicationDefaultCredential = ApplicationDefaultCredential;
function credentialFromFile(filePath, httpAgent) {
    var credentialsFile = readCredentialFile(filePath);
    if (typeof credentialsFile !== 'object') {
        throw new error_1.FirebaseAppError(error_1.AppErrorCodes.INVALID_CREDENTIAL, 'Failed to parse contents of the credentials file as an object');
    }
    if (credentialsFile.type === 'service_account') {
        return new CertCredential(credentialsFile, httpAgent);
    }
    if (credentialsFile.type === 'authorized_user') {
        return new RefreshTokenCredential(credentialsFile, httpAgent);
    }
    throw new error_1.FirebaseAppError(error_1.AppErrorCodes.INVALID_CREDENTIAL, 'Invalid contents in the credentials file');
}
function readCredentialFile(filePath) {
    if (typeof filePath !== 'string') {
        throw new error_1.FirebaseAppError(error_1.AppErrorCodes.INVALID_CREDENTIAL, 'Failed to parse credentials file: TypeError: path must be a string');
    }
    var fileText;
    try {
        fileText = fs.readFileSync(filePath, 'utf8');
    }
    catch (error) {
        throw new error_1.FirebaseAppError(error_1.AppErrorCodes.INVALID_CREDENTIAL, "Failed to read credentials from file " + filePath + ": " + error);
    }
    try {
        return JSON.parse(fileText);
    }
    catch (error) {
        throw new error_1.FirebaseAppError(error_1.AppErrorCodes.INVALID_CREDENTIAL, 'Failed to parse contents of the credentials file as an object: ' + error);
    }
}
