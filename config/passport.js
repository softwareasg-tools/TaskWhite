const GoogleStrategy = require('passport-google-oauth20').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const { User } = require('../models');

module.exports = function(passport) {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findByPk(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  // Google Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'PLACEHOLDER_CLIENT_ID',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'PLACEHOLDER_CLIENT_SECRET',
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      if (!email) return done(null, false, { message: 'No email found from Google.' });

      let user = await User.findOne({ where: { email } });
      if (user) {
        if (!user.google_id) {
          user.google_id = profile.id;
          await user.save();
        }
        return done(null, user);
      } else {
        return done(null, false, { message: 'You must be invited to login.' });
      }
    } catch (err) {
      console.error(err);
      return done(err, null);
    }
  }));

  // Microsoft Strategy
  passport.use(new MicrosoftStrategy({
    clientID: process.env.MICROSOFT_CLIENT_ID || 'PLACEHOLDER_CLIENT_ID',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || 'PLACEHOLDER_CLIENT_SECRET',
    callbackURL: "/auth/microsoft/callback",
    scope: ['user.read']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      if (!email) return done(null, false, { message: 'No email found from Microsoft.' });

      let user = await User.findOne({ where: { email } });
      if (user) {
        if (!user.microsoft_id) {
          user.microsoft_id = profile.id;
          await user.save();
        }
        return done(null, user);
      } else {
        return done(null, false, { message: 'You must be invited to login.' });
      }
    } catch (err) {
      console.error(err);
      return done(err, null);
    }
  }));
};
