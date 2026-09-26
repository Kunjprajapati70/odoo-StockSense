export function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    preferences: user.preferences || { emailAlerts: true, compactTables: false },
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
