import { generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
import { uint8ArrayToBase64, base64ToUint8Array } from '../utils/utils.js';
import { rpID, origin } from '../utils/constants.js';
import {credentialService} from '../services/credentialService.js';
import {userService} from '../services/userService.js'
import {isoBase64URL} from "@simplewebauthn/server/helpers";
import { CustomError } from '../middleware/customError.js';


export const handleLoginStart = async (req, res, next) => {
    const {username} = req.body;
    try {
        const user = await userService.getUserByUsername(username);
        if (!user) {
            return next(new CustomError('User not found', 404));
        }
        console.info('user', user);

        req.session.loggedInUserId = user.id;

        // allowCredentials is purposely for this demo left empty. This causes all existing local credentials
        // to be displayed for the service instead only the ones the username has registered.
        const options = await generateAuthenticationOptions({
            timeout: 60000,
            allowCredentials: [],
            userVerification: 'required',
            rpID,
        });
        console.info('options', options)
        req.session.currentChallenge = options.challenge;
        res.send(options);
    } catch (error) {
        next(error instanceof CustomError ? error : new CustomError('Internal Server Error', 500));
    }
};

export const handleLoginFinish = async (req, res, next) => {
    const {body} = req;
    const {currentChallenge, loggedInUserId} = req.session;


    if (!loggedInUserId) {
        return next(new CustomError('User ID is missing', 400));
    }

    if (!currentChallenge) {
        return next(new CustomError('Current challenge is missing', 400));
    }

    try {

        const credentialID = isoBase64URL.toBase64(body.rawId);
        const bodyCredIDBuffer = isoBase64URL.toBuffer(body.rawId);
        const dbCredential = await credentialService.getCredentialByCredentialId(credentialID);
        if (!dbCredential) {
            return next(new CustomError('Credential not registered with this site', 404));
        }

        // @ts-ignore
        const user = await userService.getUserById(dbCredential.userID);
        if (!user) {
            return next(new CustomError('User not found', 404));
        }

        // @ts-ignore
        dbCredential.credentialID = base64ToUint8Array(dbCredential.credentialID)
        // @ts-ignore
        dbCredential.credentialPublicKey = base64ToUint8Array(dbCredential.credentialPublicKey)


        let verification;
        const opts = {
            response: body,
            expectedChallenge: currentChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
            authenticator: dbCredential,
        };
        verification = await verifyAuthenticationResponse(opts);
        const { verified, authenticationInfo } = verification;

        if (verified) {
            await credentialService.updateCredentialCounter(
                uint8ArrayToBase64(bodyCredIDBuffer),
                authenticationInfo.newCounter
            );
            res.send({verified: true});
        } else {
            next(new CustomError('Verification failed', 400));
        }
    } catch (error) {
        next(error instanceof CustomError ? error : new CustomError('Internal Server Error', 500));
    } finally {
        req.session.currentChallenge = undefined;
        req.session.loggedInUserId = undefined;
    }
};