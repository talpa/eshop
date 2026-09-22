import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { prisma } from './prisma';

const jwtOpts: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'jwt_secret',
};

passport.use(
  new JwtStrategy(jwtOpts, async (payload, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: payload.id } });
      if (!user) return done(null, false);
      return done(null, user);
    } catch (err) {
      return done(err as Error, false);
    }
  })
);

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const facebookAppId = process.env.FACEBOOK_APP_ID;
const facebookAppSecret = process.env.FACEBOOK_APP_SECRET;

export const isGoogleOAuthEnabled = Boolean(googleClientId && googleClientSecret);
export const isFacebookOAuthEnabled = Boolean(facebookAppId && facebookAppSecret);

const backendUrl = () => process.env.BACKEND_URL || 'http://localhost:3000';
const frontendUrl = () => process.env.FRONTEND_URL || 'http://localhost:5173';
export { frontendUrl };

if (googleClientId && googleClientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: `${backendUrl()}/api/auth/google/callback`,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('Google nevrátil email'), false);

          const existing = await prisma.user.findFirst({
            where: { OR: [{ providerId: profile.id, provider: 'google' }, { email }] },
          });

          if (existing) return done(null, existing);

          const created = await prisma.user.create({
            data: {
              email,
              name: profile.displayName || email.split('@')[0],
              provider: 'google',
              providerId: profile.id,
              avatarUrl: profile.photos?.[0]?.value,
            },
          });
          return done(null, created);
        } catch (err) {
          return done(err as Error, false);
        }
      }
    )
  );
}

if (facebookAppId && facebookAppSecret) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: facebookAppId,
        clientSecret: facebookAppSecret,
        callbackURL: `${backendUrl()}/api/auth/facebook/callback`,
        profileFields: ['id', 'emails', 'name', 'picture'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const syntheticEmail = `fb_${profile.id}@oauth.local`;
          const resolvedEmail = email || syntheticEmail;

          const existing = await prisma.user.findFirst({
            where: email
              ? { OR: [{ providerId: profile.id, provider: 'facebook' }, { email }] }
              : { providerId: profile.id, provider: 'facebook' },
          });

          if (existing) return done(null, existing);

          const created = await prisma.user.create({
            data: {
              email: resolvedEmail,
              name: `${profile.name?.givenName ?? ''} ${profile.name?.familyName ?? ''}`.trim() || resolvedEmail,
              provider: 'facebook',
              providerId: profile.id,
              avatarUrl: profile.photos?.[0]?.value,
            },
          });
          return done(null, created);
        } catch (err) {
          return done(err as Error, false);
        }
      }
    )
  );
}
