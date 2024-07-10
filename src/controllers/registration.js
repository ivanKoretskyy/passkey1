import {generateRegistrationOptions, verifyRegistrationResponse} from '@simplewebauthn/server';
import {uint8ArrayToBase64} from '../utils/utils.js';
import {rpName, rpID, origin} from '../utils/constants.js';
import {credentialService} from '../services/credentialService.js';
import {userService} from '../services/userService.js'
import { CustomError } from '../middleware/customError.js';


export const handleRegisterStart = async (req, res, next) => {
    const {username} = req.body;

    if (!username) {
        return next(new CustomError('Username empty', 400));
    }

    try {
        let user = await userService.getUserByUsername(username);
        if (user) {
            return next(new CustomError('User already exists', 400));
        } else {
            user = await userService.createUser(username);
        }
        console.info('handleRegisterStart user',user)
        if(!user) {
            next(new CustomError('Internal Server Error', 500));
            return;
        }
        console.info('handleRegisterStart options...')
        console.info(rpName, rpID, user.id,user.username)
        const options = await generateRegistrationOptions({
            rpName,
            rpID,
            userID: user.id,
            userName: user.username,
            timeout: 60000,
            attestationType: 'direct', // none | direct
            excludeCredentials: [],
            authenticatorSelection: {
                //authenticatorAttachment: 'platform', // 'platform', 'cross-platform'
                residentKey: 'preferred',
            },
            // Support for the two most common algorithms: ES256, and RS256
            supportedAlgorithmIDs: [-7, -257],
        });
        req.session.loggedInUserId = user.id;
        req.session.currentChallenge = options.challenge;
        res.send(options);
    } catch (error) {
        console.info('error', error)
        next(error instanceof CustomError ? error : new CustomError('Internal Server Error', 500));
    }
};

export const handleRegisterFinish = async (req, res, next) => {
    const {body} = req;
    const {currentChallenge, loggedInUserId} = req.session;

    if (!loggedInUserId) {
        return next(new CustomError('User ID is missing', 400));
    }

    if (!currentChallenge) {
        return next(new CustomError('Current challenge is missing', 400));
    }

    try {
        const verification = await verifyRegistrationResponse({
            response: body,
            expectedChallenge: currentChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
            requireUserVerification: true,
        });

        if (verification.verified && verification.registrationInfo) {
            const {credentialPublicKey, credentialID, counter} = verification.registrationInfo;

            const transportsString = JSON.stringify(body.response.transports)

            await credentialService.saveNewCredential(
                loggedInUserId,
                uint8ArrayToBase64(credentialID),
                uint8ArrayToBase64(credentialPublicKey),
                counter,
                transportsString);
            res.send({verified: true});
        } else {
            next(new CustomError('Verification failed', 400));
        }
    } catch (error) {
        next(error instanceof CustomError ? error : new CustomError('Internal Server Error', 500));
    } finally {
        req.session.loggedInUserId = undefined;
        req.session.currentChallenge = undefined;
    }
};