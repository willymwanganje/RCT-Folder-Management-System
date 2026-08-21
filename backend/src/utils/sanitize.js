function sanitizeUser(user) {
  if (!user) return null;
  const {
    passwordHash,
    passwordResets,
    ...safe
  } = user;
  return safe;
}

function publicUploader(user) {
  if (!user) return null;
  return {
    id: user.id,
    fullName: user.fullName,
    profilePhotoUrl: user.profilePhotoUrl || null,
  };
}

module.exports = { sanitizeUser, publicUploader };
