export const getDisplayName = (user: { fullName?: string; firstName?: string; lastName?: string; email?: string } | null | undefined) => {
  if (!user) return 'User';
  if (user.fullName) return user.fullName;
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  if (user.firstName) return user.firstName;
  if (user.email) return user.email.split('@')[0];
  return 'User';
};
